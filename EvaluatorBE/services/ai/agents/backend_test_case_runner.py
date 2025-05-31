import asyncio
import traceback
from typing import Optional, Literal, Union
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
from langchain_core.output_parsers import JsonOutputParser

# from langchain_core.pydantic_v1 import BaseModel as BM
from langchain_core.prompts import PromptTemplate


async def test_case_runner_session(requirement_txt: str, endpoints_txt: str, url: str):
    session_store = []
    way_of_authentication = None
    for endpoint in json.loads(endpoints_txt).get("endpoints", []):
        if endpoint.get("way_of_authetication"):
            way_of_authentication = endpoint["way_of_authetication"]

        del endpoint["way_of_authetication"]

    if not way_of_authentication:
        print("Way of authentication not found in endpoints")

    system_prompt_login_output = """
    Your task is to generate valid request headers containing the necessary authentication token based on the provided login response and authentication method.

    **Requirements:**  
    - Extract the relevant authentication token or credentials from the login responAuthorizationse (headers and/or body).  
    - Construct the appropriate headers for future authenticated requests using Python's `requests` module.  
    - Ensure the headers align with the specified authentication method.  
    - If the authentication method requires token renewal or additional processing, format the headers accordingly.

    **Inputs:**  
    - **Login Response HTTP Headers:**  
    {headers}  

    - **Login Response HTTP Body:**  
    {body}  

    - **Authentication Method:**  
    {way_of_authentication}  
    
    **OUTPUT**
    {format_instructions}

    """

    class LoginOutput(BaseModel):
        headers: dict

    class ExecuteHttpRequestInput(BaseModel):
        method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"] = Field(
            description="Type of http method"
        )
        url: str = Field(
            description="Complete url of the endpoint e.g Base Url + endpoint"
        )
        headers: Optional[dict] = Field(
            description="request headers in dictionary format", default=None
        )
        body: Optional[dict] = Field(
            description="request body in dictionary format", default=None
        )
        is_login_request: Optional[bool] = Field(
            description="Is this a login request for authentication, for example: If it seems url can be used for login then make it true",
            default=False,
        )
        way_of_authentication: str = Field(
            description="Way of authentication for the user which is mentioned with the HTTP Endpoint.",
            default=None,
        )

    # deployed_url:str

    @tool(args_schema=ExecuteHttpRequestInput)
    async def execute_http_request(
        method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"],
        url: str,
        headers: Optional[dict] = None,
        body: Optional[dict] = None,
        is_login_request: Optional[bool] = False,
        way_of_authentication: str = way_of_authentication,
    ):
        """
        Executes the http request and returns http response body and status code.
        """
        # print(f"http_request {method} {url} {body}")
        print("is_login_request: " + str(is_login_request))
        print("session_store: ", session_store)
        print("way_of_authentication: ", way_of_authentication)

        if headers:
            headers["Content-Type"] = "application/json"
        else:
            headers = {"Content-Type": "application/json"}

        index = 0
        while True:
            try:
                headers.update(session_store[index])
            except IndexError:
                if index != 0:
                    break
            response = requests.request(
                method, url, headers=headers, data=(json.dumps(body) if body else None)
            )

            print(
                f"http_request {method} {url} {body} {headers} {response.headers} status_code {response.status_code} response: {response.text}"
            )
            print("")
            if response.status_code == 401:
                print("Not correct creds maybe. Checking different creds if present")
                index += 1
                continue

            if is_login_request and response.status_code in range(200, 210):

                __llm = ChatOpenAI(
                    model="gpt-4o",
                    temperature=0,
                )
                # _llm = __llm.with_structured_output(LoginOutput)
                parser = JsonOutputParser(pydantic_object=LoginOutput)
                # prompt = ChatPromptTemplate.from_messages(
                #     [("system", system_prompt_login_output)]
                # )

                prompt = PromptTemplate(
                    template=system_prompt_login_output,
                    input_variables=["headers", "body", "way_of_authentication"],
                    partial_variables={
                        "format_instructions": parser.get_format_instructions()
                    },
                )

                chain = prompt | __llm | parser

                # chain = prompt | _llm
                for i in range(3):
                    try:
                        session = await chain.ainvoke(
                            {
                                "headers": response.headers,
                                "body": response.text,
                                "way_of_authentication": way_of_authentication,
                            }
                        )
                        print("Headers from login response: ", session)
                        print(type(session))
                        break
                    except Exception as e:
                        print("Error in execute_http_request")
                        print(e)
                        continue
                session_store.append(session.get("headers", {}))
            index += 1
        
            return {
                "body": response.text,
                "status_code": response.status_code,
            }

    async def backend_test_case_runner(
        requirement_txt: str, endpoints_txt: str, url: str
    ) -> str:
        # global deployed_url
        # deployed_url = url

        system_prompt = f"""
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
    - For every provided endpoint, use the execute_http_request tool to send requests using the base URL concatenated with the endpoint. Take every detail from HTTP endpoints list.
        
    3. Cross-Endpoint Validation:
    - Test related endpoints to ensure they work together correctly. For example, 
        verify that resources created by one endpoint can be retrieved or updated by another.

    4. **Comprehensive Final Report**:
    - You must generate the final report in the **exact format** provided below. This format is mandatory and must be followed:
    
    **Report Format:**

    Total test cases executed: {{number_of_test_cases}}
    Total test cases passed: {{number_of_passed_cases}} 
    Total test cases failed: {{number_of_failed_cases}}

    Test Case Breakdown:

    1. Test Case: {{test_case_name}}
    Request URL: {{request_url}}
    HTTP Method: {{http_method}}
    Request Body: {{request_body}} (if applicable)
    Response Body: {{response_body}}
    Response Status Code: {{status_code}}
    Remarks: {{Success/Failure}}

    2. Test Case: {{test_case_name}}
    Request URL: {{request_url}}
    HTTP Method: {{http_method}}
    Request Body: {{request_body}} (if applicable)
    Response Body: {{response_body}}
    Response Status Code: {{status_code}}
    Remarks: {{success (when the endpoint performs as expected)/failure (when the endpoint does not perform as expected)}}

    (List all test cases)

    - Ensure that **each test case** includes:
    - The test case name
    - The request URL
    - The HTTP method used (GET, POST, PUT, DELETE, etc.)
    - The request body (if applicable; write 'N/A' if not)
    - The response body returned by the API
    - The HTTP status code returned by the API
    - Whether the test was a **Success** or **Failure**

    ------
    Project Requirements:
    {requirement_txt}

    HTTP Endpoints:
    {endpoints_txt}

    HTTP Base URL:
    {url}
    
    **Note**: 
     1) Never stops testing until all endpoints are covered. List All the test cases in the report.
     2) If any error comes while testing which can be fixed by modifying the request then modify the request and test again.
     3) Always use the latest response to modify the request.
     4) Always try to find the admin endpoints if there are multiple roles in the project. And try to login with admin and normal user to access all endpoints.
    
    """

        print("requirements length: " + str(len(requirement_txt)))
        print("endpoints length: " + str(len(endpoints_txt)))

        tools = [execute_http_request]

        memory = MemorySaver()
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.5,
        )

        llm_with_tools = llm.bind_tools(tools, parallel_tool_calls=False)
        langgraph_agent_executor = create_react_agent(
            llm_with_tools, tools, state_modifier=system_prompt, checkpointer=memory
        )

        config = {"recursion_limit": 100, "configurable": {"thread_id": uuid.uuid4()}}
        output = ""
        messages = []
        count = 0
        final_output: str = ""
        while True:
            try:
                output = await langgraph_agent_executor.ainvoke(
                    {"messages": messages}, config=config
                )
                output = output["messages"][-1].content
                print("---------------------Output--------------------------")
                print(output)
                print("---------------------Output--------------------------")
                is_process_fully_complete = await check_final_output_is_generated(
                    output
                )
                final_output += output

                print("is_process_fully_complete: " + str(is_process_fully_complete))
                print("----------------------------------------------------")
                print("----------------------------------------------------")
                print("----------------------------------------------------")
                print("----------------------------------------------------")
                if is_process_fully_complete or count >= 3:
                    break
                else:
                    messages = ["execute remaining steps"]
                    if count == 2:
                        messages = [("system", "Now list all test cases for the report with every detail.")]
                count = count + 1
            except Exception as e:
                print("This is handled exception in backend_test_case_runner")
                traceback.print_exc()

        return final_output

    async def check_final_output_is_generated(input: str) -> bool:
        # print(f"Output from previous agent: {input}")

        class OutputFormat(BaseModel):
            output: bool

        prompt = f"""
    You are a validation agent tasked with reviewing the output of a previous agent.
    Your role is to analyze the input (the previous agent's output) and determine whether 
    any tasks remain incomplete.

    - Output **False** if the previous agent's output explicitly mentions that there are 
    unfinished steps or that the agent has tasks to complete in the future.
    - Output **True** if no such statements are made.

    Below is the output from the previous agent:
    {input}
    """
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.5,
        )

        result = await llm.with_structured_output(OutputFormat).ainvoke(
            [("system", prompt)]
        )
        return result.output

    return await backend_test_case_runner(requirement_txt, endpoints_txt, url)


if __name__ == "__main__":

    endpoints_file = open(
        "/home/vipinkumar6@deloitte.com/projects/deployed_hu_assist/BE/services/ai/agents/endpoints2.txt"
    )
    endpoints_txt = endpoints_file.read()
    endpoints_file.close()

    requirements_file = open(
        "/home/vipinkumar6@deloitte.com/projects/deployed_hu_assist/BE/services/ai/agents/proj_require.txt"
    )
    requirement_txt = requirements_file.read()
    requirements_file.close()
    # print(system_prompt)
    url = (
        "https://hu-sp-40cca44f5-techn-40cca5173-1740386121936-urtjok3rza-wl.a.run.app/"
    )
    asyncio.run(test_case_runner_session(requirement_txt, endpoints_txt, url=url))
    # backend_test_case_runner(requirement_txt,endpoints_txt,url=url)
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
