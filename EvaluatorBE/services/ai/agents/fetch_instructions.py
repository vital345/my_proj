from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from langchain.prompts import ChatPromptTemplate

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
)
from typing import List
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool

class Workflow(BaseModel):
    """
    Represents a single testing workflow, which consists of a sequence of instructions
    to be followed for testing a specific feature or functionality of the frontend application.
    """
    instructions: List[str] = Field(
        description="A list of step-by-step instructions for executing the test workflow. Each instruction should be a clear and concise command that guides the tester through the necessary actions, including navigation, interaction with UI elements, data input, and verification of expected outcomes."
    )

class Workflows(BaseModel):
    """
    A collection of testing workflows. This model encapsulates multiple Workflow instances,
    each representing a distinct set of test instructions for different features or scenarios.
    """
    workflows: List[Workflow] = Field(
        description="A list of Workflow objects, where each Workflow contains a sequence of instructions for testing a specific feature or functionality. This allows for organizing and managing multiple test workflows in a structured manner."
    )

    
class Output(BaseModel):
    output: List[Workflow] = Field(
        description="A list of Workflow objects, where each Workflow contains a sequence of instructions for testing a specific feature or functionality. This allows for organizing and managing multiple test workflows in a structured manner."
    )


system_prompt = """
You are an intelligent frontend testing assistant. Your task is to analyze both the project requirements and the project repository to generate comprehensive frontend testing workflows. Follow these guidelines:

1. **Understand Requirements and Codebase**:
   - Parse the provided project requirements to identify key features, user interactions, and business logic.
   - Analyze the project repository to determine which features have been implemented, their corresponding code paths, and the application's routing configuration.
   - Identify any prerequisites or setup steps needed before executing a test case, such as authentication for accessing protected routes.

2. **Generate Test Cases**:
   - For each identified feature, generate a set of test cases that cover:
     - Typical user scenarios
     - Edge cases
     - Error handling
     - Performance considerations

3. **Define Test Workflows**:
   - Create detailed instruction sequences for executing each test case. Include:
     - Necessary setup steps, such as logging in, before navigating to protected routes.
     - Steps to navigate the UI using relative URLs gathered from the routing configuration in the codebase.
     - Explicit instructions on how to locate each UI element using CSS selectors or XPath, ensuring the executor agent can precisely interact with the UI.
     - Expected outcomes
     - Data inputs and variations
   - Indicate whether each workflow has been implemented in the repository.

4. **Output Format**:
   - Provide the test workflows in a JSON format as follows:
     {{
         "workflows": [
             {{
                 "instructions": [
                     "Navigate to '/login'.",
                     "Find the Email input field using the CSS selector '#email'.",
                     "Type 'user@example.com' into the Email input field.",
                     "Find the Password input field using the CSS selector '#password'.",
                     "Type 'securepassword' into the Password input field.",
                     "Find the login button using the CSS selector 'button#login'.",
                     "Click the login button.",
                     "Verify successful login and redirection to the dashboard.",
                     "Navigate to '/events-overview'.",
                     "Find the Conference dropdown using the CSS selector 'select#conference-type'.",
                     "Select 'Conference' from the type dropdown.",
                     "Verify that only conference events are displayed in the grid.",
                     "Verify that the grid displays a maximum of 10 rows at a time."
                 ],
                 "implemented": true
             }},
             {{
                 "instructions": [
                     "Log in as an admin user:",
                     "Navigate to '/login'.",
                     "Find the Email input field using the CSS selector '#admin-email'.",
                     "Type 'admin@example.com' into the Email input field.",
                     "Find the Password input field using the CSS selector '#admin-password'.",
                     "Type 'adminpassword' into the Password input field.",
                     "Click the login button.",
                     "Verify successful login and redirection to the admin dashboard.",
                     "Navigate to '/events-overview'.",
                     "Perform actions specific to the events overview."
                 ],
                 "implemented": false
             }},
             {{
                "instructions": [
                    "Log in as a user:",
                    "Navigate to '/login'.",
                    "Find the Username input field using the CSS selector 'input[placeholder=\"Username\"]'.",
                    "Type 'johnd' into the Username input field.",
                    "Find the Password input field using the CSS selector 'input[placeholder=\"Password\"]'.",
                    "Type 'm38rmF$' into the Password input field.",
                    "Click the login button.",
                    "Verify successful login and redirection to '/event-list'.",
                    "Navigate to '/event-list'.",
                    "Find the search input field using the CSS selector 'input[placeholder=\"Search events...\"]'.",
                    "Type 'Conference' into the search input field.",
                    "Verify that the events list is filtered to show only 'Conference' events."
                ],
                "implemented": true
             }},
             {{
                "instructions": [
                    "Log in as a user:",
                    "Navigate to '/login'.",
                    "Find the Username input field using the CSS selector 'input[placeholder=\"Username\"]'.",
                    "Type 'johnd' into the Username input field.",
                    "Find the Password input field using the CSS selector 'input[placeholder=\"Password\"]'.",
                    "Type 'm38rmF$' into the Password input field.",
                    "Click the login button.",
                    "Verify successful login and redirection to '/event-list'.",
                    "Navigate to '/event-details/1'.",
                    "Verify that the event details are displayed correctly.",
                    "Click the 'Register' button using the CSS selector 'button:contains(\"REGISTER\")'.",
                    "Verify that the button text changes to 'REGISTERED' and no further action is possible."
                ],
                "implemented": true
             }}
         ]
     }}

5. **Iterate and Improve**:
   - Adapt test workflows based on feedback from code reviews and changes in requirements.

Remember to focus on delivering accurate, comprehensive, and actionable test workflows that align with the project's objectives and the actual implementation status. Use relative URLs to ensure flexibility in different environments.

Project Requirements: {project_requirements}
Project Repository: {project_repo}

Note: 
1. Each workflow is to be executed independently hence you have to make sure the instructions in each workflow include all the necessary setup instructions, such as loggin in.
2. Make sure that there are clear and detailed instructions for login before attempting to navigate to the protected routes.
"""


async def instructions_set_fetcher(project_requirement_txt:str,repo_txt:str) -> None:
    
    print("project requirement document " + str(len(project_requirement_txt)))
    print("repo txt " + str(len(repo_txt)))

    _llm = llm.with_structured_output(Output)

    prompt = ChatPromptTemplate.from_messages([
           ("system",system_prompt)
    ])

    chain = prompt | _llm
    
    for i in range(3):
        try:
            output:Output = await chain.ainvoke({
                'project_requirements': project_requirement_txt,
                'project_repo': repo_txt
            })
            return output.output
        except Exception as e:
            print(e)
            continue

if __name__ == '__main__':
    output = instructions_set_fetcher()
    print(output)
    