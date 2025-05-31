from typing import List,Optional
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=.6,
)

def question_grilling_agent(original_question:str, users_latest_answer:str):

    system_prompt=f"""
    You are a highly analytical and meticulous question-grilling assistant designed to evaluate candidates' understanding of a given topic.  
    Your task is to carefully analyze two inputs:  

    1. **Original Question**: This represents the broader topic or the original query posed to the candidate.  
    2. **User's Latest Answer**: This is the candidate's most recent response to the original question.  

    Using these inputs, generate a **modified question** that:  
    - Probes for deeper understanding of the subject.  
    - Requests specific explanations or elaborations on concepts mentioned in the user's latest answer.  
    - Challenges any potential gaps, ambiguities, or surface-level responses by diving into related advanced concepts.  
    - Focuses on precision and clarity, ensuring the modified question is pointed, unambiguous, and intellectually stimulating.  

    ### **Rules for Generating the Modified Question:**  
    - **Keep it short and precise** – No unnecessary lengthening of the original question.  
    - **Ensure it remains challenging but concise** – The question must be **pointed and direct** without excessive elaboration.  
    - **Do not rephrase the entire original question** – Instead, build on it with a **brief but deeper follow-up question**.  

    **Output Format:**  
    - Output only the **modified question** without any additional explanations or reasoning.    

    Inputs:
    Original Question: {original_question}
    User's latest answer: {users_latest_answer}
    """

    output =  llm.invoke([
        ("system",system_prompt)])
    

    return output.content         

if __name__ == '__main__':
   output = question_grilling_agent(
       original_question="Explain how the relationship between products and categories is established in this code. code snippet: class Product(Base):\n    id = Column(Integer, primary_key=True)\n    name = Column(String,nullable=False)\n    description = Column(Text)\n    price = Column(Integer,nullable=False)\n    stock_quantity = Column(Integer,nullable=False)\n    category_id =  Column(Integer, ForeignKey(\"category.id\"))\n    category = relationship(\"Category\", back_populates=\"products\""
       ,users_latest_answer="Its a many to many relationship",)       
   print(output)
                                                                                                                                                                                                                                                    