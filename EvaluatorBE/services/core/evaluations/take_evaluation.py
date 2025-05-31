import json
import os
import asyncio
import traceback

import boto3
from core.jwt import create_access_token
from db.models.user import User
from db.models.user_evaluation import UserEvaluation
from db.models.evaluation import Evaluation
from db.models.evaluation_step import EvaluationStep
from db.session import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from services.ai.agents.commit_message_evaluator import commit_message_evaluator
from services.core.evaluations.send_viva_mail_to_user import send_viva_mail_to_user
from services.core.clone_repository import clone_github_repo
from services.core.commit_messages import get_commit_messages
import tempfile
import subprocess
from services.ai.agents.code_quality_checker import code_quality_checker
from services.ai.agents.backend_endpoint_extractor import backend_endpoint_extractor
from services.ai.agents.backend_test_case_runner import test_case_runner_session
from services.ai.agents.backend_test_case_output_formatter import (
    backend_test_case_output_formatter,
)
from db.models.chat_session import ChatSession
from services.ai.agents.milestone_generator import milestone_extractor_agent
from services.ai.agents.milestone_based_report_generator import (
    generate_milestone_based_report,
)
from services.ai.agents.fetch_instructions import instructions_set_fetcher
from services.ai.agents.frontend_automatation_testing import execute_test_async
from services.ai.agents.frontend_workflow_output_formatter import (
    frontend_workflow_output_formatter,
)
import time
import os
from dotenv import load_dotenv
from git import Repo
import shutil
import ctypes
from db.session import engine
import tempfile

import re
from gitingest import ingest

load_dotenv()
BUCKET_NAME = os.getenv("S3_BUCKET")


def convert_to_authenticated_https(url: str, username: str, pat_token: str) -> str:
    """
    Converts a GitHub SSH or HTTPS URL to an HTTPS URL that includes the username and PAT token.

    :param url: The GitHub repository URL (SSH or HTTPS).
    :param username: GitHub username.
    :param pat_token: GitHub personal access token (PAT).
    :return: Authenticated HTTPS GitHub URL.
    """
    # Convert SSH URL to HTTPS if needed
    ssh_pattern = r"git@github\.com:(.*)\.git"
    https_pattern = r"https://github\.com/(.*?)(\.git)?$"

    match = re.search(ssh_pattern, url)
    if match:
        repo_path = match.group(1)
    else:
        match = re.search(https_pattern, url)
        if match:
            repo_path = match.group(1)
        else:
            raise ValueError("Invalid GitHub repository URL format.")

    # Construct authenticated HTTPS URL
    return f"https://{username}:{pat_token}@github.com/{repo_path}.git"


def is_hidden(path):
    """
    Determines if a file or directory is hidden.
    - On Windows: Checks if the hidden attribute is set.
    - On Unix-like systems: Checks if the name starts with a dot.
    """
    if os.name == "nt":
        try:
            # Get the attributes of the file/directory.
            attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
            if attrs == -1:
                return False
            # FILE_ATTRIBUTE_HIDDEN is 0x2.
            return bool(attrs & 0x2)
        except Exception:
            return False
    else:
        return os.path.basename(path).startswith(".")


def delete_hidden_items(target_directory):
    """
    Recursively deletes hidden directories and hidden files.
    - Hidden directories are deleted along with their contents.
    - Hidden files (even in non-hidden directories) are deleted.
    """
    # Walk the directory tree top-down so we can remove hidden directories before walking into them.
    for root, dirs, files in os.walk(target_directory, topdown=True):
        # Process hidden directories first.
        dirs_to_remove = []
        for d in dirs:
            full_dir_path = os.path.join(root, d)
            if is_hidden(full_dir_path):
                print(f"Deleting hidden directory: {full_dir_path}")
                try:
                    shutil.rmtree(full_dir_path)
                except Exception as e:
                    print(f"Error deleting directory {full_dir_path}: {e}")
                # Mark this directory so that os.walk does not traverse it.
                dirs_to_remove.append(d)
        # Remove hidden directories from the list of directories to traverse.
        for d in dirs_to_remove:
            dirs.remove(d)

        # Process hidden files.
        for file in files:
            full_file_path = os.path.join(root, file)
            if is_hidden(full_file_path):
                print(f"Deleting hidden file: {full_file_path}")
                try:
                    os.remove(full_file_path)
                except Exception as e:
                    print(f"Error deleting file {full_file_path}: {e}")


