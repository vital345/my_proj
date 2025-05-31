from pydantic import BaseModel,Field
import json
from typing import Optional, Literal
from typing import List
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
import json
from langchain.prompts import ChatPromptTemplate



class Endpoint(BaseModel):
    """single endpoint"""
    endpoint_description: str = Field(description="description of the endpoint")
    endpoint_url: str = Field(description="relative url of the endpoint")
    endpoint_method: Literal['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] = Field(description="http method for the endpoint")
    is_authentication_required: bool = Field(description="Is the user required to be authenticated to access the endpoint")
    way_of_authetication: Optional[str] = Field(description="Specifies the authentication method used by the endpoint (e.g., 'Authorization: Bearer <TOKEN>', 'Authorization: Basic <TOKEN>', or 'Cookie: sessionid=<session_id>') etc.")
    is_implemented: bool = Field(description="Is the endpoint implemented in the source code")
    request_body_example: Optional[str | dict] = Field(description="Example format for request body for the endpoint.")

class Endpoints(BaseModel):
    endpoints: List[Endpoint] = Field(description="List of endpoints")

system_prompt = """
You are an intelligent agent tasked with analyzing a backend project.
You will accept a project requirements and the corresponding project 
source code as inputs. Your job is to extract all possible HTTP endpoints from
the source code and match them with the requirements listed in the project requirements. 
You will return a list of HTTP endpoints.

For each endpoint, you must provide:
endpoint_description: A brief description of what the endpoint does, based on the project requirements.
endpoint_url: The relative URL path of the endpoint (from source code).
endpoint_method: http request method for that endpoint.
request_body_example: An example of what the request body would look 
like for this endpoint, if applicable. 
is_authentication_required: A boolean value (true or false). Set this to true if 
user is required to be authenticated to access this endpoint. false otherwise.
is_implemented: A boolean value (true or false). Set this to true if 
the endpoint is found and implemented in the source code. 
Set it to false if the endpoint is described in the project requirements 
but not implemented in the code.

Instructions:
- Use the project requirements to extract all expected endpoints.
- Analyze the project source code to determine if the endpoint is implemented.
- For each endpoint, fill in the required details, including the URL path.
- Return the final list.

Note:
1) If endpoint in source code does not match the description in the Project Requirements.
Mention that in the endpoint_description. And write the endpoint_url, is_authentication_required 
request_body_example and endpoint_method according to the source code.
2) If multiple roles are there source code , then add login and register endpoints in output e.g if creating admin user then login admin user too.

Project Requirements:
{requirement_txt}

Project Source Code:
{repo_txt}
"""

randamizor_prompt = """
You are an intelligent agent designed to modify API payloads while maintaining system integrity and credential consistency. Follow these rules:

1. **Credential Synchronization**:
   - Identify registration/login pairs (e.g., /api/auth/register → /api/auth/login)
   - Generate credentials once per user flow using this pattern:
     * Email: Add 5 random chars before @ (john@→john_9fTq3@)
     * Password: Generate 12-char mix (letters, numbers, symbols)
   - Store modified credentials in a context map using original values as keys

2. **Intelligent Randomization**:
   For each string field:
   - Emails: Keep domain, randomize local part
   - Passwords: Generate strong new passwords
   - DOB: Randomize year (1950-2020)
   - Names/Titles: Append 4 random chars
   - Other strings: Append 8 random chars
   Preserve numbers, booleans, enums, IDs, and system fields (Role, UserId)

3. **Processing Workflow**:
   a) First process all registration endpoints:
      - Modify credentials using above rules
      - Store original and modified in context
   b) Process login endpoints:
      - Use credentials from context instead of randomizing
      - Match by original credential values
   c) Other endpoints:
      - Randomize all non-credential strings
      - Preserve numeric values and critical fields
      - Process array elements individually

4. **Safety Constraints**:
   - Never modify: authentication tokens, URLs, numeric IDs
   - Maintain valid formats (email, ISO dates, IDs)
   - Keep Role values exactly as provided
   - Ensure unique values across all modified fields

Input endpoints: {endpoint_list}
"""


async def backend_endpoint_extractor(project_requirement_txt:str,repo_txt:str)->Endpoints:
    
    print("project requirement document " + str(len(project_requirement_txt)))
    print("repo txt " + str(len(repo_txt)))

    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
    )

    _llm = llm.with_structured_output(Endpoints)
    
    prompt = ChatPromptTemplate.from_messages([
           ("system",system_prompt)
    ])
    
    chain = prompt | _llm
    
    
    n = 0
    while True:
        try: 
            output = await chain.ainvoke({
                'requirement_txt':project_requirement_txt,
                'repo_txt':repo_txt
            })
            print("Successfully generated output from LLM")
            break
        except:
            print("Error generating output from LLM retrying...")
            if n < 3:
                n+=1
                continue
            else:
                raise
            
    print(output)
    # Generating randamized output from LLM
            
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.4,
    )

    _llm = llm.with_structured_output(Endpoints)
            
    prompt = ChatPromptTemplate.from_messages([
           ("system",randamizor_prompt)
    ])
    
    chain = prompt | _llm
            
    while True:
        try:
            output_new: Endpoints = await chain.ainvoke({
                "endpoint_list":output.model_dump()
            })
            print("Successfully generated randamized output from LLM")
            return output_new
        except:
            print("Error generating output from LLM retrying...")
            if n < 3:
                n+=1
                continue
            else:
                raise
            
            
    

if __name__ == '__main__':
    backend_endpoint_extractor()
