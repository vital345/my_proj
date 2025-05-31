from datetime import datetime
import os
import time
import traceback
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from db.models.user import User
from db.session import get_db
from routes.route_login import get_current_user
from schemas.evaluation import UploadCompleteRequest, VideoRecord
from services.core.evaluations.take_evaluation import get_evalution_id

load_dotenv()

router = APIRouter()

s3 = boto3.client("s3")
BUCKET_NAME = os.getenv("S3_BUCKET")


@router.get("/init-upload/")
async def initiate_multipart_upload(
    chat_id: str = Query(..., description="User chat ID"),
    content_type: str = Query("video/webm", description="Content type of the file"),
    file_extension: str = Query("webm", description="File extension"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Initialize multipart upload and return upload ID"""
    try:
        evaluation_id = get_evalution_id(chat_id, db)
        # Generate unique key for the video
        key = f"screen_recordings/{str(evaluation_id)}/{str(user.username)}-{str(int(time.time()))}.{file_extension}"

        response = s3.create_multipart_upload(
            Bucket=BUCKET_NAME, Key=key, ContentType=content_type
        )
        return {"upload_id": response["UploadId"], "key": key}
    except ClientError as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/presigned-url/")
async def generate_presigned_url(upload_id: str, key: str, part_number: int):
    """Generate presigned URL for a specific part"""
    try:
        presigned_url = s3.generate_presigned_url(
            ClientMethod="upload_part",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "UploadId": upload_id,
                "PartNumber": part_number,
            },
            ExpiresIn=3600,
        )
        return {"url": presigned_url}
    except ClientError as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload-status/")
async def get_upload_status(upload_id: str, key: str):
    """Check upload status and completion state"""
    try:
        # First check if the upload exists
        parts_response = s3.list_parts(Bucket=BUCKET_NAME, Key=key, UploadId=upload_id)

        uploaded_parts = [
            {"PartNumber": part["PartNumber"], "ETag": part["ETag"]}
            for part in parts_response.get("Parts", [])
        ]

        return {
            "status": "in_progress",
            "uploaded_parts": uploaded_parts,
            "part_count": len(uploaded_parts),
            "is_completed": False,
        }

    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchUpload":
            # Check if the object actually exists (completed upload)
            try:
                s3.head_object(Bucket=BUCKET_NAME, Key=key)
                return {
                    "status": "completed",
                    "is_completed": True,
                    "message": "Upload already completed successfully",
                }
            except ClientError:
                return {
                    "status": "expired",
                    "is_completed": False,
                    "message": "Upload session expired or never existed",
                }
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error checking upload status: {str(e)}"
        )


@router.post("/complete-upload/")
async def complete_multipart_upload(request: UploadCompleteRequest):
    """Complete the multipart upload"""
    try:
        response = s3.complete_multipart_upload(
            Bucket=BUCKET_NAME,
            Key=request.key,
            UploadId=request.upload_id,
            MultipartUpload={"Parts": request.parts},
        )
        return {"location": response["Location"]}
    except ClientError as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluation/{evaluation_id}/", response_model=list[VideoRecord])
async def get_recordings(evaluation_id: str, email: str):
    try:
        # List all objects for this evaluation_id

        prefix = f"screen_recordings/{evaluation_id}/"
        response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)

        records = []
        for obj in response.get("Contents", []):
            # Extract filename without path
            filename = obj["Key"].split("/")[-1]

            # Check if filename matches username pattern
            if filename.startswith(f"{email}-"):
                try:
                    # Extract timestamp from filename
                    base_name, _ = os.path.splitext(filename)
                    ts_part = base_name[len(email) + 1 :]
                    timestamp = datetime.fromtimestamp(float(ts_part))
                except:
                    continue  # Skip invalid filenames

                # Generate presigned URL
                url = s3.generate_presigned_url(
                    "get_object",
                    Params={
                        "Bucket": BUCKET_NAME,
                        "Key": obj["Key"],
                        "ResponseContentDisposition": f"attachment; filename={filename}",
                    },
                    ExpiresIn=3600,  # 1 hour expiration
                )

                records.append(
                    {"url": url, "timestamp": timestamp, "filename": filename}
                )

        # Sort by timestamp descending
        records.sort(key=lambda x: x["timestamp"], reverse=True)

        return records

    except ClientError as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