def convert_repo_to_string(local_path, extensions):
    print("Converting the entire github repo into a string")
    start_time = time.time()
    # Create a temporary file (delete=False so we can pass its name to gitingest)
    temporary_file = tempfile.NamedTemporaryFile(suffix="repofile", delete=False)

    # Split the input string by comma and remove extra spaces.
    ext_list = [ext.strip() for ext in extensions.split(",") if ext.strip()]

    # For each extension, if it doesn't already include a wildcard, prepend '*.'.
    ext_patterns = []
    for ext in ext_list:
        if "*" not in ext:
            # If the extension starts with a dot, just prepend '*'
            if ext.startswith("."):
                ext_patterns.append(f"*{ext}")
            else:
                ext_patterns.append(f"*.{ext}")
        else:
            # Otherwise, assume the user provided the complete pattern
            ext_patterns.append(ext)

    # Join the patterns with commas to form the final argument.
    ext_str = ",".join(ext_patterns)

    # Build and run the gitingest command with the extension patterns.
    cmd = f'gitingest "{local_path}" -o "{temporary_file.name}" -e ".*" -i "{ext_str}"'
    print("CMD for gitingest: ", cmd)
    subprocess.run(cmd, shell=True)

    # Read the content from the temporary file.
    # (Seek back to the beginning in case writing left the pointer at the end.)
    temporary_file.seek(0)
    repo_string = temporary_file.read()
    temporary_file.close()

    print(
        "--- %s time to convert the entire github repo into a string in seconds ---"
        % (time.time() - start_time)
    )
    return repo_string


