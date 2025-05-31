from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class EmailRequest(BaseModel):
    email: EmailStr
    subject: str
    message: str

def send_email(email: str, subject: str, message: str, attachments: Optional[List[UploadFile]] = None):
    sender_email = os.getenv("SENDER_EMAIL")
    receiver_email = email
    password = os.getenv("SENDER_EMAIL_PASSWORD")

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject

    msg.attach(MIMEText(message, 'html'))

    if attachments:
        for attachment in attachments:
            try:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.file.read())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename= {attachment.filename}",
                )
                msg.attach(part)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to attach file {attachment.filename}: {str(e)}")

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


