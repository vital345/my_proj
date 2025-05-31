import os
import subprocess
import tempfile
import time
import git
from git import Repo

from services.core.clone_repository import clone_github_repo



def get_commit_messages(repo:git.Repo) -> list:
    try:
        # Clone the repository and get the relative path
        # cloned_repo_path = clone_github_repo(github_url, username)
                
        # Access the .git directory and get the commit messages
        # repo = git.Repo(cloned_repo_path)
        commits = list(repo.iter_commits())

        # Extract commit messages along with date and time
        commit_details = [{
            "message": commit.message.strip(),
            "date": commit.committed_datetime.strftime("%Y-%m-%d %H:%M:%S")
        } for commit in commits]
        
        return commit_details
    except Exception as e:
        raise Exception(f"An error occurred while retrieving commit messages: {e}")

# Example usage
if __name__ == "__main__":
    github_url = "https://github.com/arpit5220/Project-2-HTML-Media-Project.git"
    username = "Vikash"
    try:
        commit_details = get_commit_messages(github_url, username)
        print("Commit Messages with Date and Time:")
        for detail in commit_details:
            print(f"Date: {detail['date']}, Message: {detail['message']}")
    except Exception as e:
        print(e)