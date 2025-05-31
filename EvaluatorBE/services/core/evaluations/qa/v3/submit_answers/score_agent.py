import asyncio
import json
import traceback
from typing import List, Optional
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
)

# project_requirements = open("project_requirements.txt", "r").read()


class Question(BaseModel):
    score: int = Field(description="Score for particular answer")
    question: str = Field(description="Answer of the Question for which score is given")
    explanation: str = Field(description="Explanation of the score")


class OutputScoreAgent(BaseModel):
    output: List[Question] = Field(description="List of questions with their scores")
    overall_feedback: str = Field(description="Overall feedback for the user")
    overall_score: str = Field(description="Overall score for the user")


async def score_giving_agent_for_final_report(questions: List[dict]) -> OutputScoreAgent:

    system_prompt = f"""
You are an intelligent agent tasked with evaluating user responses. You will receive a question, 
the user's answer, and the context specifying the structure or nature of the correct answer. 
Your job is to assess the all user's answer based on how closely it matches the expected answer in terms 
of correctness, completeness, clarity, and relevance.
You will output a score between 0 and 10, where:
10 indicates a perfect or near-perfect answer.
5-9 indicates partial correctness with varying levels of detail or understanding.
1-4 indicates an answer that is incomplete or shows significant misunderstanding.
0 indicates an entirely incorrect or irrelevant answer.
When evaluating, consider the following criteria:
1. Correctness: Does the user's answer accurately reflect the correct information?
2. Completeness: Is the answer detailed enough to cover key aspects of the correct answer?
3. Clarity: Is the answer clearly expressed and easy to understand?
4. Relevance: Does the answer directly address the question without unnecessary or unrelated information?

Your task is to analyze the user's feedback response thoroughly, and assign a score accordingly.


Inputs:
Chat History: {questions}
"""
    _llm = llm.with_structured_output(OutputScoreAgent)
    for i in range(3):
        try:
            output: OutputScoreAgent = await _llm.ainvoke([("system", system_prompt)])
            return output
        except:
            if i == 2:
                traceback.print_exc()



if __name__ == "__main__":
    json_data = r"""
  {
    "score": 5,
    "explanation": "The user has demonstrated a basic to moderate understanding of the topics discussed. They have a foundational grasp of Angular and promises, but there are noticeable gaps in their explanations, particularly in the areas of block-level and inline elements, and the practical application of promises. The user could benefit from further study and practice to enhance their understanding and ability to articulate these concepts more clearly. Strengths include a basic understanding of Angular's features and the states of promises. Areas for improvement include a deeper exploration of CSS element behavior and a more comprehensive explanation of promises in simpler terms.",
    "questions": [
        {
            "content": "{\"question\": \"What is Angular, and what are its key features?\", \"code_snippet\": null}",
            "additional_kwargs": {},
            "response_metadata": {},
            "type": "ai",
            "name": null,
            "id": null,
            "example": false,
            "tool_calls": [],
            "invalid_tool_calls": [],
            "usage_metadata": null
        },
        {
            "content": "The user demonstrated a good understanding of Angular as a front-end framework with features like routing, dependency injection, and reusable components. However, they could elaborate more on the specific roles and advantages of each feature mentioned.",
            "additional_kwargs": {},
            "response_metadata": {},
            "type": "human",
            "name": null,
            "id": null,
            "example": false
        },
        {
            "content": "{\"question\": \"Explain the difference between block-level and inline elements.\", \"code_snippet\": null}",
            "additional_kwargs": {},
            "response_metadata": {},
            "type": "ai",
            "name": null,
            "id": null,
            "example": false,
            "tool_calls": [],
            "invalid_tool_calls": [],
            "usage_metadata": null
        },
        {
            "content": "The user demonstrated some basic understanding of block-level and inline elements but struggled with their precise behavior in relation to each other. User needs more clarity on inline elements flow and how block elements stack below one another.",
            "additional_kwargs": {},
            "response_metadata": {},
            "type": "human",
            "name": null,
            "id": null,
            "example": false
        },
        {
            "content": "{\"question\": \"Explain the concept of promises and how they are used.\", \"code_snippet\": null}",
            "additional_kwargs": {},
            "response_metadata": {},
            "type": "ai",
            "name": null,
            "id": null,
            "example": false,
            "tool_calls": [],
            "invalid_tool_calls": [],
            "usage_metadata": null
        },
        {
            "content": "The user was able to explain the basics of promises, including the 3 states of pending, fulfilled and rejected. The user could explain the asynchronous nature of promises. The user struggled in giving simplest terms to explain what the promise is like a promise to the user, while they did explain the three states. Overall the user has basic understanding of the topic.",
            "additional_kwargs": {},
            "response_metadata": {},
            "type": "human",
            "name": null,
            "id": null,
            "example": false
        }
    ]
}
   """
   
   
    output = asyncio.run(score_giving_agent_for_final_report(
        questions=json.loads(json_data).get("questions", [])
    ))
    print(output)
