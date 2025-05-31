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

# class Milestone(BaseModel):
#     """Single milestone"""
#     title: str = Field(description="Name of the milestone")
#     description: str = Field(description="detailed the milestone")
#     sub_tasks: List[str] = Field(description="Detailed list of subtasks for the milestone")
    
# class Output(BaseModel):
#     """Final Output"""
#     output: List[Milestone] = Field(description="List of milestones")


        
def hint_giving_agent(original_question:str, users_latest_answer:str,context:str,list_of_previous_hints:list[str]):
    
    system_prompt = f'''
You are an intelligent agent responsible for guiding users to the correct answer by providing minimal hints. 
You will receive a question, the user's latest answer, context (detailing the structure or nature of the expected 
correct answer), and a list of previous hints given.
Your task is to analyze the user's response and determine the next incremental hint in order to gauge users understanding of the question, that will help them approach the correct answer. You will then modify the question to include this next hint. Your goal is to lead the user to the correct answer gradually, offering just enough information to keep them engaged and on track.
When generating the next hint, ensure the following:
**Do not restate the full question.**
**Keep the modification minimal( a single sentence or phrase) Do not make the question significantly longer. **
**While giving the hint increase the difficulty of the question.**
Focus on breaking down the problem or concept into smaller, understandable steps.
**Avoid excessive explanation**- hints should be concise and direct.
**Frame the hint in a way that reminds the user of the original question without making it redundant.**

Input Format:
1. Original question.
2. User's latest answer.
3. Context specifying the actual answer's structure.
4. List of previous hints provided.

Output Format:
A **short hint** (one sentence or phrase) that builds upon the original question without repeating it entirely.

Inputs:
Original Question: {original_question}
User's latest answer: {users_latest_answer}
Context specifying the actual answer's structure: {context}
List of previous hints provided:{list_of_previous_hints}

'''
    system_prompt = f"""
    You are an intelligent agent that incrementally modifies questions by embedding minimal, escalating hints to guide users toward the correct answer. 

**Task:**  
Rephrase the original question by integrating a **single new hint** (as a concise phrase/sentence) that:  
1. Subtly increases the question's complexity (e.g., hints at a deeper concept or next step).  
2. Avoids restating the original question.  
3. Builds on prior hints (if any) without redundancy.  
4. Keeps the modified question only slightly longer than the original.  

**Inputs:**  
- Original Question: {original_question}  
- User’s Latest Answer: {users_latest_answer}  
- Answer Structure Context: {context}  
- Previous Hints: {list_of_previous_hints}  

**Output Format:**  
Return **only the modified question** with the embedded hint.  

**Example:**  
Original: "What causes photosynthesis?"  
Modified: "What cellular process uses chlorophyll to convert light energy?"  
    """
    
    
    # _llm = llm.with_structured_output(Output)
    
    output =  llm.invoke([
        ("system",system_prompt)])
    

    return output.content
    
        
if __name__ == '__main__':
   output = hint_giving_agent(
       original_question="Explain how the relationship between products and categories is established in this code. code snippet: class Product(Base):\n    id = Column(Integer, primary_key=True)\n    name = Column(String,nullable=False)\n    description = Column(Text)\n    price = Column(Integer,nullable=False)\n    stock_quantity = Column(Integer,nullable=False)\n    category_id =  Column(Integer, ForeignKey(\"category.id\"))\n    category = relationship(\"Category\", back_populates=\"products\""
       ,users_latest_answer="Its a many to many relationship",
       context="The candidate should explain the use of ForeignKey and relationship to establish a many-to-one relationship between products and categories."
       ,list_of_previous_hints=[])       
   print(output)

   
    