async def take_evaluation(userEvaluationId: int, extensions):
    try:
        temp = tempfile.TemporaryDirectory()
        local_path = temp.name
        print(local_path)  # Define a suitable path
        try:
            shutil.rmtree(local_path)
        except FileNotFoundError:
            pass

        db = Session(engine)
        userEvaluation = (
            db.query(UserEvaluation)
            .filter(
                UserEvaluation.id == userEvaluationId,
            )
            .first()
        )
        user: User = db.query(User).where(User.id == userEvaluation.user_id).first()

        print("Starting evaluation for userEvaluationID: ", userEvaluation.id)

        evaluation: Evaluation = (
            db.query(Evaluation)
            .where(Evaluation.id == userEvaluation.evaluation_id)
            .first()
        )

        start_time = time.time()
        REPO_URL = convert_to_authenticated_https(
            userEvaluation.github_url,
            os.environ.get("GITHUB_USERNAME"),
            os.environ.get("PAT_TOKEN"),
        )
        print("Repo url: ", REPO_URL)
        repo = Repo.clone_from(REPO_URL, local_path)
        # cloned_repo_path = clone_github_repo(userEvaluation.github_url,user.username)
        print(
            "--- %s time to clone github repo in seconds ---"
            % (time.time() - start_time)
        )

        repo_string = ""

        project_requirement_txt = evaluation.requirements

        if (
            db.query(EvaluationStep)
            .where(EvaluationStep.step_name == "commit_message_evaluation_report")
            .where(EvaluationStep.userevaluation_id == userEvaluation.id)
            .first()
            == None
        ):
            print("starting commit message evaluation report")
            start_time = time.time()
            commit_list = get_commit_messages(repo)

            commit_message_evaluation_report = await commit_message_evaluator(
                [commit["message"] for commit in commit_list]
            )

            commit_message_evaluation_report = (
                commit_message_evaluation_report.model_dump()
            )
            commit_message_evaluation_report["final_commit_details"] = commit_list[0]

            db.add(
                EvaluationStep(
                    userevaluation_id=userEvaluation.id,
                    step_name="commit_message_evaluation_report",
                    step_report=commit_message_evaluation_report,
                )
            )
            db.commit()

            print(
                "--- %s time to generate commit clarity report ---"
                % (time.time() - start_time)
            )

        if (
            db.query(EvaluationStep)
            .where(EvaluationStep.step_name == "code_quality_report")
            .where(EvaluationStep.userevaluation_id == userEvaluation.id)
            .first()
            == None
        ):

            print("Starting code quality report")
            start_time = time.time()
            if not repo_string:
                repo_string = convert_repo_to_string(local_path, extensions)
            code_quality_report = await code_quality_checker(repo_string)
            db.add(
                EvaluationStep(
                    userevaluation_id=userEvaluation.id,
                    step_name="code_quality_report",
                    step_report=code_quality_report.model_dump(),
                )
            )
            db.commit()

            print(
                "--- %s time to generate code clarity report in seconds ---"
                % (time.time() - start_time)
            )

        if (
            db.query(EvaluationStep)
            .where(EvaluationStep.step_name == "milestone_wise_report")
            .where(EvaluationStep.userevaluation_id == userEvaluation.id)
            .first()
            == None
        ):
            print("Starting milestone coverage report")
            start_time = time.time()
            list_of_milestones = await milestone_extractor_agent(
                project_requirement_txt
            )
            if not repo_string:
                repo_string = convert_repo_to_string(local_path, extensions)
            milestone_wise_report = await generate_milestone_based_report(
                repo_string, list_of_milestones
            )

            db.add(
                EvaluationStep(
                    userevaluation_id=userEvaluation.id,
                    step_name="milestone_wise_report",
                    step_report=milestone_wise_report.model_dump(),
                )
            )
            db.commit()

            print(
                "--- %s time to generate milestone coverage report  in seconds ---"
                % (time.time() - start_time)
            )
        chatSession: ChatSession = (
            db.query(ChatSession)
            .where(ChatSession.userevaluation_id == userEvaluation.id)
            .first()
        )
        if not chatSession:
            chatSession = ChatSession(
                userevaluation_id=userEvaluation.id, session_type="domain_specific_qa"
            )
            db.add(chatSession)
            db.commit()
            db.refresh(chatSession)


        if evaluation.project_type == "backend":
            if (
                db.query(EvaluationStep)
                .where(EvaluationStep.step_name == "backend_test_execution_report")
                .where(EvaluationStep.userevaluation_id == userEvaluation.id)
                .first()
                == None
            ):
                print("Starting backend test case execution report")

                start_time = time.time()
                if not repo_string:
                    repo_string = convert_repo_to_string(local_path, extensions)
                list_of_endpoints = await backend_endpoint_extractor(
                    project_requirement_txt=project_requirement_txt,
                    repo_txt=repo_string,
                )
                list_of_endpoints = json.dumps(list_of_endpoints.dict())

                print(list_of_endpoints)
                url = userEvaluation.deployed_url
                print(
                    "Using deployed url: ",
                    url,
                    " for evaluation id: ",
                    userEvaluation.id,
                )

                raw_test_execution_result = await test_case_runner_session(
                    requirement_txt=project_requirement_txt,
                    endpoints_txt=list_of_endpoints,
                    url=url,
                )
                print("++++++++++++++Final Output Before Formatting++++++++++++++")
                print(raw_test_execution_result)
                print("++++++++++++++Final Output Before Formatting++++++++++++++")
                formatted_test_execution_result = (
                    await backend_test_case_output_formatter(raw_test_execution_result)
                )

                db.add(
                    EvaluationStep(
                        userevaluation_id=userEvaluation.id,
                        step_name="backend_test_execution_report",
                        step_report=formatted_test_execution_result.model_dump(),
                    )
                )
                db.commit()

                print(
                    "--- %s time to generate backend testcase execution report in seconds ---"
                    % (time.time() - start_time)
                )

        if evaluation.project_type == "frontend":
            if (
                db.query(EvaluationStep)
                .where(EvaluationStep.step_name == "frontend_test_execution_report")
                .where(EvaluationStep.userevaluation_id == userEvaluation.id)
                .first()
                == None
            ):

                print("Starting frontend test case execution report")
                start_time = time.time()
                if not repo_string:
                    repo_string = convert_repo_to_string(local_path, extensions)
                frontend_workflows = await instructions_set_fetcher(
                    project_requirement_txt=project_requirement_txt,
                    repo_txt=repo_string,
                )

                frontend_workflows = [
                    workflow.model_dump() for workflow in frontend_workflows
                ]
                print(frontend_workflows)
                results = []
                url = userEvaluation.deployed_url
                for workflow in frontend_workflows:
                    raw_workflow_execution_result = await execute_test_async(
                        workflow["instructions"], url
                    )
                    results.append(raw_workflow_execution_result)

                formatted_test_execution_result = (
                    await frontend_workflow_output_formatter(results)
                )
                print(results)
                db.add(
                    EvaluationStep(
                        userevaluation_id=userEvaluation.id,
                        step_name="frontend_test_execution_report",
                        step_report=formatted_test_execution_result.model_dump(),
                    )
                )
                db.commit()

                print(
                    "--- %s time to generate frontend testcase execution report in seconds ---"
                    % (time.time() - start_time)
                )

        access_token = create_access_token(data={"sub": user.username})
        FE_URL = os.environ.get("FE_URL", "http://localhost:8080")
        print(FE_URL)
        send_viva_mail_to_user(
            user.username,
            evaluation.track_name,
            f"{str(FE_URL)}/user-evaluation/{chatSession.id}?token={access_token}",
        )

        try:
            shutil.rmtree(local_path)
        except FileNotFoundError:
            pass
        print("Evaluation completed for userEvaluationID: ", userEvaluation.id)
        db.close()
    except Exception as e:
        exception = traceback.format_exc()
        print("Exception occurred for userEvaluationID: ", userEvaluationId)
        print(exception)
        try:
            s3_client = boto3.client("s3")
            KEY = f"screen_recordings/{str(userEvaluation.evaluation_id)}/error-logs/{str(user.username)}-{str(int(time.time()))}-error.txt"
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=KEY,
                Body=exception.encode("utf-8"),  # Encode to bytes
            )
        except Exception as e:
            print("Error uploading error logs to S3: ", traceback.format_exc())


def take_evaluation_sync(userEvaluation: UserEvaluation, db: Session):
    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(take_evaluation(userEvaluation, db))


async def limited_take_evaluation(user_eval_id, extensions):
    from services.core.evaluations.qa.v3.semaphore_initializer import semaphore

    async with semaphore:
        return await take_evaluation(user_eval_id, extensions)


async def process_all_evaluations(user_evaluation_ids, extensions):
    tasks = [
        limited_take_evaluation(user_eval_id, extensions)
        for user_eval_id in user_evaluation_ids
    ]
    # asyncio.gather schedules them all concurrently, but the semaphore ensures only a few run at a time
    await asyncio.gather(*tasks)


def get_evalution_id(chat_id, db):
    user_evaluation_id: int = (
        db.query(ChatSession).where(ChatSession.id == chat_id).first().userevaluation_id
    )
    print(f"user_evaluation_id: {user_evaluation_id}")

    userEvaluation: UserEvaluation = (
        db.query(UserEvaluation).where(UserEvaluation.id == user_evaluation_id).first()
    )

    return userEvaluation.evaluation_id
