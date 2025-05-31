from typing import List,Optional
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
)

# project_requirements = open("project_requirements.txt", "r").read()

class Milestone(BaseModel):
    """Single milestone"""
    title: str = Field(description="Name of the milestone")
    description: str = Field(description="detailed the milestone")
    sub_tasks: List[str] = Field(description="Detailed list of subtasks for the milestone")
    
class Output(BaseModel):
    """Final Output"""
    output: List[Milestone] = Field(description="List of milestones")


        
def score_giving_agent(original_question:str, users_latest_answer:str,context:str):
    
    system_prompt = f'''
You are an intelligent agent tasked with evaluating user responses. You will receive a question, 
the user's answer, and the context specifying the structure or nature of the correct answer. 
Your job is to assess the user's answer based on how closely it matches the expected answer in terms 
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

Your task is to analyze the user's response thoroughly, compare it with the expected answer 
(as per the context), and assign a score accordingly.
Input Format:
1. Question.
2. User's answer.
3. Context specifying the expected correct answer.
Output Format:
A score between 0 and 10 based on the user's answer.

Inputs:
Question: {original_question}
User's answer: {users_latest_answer}
Context specifying the expected correct answer.: {context}
'''
    output =  llm.invoke([
        ("system",system_prompt)])

    return output.content
    
if __name__ == '__main__':
   output = score_giving_agent(
       original_question="Explain how the relationship between products and categories is established in this code. code snippet: class Product(Base):\n    id = Column(Integer, primary_key=True)\n    name = Column(String,nullable=False)\n    description = Column(Text)\n    price = Column(Integer,nullable=False)\n    stock_quantity = Column(Integer,nullable=False)\n    category_id =  Column(Integer, ForeignKey(\"category.id\"))\n    category = relationship(\"Category\", back_populates=\"products\""
       ,users_latest_answer="Its a many to many relationship",
       context="The candidate should explain the use of ForeignKey and relationship to establish a many-to-one relationship between products and categories."
       )       
   print(output)

   
    