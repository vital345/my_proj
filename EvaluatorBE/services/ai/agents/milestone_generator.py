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


        
async def milestone_extractor_agent(project_requirements:str):
    
    system_prompt = f'''
You are a Milestone Extraction Agent responsible for analyzing detailed project requirements 
and identifying structured milestones. Your task is to extract key milestones from the provided 
project requirements, following these guidelines:

Guidelines for Milestone Extraction:
1. Milestone Identification:
Accurately extract all explicitly mentioned milestones from the project requirements.
Each milestone must have a clear and descriptive title, along with sub-tasks.

2. Milestone Structure: 
Each milestone should be organized in the following format:
title: Title of the Milestone
description: A concise summary explaining the scope of the milestone.
sub_tasks: A list of specific tasks or deliverables that fall under this milestone. 
(Note: Sub-tasks must only be extracted from the project requirements 
do not infer or create new tasks beyond what is provided.)

3. Output :
You must output all available milestones in required format.

5. Additional Notes:
 - Milestones and sub-tasks must strictly follow the project description.
 - Avoid adding any commentary, explanations, or assumptions that are not explicitly 
stated in the requirements.

Project Requirements:
{project_requirements}
'''
    
    
    _llm = llm.with_structured_output(Output)
    for i in range(3):
        try:
            output:Output =  await _llm.ainvoke([
                ("system",system_prompt)])
            print("Output from milestone_extractor_agent",output)   
            return output.output
        except Exception as e:
            print(e)
            continue
    
        
# if __name__ == '__main__':
#    output = milestone_extractor_agent(project_requirements)       
#    output = [o.model_dump() for o in output]
#    print(output)

   
    