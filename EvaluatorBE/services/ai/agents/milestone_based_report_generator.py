from typing import List, Optional
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
# from services.ai.agents.milestone_generator import Milestone
from langchain.prompts import ChatPromptTemplate

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
)

project_repo = open("services/ai/agents/project-repo2.txt").read()


class Question(BaseModel):
    code_snippet:Optional[str]
    question_text:str
    context:Optional[str]

class MilestoneReport(BaseModel):
    """Report for single milestone"""
    title: str = Field(description="Name of the milestone")
    status: str = Field(description="Completion status of the milestone")
    score: int = Field(description="Score for the milestone (from 0 to 10)")
    feedback: str = Field(description="feedback for the milestone")
    questions:List[Question] = Field(description="list of questions to ask to the user")


class Output(BaseModel):
    """final output"""
    milestone_reports: List[MilestoneReport] = Field(
        description="list of all milestone reports")


async def generate_milestone_based_report(
    repo_text: str,
    milestones,
    query: Optional[str] = "",
):
    print(len(repo_text))
    # return
    system_prompt = f"""
You are an intelligent milestone evaluation assistant tasked with reviewing the progress of a candidate 
based on the source code and milestones provided. Your goal is to evaluate how well the candidate has achieved 
the specified milestones and provide a score for each. Keep the difficulty level very high for milestone evaluation and check everything deeply.Follow these guidelines:
1. Milestone Completion: Assess whether the candidate has successfully completed each milestone. By validating it's functionality through codebase. 
For each milestone, specify if it is fully completed, partially completed, or incomplete.
2. Score Assignment: For each milestone, assign a score from 0 to 10, where 10 represents complete fulfillment 
of the milestone by validating it's functionality through codebase.
3. Report Generation: Generate a report for each milestone, outlining the following:
Whether the milestone was completed (Fully completed, Partially completed, Incomplete).
Key strengths and weaknesses of the implementation for that milestone.
Suggestions for improvement, if applicable.
4. Questions for Completed Milestones:
If the milestone is fully completed, generate a list of questions (You need to generate 3 questions per milestone 
out of which atleast 2 should be hard questions) to verify the user's understanding of 
their codebase. Each question should be based on the key sections of the implementation and should include:
A code snippet from the user's implementation.
A question text to prompt the user to explain the logic or purpose of the code. 
A context for the question so that another agent is able to assess the the correctness of users response.
These questions should focus on the most important sections of the codebase related to the milestone.
5. Prompts for Incomplete Milestones:
If a milestone is partially completed or incomplete, ask the candidate how they would have implemented 
the missing parts of the milestone. No need to include code snippets here—just prompt for an explanation 
of their approach and reasoning.
6. Final output: At the end of the evaluation, produce an overall report summarizing the candidate's performance, 
highlighting their strengths and weaknesses, and providing actionable feedback for improvement.
Output:
For each milestone, return:
- Milestone title.
- Completion status (Fully completed, Partially completed, Incomplete).
- Score (0-10).
Justification and feedback (Key strengths, weaknesses, suggestions for improvement).
- For Fully Completed Milestones: A list of questions with code snippets and prompts to verify the candidate's 
understanding. 
- For Incomplete or Partially Completed Milestones: A question asking how the candidate would have implemented the missing parts.

Milestones: {milestones}
Project repository: {repo_text}

"""
    

    _llm = llm.with_structured_output(Output)

    for i in range(3):
        try:
            output:Output = await _llm.ainvoke([
                ("system", system_prompt)
            ])
            return output
        except Exception as e:
            print(e)

    return output


if __name__ == '__main__':
    
    milestones = [{'title': 'Database Schema', 'description': 'Create the database schema for the e-commerce inventory management system.', 'sub_tasks': ['Create users table with fields: id, username, password_hash, role (e.g., admin, manager).', 'Create products table with fields: id, name, description, price, stock_quantity.', 'Create categories table with fields: id, name, description.', 'Establish relationships, such as a product belonging to multiple categories.']}, {'title': 'CRUD Operations', 'description': 'Implement CRUD operations for products and categories in the inventory management system.', 'sub_tasks': ['Create a new product.', 'Retrieve all products or a specific product by ID.', "Update a product's details and stock quantity.", 'Delete a product.', 'Add new categories.', 'Retrieve a list of categories or a specific category.', 'Update and delete categories.']}, {'title': 'Authentication and Authorization', 'description': 'Implement authentication and authorization mechanisms for the API.', 'sub_tasks': ['Implement user registration and login using JWT for authentication.', 'Ensure user passwords are securely hashed.', 'Protect endpoints to ensure only authenticated users can access them.', "Implement role-based access control where 'admin' users can perform all operations and 'manager' users can manage product and category listings but cannot delete them."]}, {'title': 'Testing', 'description': 'Develop and implement testing for the API endpoints and business logic.', 'sub_tasks': ['Develop unit tests for all API endpoints.', 'Include tests for authentication, authorization, and business logic scenarios, such as low stock alerts.']}, {'title': 'Documentation', 'description': "Create comprehensive documentation for the API using FastAPI's features.", 'sub_tasks': ["Utilize FastAPI's auto-generated API documentation features.", 'Ensure the API documentation includes detailed descriptions of each endpoint, including request and response structures with examples.']}, {'title': 'Inventory Management Logic', 'description': 'Implement logic for managing inventory levels and alerts.', 'sub_tasks': ['Ensure stock levels are accurately updated during product updates.', 'Implement a check for low inventory levels and trigger alerts/logging when below a specified threshold.']}]
    import json
    output = generate_milestone_based_report(
        repo_text=project_repo,
        milestones=json.dumps(milestones),
    )

    print(json.dumps(output.model_dump()))
