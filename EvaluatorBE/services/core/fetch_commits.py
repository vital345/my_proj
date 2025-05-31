import os

import requests

def fetch_commits(token: str, owner: str, repo: str):
    """
    Fetches commits using GitHub API and returns a list of commit messages.

    :param token: GitHub personal access token
    :param owner: Owner of the repository
    :param repo: Name of the repository
    :return: List of commit messages
    """

    # GitHub API URL for commits
    url = f'https://api.github.com/repos/{owner}/{repo}/commits'

    # Headers including the authorization token
    headers = {
        'Authorization': f'token {token}',
        'X-GitHub-Api-Version': '2022-11-28'
    }

    # Make the GET request to the GitHub API
    response = requests.get(url, headers=headers)

    # Check if the request was successful
    if response.status_code == 200:
        commits = response.json()
        # Extract commit messages
        commit_messages = [commit['commit']['message'] for commit in commits]
        return commit_messages
    else:
        print(f'Failed to retrieve commits: {response.status_code}')
        return []


if __name__ == '__main__':
    personal_access_token = os.getenv("GIT_API_KEY")
    owner_name = "d33pe8h-j4a"
    repo_name = "MegaBlog-App"
    print(fetch_commits(personal_access_token, owner_name, repo_name))