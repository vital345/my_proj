import os
import git
from git.exc import GitCommandError
import re
from pydantic import BaseModel
from datetime import datetime
from fastapi import FastAPI, HTTPException

def clone_github_repo(github_url: str, username: str) -> str:
    try:
        # Validate the GitHub URL
        if not re.match(r'git@github.com:.+/.+\.git', github_url):
            raise ValueError("Invalid GitHub URL. Ensure it is in the format 'https://github.com/user/repo.git'.")

        # Ensure the username is not empty
        if not username.strip():
            raise ValueError("Username cannot be empty.")

        # Define the base directory name
        base_directory_name = "cloned_repo"
        
        # Extract the repository name from the URL
        repo_name = github_url.split('/')[-1].replace('.git', '')
        
        # Define the final path where the repository will be cloned
        final_path = os.path.join(os.getcwd(), base_directory_name, username, repo_name)
        
        # Ensure the directory does not already exist
        if os.path.exists(final_path):
            return final_path
            # raise FileExistsError(f"The directory '{final_path}' already exists.")
        
        # Create the directory structure
        os.makedirs(final_path)
        
        # Clone the repository
        git.Repo.clone_from(github_url, final_path)
        
        # Return the path of the cloned repository
        print("Final Path of Repo is: " + final_path)
        return final_path
    except ValueError as ve:
        raise ve
    except FileExistsError as fee:
        raise fee
    except GitCommandError as gce:
        raise Exception(f"An error occurred while cloning the repository: {gce}")
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")



# Example usage
# if __name__ == "__main__":
#     github_url = "https://github.com/arpit5220/Project-2-HTML-Media-Project.git"
#     username = "Vikash"
#     try:
#         commit_details = get_commit_messages(github_url, username)
#         print("Commit Messages with Date and Time:")
#         for detail in commit_details:
#             print(f"Date: {detail['date']}, Message: {detail['message']}")
#     except Exception as e:
#         print(e)

# def find_commit_id(cloned_repo_path: str, target_datetime: datetime) -> str:
#     try:
#         # Access the repository
#         repo = git.Repo(cloned_repo_path)
#         commits = list(repo.iter_commits())
        
#         # Find the commit ID that is less than or equal to the given datetime
#         for commit in commits:
#             commit_datetime = commit.committed_datetime
#             if commit_datetime <= target_datetime:
#                 return commit.hexsha
        
#         raise Exception("No commit found before the given datetime.")
#     except Exception as e:
#         raise Exception(f"An error occurred while finding the commit ID: {e}")

# def revert_repository(cloned_repo_path: str, commit_id: str) -> None:
#     try:
#         # Access the repository
#         repo = git.Repo(cloned_repo_path)
        
#         # Reset the repository to the specified commit ID
#         repo.git.reset('--hard', commit_id)
#         print(f"Repository reverted to commit ID: {commit_id}")
#     except Exception as e:
#         raise Exception(f"An error occurred while reverting the repository: {e}")




# class RevertRequest(BaseModel):
#     github_url: str
#     username: str
#     target_datetime: datetime

# @app.post("/revert-repo/")
# async def revert_repo(request: RevertRequest):
#     try:

#         print("clone_github_repo")
#         # Clone the repository and get the relative path
#         cloned_repo_path = clone_github_repo(request.github_url, request.username)
        

#         print("find_commit_id")
#         # Find the commit ID based on the target datetime
#         commit_id = find_commit_id(cloned_repo_path, request.target_datetime)
        

#         print("revert_repository")
#         # Revert the repository to the found commit ID
#         revert_repository(cloned_repo_path, commit_id)



#         # try:
#         #     commit_details = get_commit_messages(request.github_url, request.username)
#         #     print("Commit Messages with Date and Time:")
#         #     for detail in commit_details:
#         #         print(f"Date: {detail['date']}, Message: {detail['message']}")
#         # except Exception as e:
#         #     print(e)
        
#         return {"message": f"Repository reverted to commit ID: {commit_id}"}
#     except Exception as e:
#         print(str(e))
#         raise HTTPException(status_code=400, detail=str(e))
























