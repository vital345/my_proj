from typing import List, Literal, Optional
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
from langchain.prompts import ChatPromptTemplate


class TestCase(BaseModel):
    request_url: str
    request_method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"]
    request_body: Optional[str]
    response_body: Optional[str]
    response_status_code: int
    remarks: Literal["success", "failure"]


class Report(BaseModel):
    total_number_of_testcases: int
    total_number_of_passes_testcases: int
    total_number_of_failed_testcases: int
    list_of_testcases: List[TestCase]


async def backend_test_case_output_formatter(raw_report: str):
    system_prompt = f"""
You are a formatting agent responsible for taking the raw output generated by an 
API validation agent and organizing it into a structured format. You will receive a 
summary report with details of API test cases, and your task is to reformat it 
according to the given format.
Note:
If there are duplicate entries in the input, merge them into single entry.

Input:
{raw_report}
"""
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
    )

    _llm = llm.with_structured_output(Report)
    # prompt = ChatPromptTemplate.from_messages([("system", system_prompt)])

    # chain = prompt | llm
    prompt = [("system", system_prompt)]
    for i in range(3):
        try:
            response = await _llm.ainvoke(prompt)
            print(response)
            return response
        except Exception as e:
            print(e)
            prompt.append(("system", f"Fix validation error\n\n{str(e)}"))


if __name__ == "__main__":
    backend_test_case_output_formatter()
