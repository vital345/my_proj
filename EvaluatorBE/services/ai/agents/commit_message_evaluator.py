# from services.ai.llms.open_ai import get_4o as llm
from typing import List
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from pydantic import BaseModel
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
system_prompt:str = """
You are a commit message evaluator. Your task is to review a list of commit messages 
provided as input and assess each based on clarity and quality.
Clarity: The commit message should be easy to understand, concise, and clearly communicate 
what changes were made and why.
Quality: The message should follow best practices for commit messages, such as:
Using the correct tense.
Describing the changes made in detail, without being overly verbose.
Including context or reasons for the change when necessary.
Avoiding vague or uninformative messages (e.g., "Update code" or "Fix bug" without details).
Scoring Guidelines:
You must provide an integer score between 1 and 10 for each commit message, where:
1-3: Poor - Lacks clarity and/or quality.
4-6: Average - Partially clear but missing important details or structure.
7-9: Good - Generally clear and well-structured, with minor room for improvement.
10: Excellent - Perfectly clear, concise, and follows best practices.
Output format:
1. Output a single integer between 1 to 10 representing the overall score.
2. provide a report explaining why the given score was assigned. The report should highlight
strengths and weaknesses and suggest areas of improvement. 
List Of Commits:
{list_of_commits}
"""

class Report(BaseModel):
    strengths:List[str]
    weaknesses:List[str]
    areas_of_improvement:List[str]
    
class OutputFormat(BaseModel):
    overall_score:int
    report:Report


async def commit_message_evaluator(commits:List[str])->OutputFormat:
       llm = ChatOpenAI(model="gpt-4o")
       llm = llm.with_structured_output(OutputFormat)
       prompt = ChatPromptTemplate.from_messages([
           ("system",system_prompt)
       ])
       
       chain = prompt | llm
       output = await chain.ainvoke(commits)
       
       return output
   
   



if __name__ == "__main__":
    
    output = commit_message_evaluator([
        # "Fixed stuff",
        # "Update",
        # "Misc changes",
        # "Bug fixes",
        # "asdf",
        # "Test",
        # "Changes",
        # "WIP",
        # "Temporary fix",
        # "Removed stuff",
        # "Final changes"
        "Fix user login bug by updating authentication logic",
        "Add unit tests for the payment processing module",
        "Refactor user profile component to improve readability",
        "Update README with installation instructions",
        "Optimize database queries to reduce load times",
        "Remove deprecated API endpoints"
    ])
    print(output)
    
    