from typing import Optional, Literal
import requests
from typing import List
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel, Field
import json
from langchain.prompts import ChatPromptTemplate
import uuid
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate


class ExecuteHttpRequestInput(BaseModel):
    method: Literal['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] = Field(
        description="Type of http method")
    url: str = Field(description="relative url")
    headers: Optional[dict] = Field(
        description="request headers in dictionary format", default=None)
    body: Optional[dict] = Field(
        description="request body in dictionary format", default=None)


@tool(args_schema=ExecuteHttpRequestInput)
def execute_http_request(method: Literal['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], url: str, headers: Optional[dict] = None, body: Optional[dict] = None):
    """
    Executes the http request and returns http response body and status code. 
    """
    # print(f"http_request {method} {url} {body}")
    if (headers):
        headers['Content-Type'] = 'application/json'
    else:
        headers = {'Content-Type': 'application/json'}
    response = requests.request(
        method,
        'http://localhost:5000' + url, headers=headers, data=json.dumps(body))

    print(f"http_request {method} {url} {body} response: {response.text}")
    print("")
    return {
        'body': response.text,
        'status_code': response.status_code,
    }


llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.5,
)


def backend_test_case_runner(requirement_txt: str, endpoints_txt: str) -> str:

    system_prompt = """
You are an API validation agent responsible for thoroughly testing all provided HTTP 
endpoints. You will be given project requirements, a list of HTTP endpoints, and example
input structures. Your task is to simulate API requests, validate each endpoint, and 
ensure they behave as expected under all conditions, including error handling and edge 
cases.
Follow the steps below for every endpoint:
1. Understand Project Requirements:
   - Review the project requirements in detail to understand the expected behavior 
     of each endpoint.
     
2. Complete Endpoint Validation:
   - For every provided endpoint, use the execute_http_request tool to send requests and 
     validate responses against the expected outcomes.
     
3. Cross-Endpoint Validation:
   - Test related endpoints to ensure they work together correctly. For example, 
     verify that resources created by one endpoint can be retrieved or updated by another.

4. Error Handling & Edge Cases:
   - Test all endpoints for expected errors and edge cases, such as invalid inputs, 
     missing parameters, or incorrect data types. Ensure the system responds with the 
     appropriate error messages or status codes.

5. **Comprehensive Final Report**:
   - You must generate the final report in the **exact format** provided below. This format is mandatory and must be followed:
  
   **Report Format:**

Total test cases executed: {{number_of_test_cases}}
Total test cases passed: {{number_of_passed_cases}} 
Total test cases failed: {{number_of_failed_cases}}

Test Case Breakdown:

1. Test Case: {{test_case_name}}
Request URL: {{request_url}}
HTTP Method: {{http_method}}
Request Body: {{request_body}}(if applicable)
Response Body: {{response_body}}
Response Status Code: {{status_code}}
Remarks: {{Success/Failure}}

2. Test Case: {{test_case_name}}
Request URL: {{request_url}}
HTTP Method: {{http_method}}
Request Body: {{request_body}} (if applicable)
Response Body: {{response_body}}
Response Status Code: {{status_code}}
Remarks: {{Success/Failure}}

(Continue listing all test cases)

- Ensure that **each test case** includes:
  - The test case name
  - The request URL
  - The HTTP method used (GET, POST, PUT, DELETE, etc.)
  - The request body (if applicable; write 'N/A' if not)
  - The response body returned by the API
  - The HTTP status code returned by the API
  - Whether the test was a **Success** or **Failure**

**Important**: The report must be generated in this exact format. Deviations from this format are not acceptable.

Do not stop until all endpoints, error handling scenarios, and edge cases have been fully tested.
------
Project Requirements:
{requirement_txt}
HTTP Endpoints:
{endpoints_txt}
Admin Login Credentials:
{{
"username": "sagnik",
"password": "jana"
}}
"""

    print("requirements length" + str(len(requirement_txt)))
    print("endpoints length" + str(len(endpoints_txt)))

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system", system_prompt
            ),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ]
    )

    tools = [
        execute_http_request
    ]

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    output = agent_executor.invoke(
        {"input": "", 'requirement_txt': requirement_txt, 'endpoints_txt': endpoints_txt})
    print(output)

    return output


def check_final_output_is_generated(input: str) -> bool:

    class OutputFormat(BaseModel):
        output: bool

    prompt = f"""
    You are a validation agent responsible for processing output of a previous agent. 
    You will receive the output from the previous agent as input. 
    Your task is to analyze this input.
    Based on your analysis 
    output False only when it is mentioned in the previous agent output that some steps are still remaining.
    output True otherwise.
    Output From Previous Agent:
    {input}
    """

    return llm.with_structured_output(OutputFormat).invoke([
        ("system", prompt)
    ]).output


if __name__ == '__main__':

    endpoints_file = open("./services/ai/agents/endpoints.json")
    endpoints_txt = endpoints_file.read()
    endpoints_file.close()

    requirements_file = open("./services/ai/agents/project-requirement.txt")
    requirement_txt = requirements_file.read()
    requirements_file.close()
    # print(system_prompt)
    print(backend_test_case_runner(requirement_txt, endpoints_txt))
    # result = execute_http_request(
    #     'GET',
    #     '/product/',
    #     headers={
    #         },
    #     body={
    #         'name': 'Product Name',
    #         'description': 'Product Description',
    #           'price': 100, 'stock_quantity': 10}
    # )
    # print(result)
    # /product/
