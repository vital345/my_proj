import os
import asyncio
import json
from typing import List
from pydantic import BaseModel, Field
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.tools import Tool
from langchain_core.prompts import ChatPromptTemplate
from playwright.sync_api import sync_playwright
from langchain.tools import tool
from langchain_openai import ChatOpenAI

# Initialize the LLM globally
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
)

# ------------------- Global Tools (No Page Dependency) ------------------- #
class FindElementInput(BaseModel):
    element_description: str = Field(description="Description of an HTML Element")

def _build_xpath_prompt(element_description: str) -> str:
    return f"""Given the element description "{element_description}", generate a valid XPath to locate the element. Guidelines:
    1. Use flexible search patterns like `//*[contains(text(), '{element_description}') or contains(@id, '{element_description}')]`.
    2. Consider tags like button, a, input, etc.
    3. Handle multiple matches with positional indexes.
    Provide only the XPath."""

@tool(args_schema=FindElementInput)
def find_element(element_description: str) -> str:
    """Finds the XPath of an element based on its description."""
    try:
        prompt = _build_xpath_prompt(element_description)
        return llm.invoke(prompt).content.strip()
    except Exception as e:
        return f"Error generating XPath: {str(e)}"

# ------------------- Page Interaction Tools (Redefined per Test Run) ------------------- #
def create_page_tools(page):
    """Creates tools with access to the current Playwright page."""
    
    @tool
    def go_to_website(url: str) -> str:
        """Navigates to specified URL."""
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            return f"Navigated to {url}"
        except Exception as e:
            return f"Navigation failed: {str(e)}"

    @tool
    def click_element(element_xpath: str) -> str:
        """Clicks element at given XPath."""
        try:
            locator = page.locator(element_xpath)
            locator.wait_for(state="visible", timeout=5000)
            if locator.is_enabled():
                locator.click()
                return "Click successful"
            return "Element not interactable"
        except Exception as e:
            return f"Click failed: {str(e)}"

    class WriteIntoElement(BaseModel):
        element_xpath: str = Field(description="XPath of input element")
        text: str = Field(description="Text to input")

    @tool(args_schema=WriteIntoElement)
    def write_into_element(element_xpath: str, text: str) -> str:
        """Inputs text into specified element."""
        try:
            locator = page.locator(element_xpath)
            if locator.is_visible() and locator.is_enabled():
                locator.fill(text)
                return "Input successful"
            return "Element not interactable"
        except Exception as e:
            return f"Input failed: {str(e)}"

    return [go_to_website, click_element, write_into_element]



async def execute_test_async(instructions: List[str], url: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, execute_test, instructions, url)

# ... (keep previous imports and llm initialization)

# ------------------- System Prompt Configuration ------------------- #
SYSTEM_PROMPT_TEMPLATE = """You are an automated test execution agent. Your task is to interact with web 
applications based on provided user instructions, ensuring accurate and consistent execution. 

**Base URL**: {base_url}

**Execution Guidelines:**
1. Always start with `go_to_website` using the base URL
2. Validate elements exist before interaction
3. Confirm action success before proceeding
4. Handle errors gracefully with detailed logging

**Required Report Format:**
At test completion, generate this structured report:

Execution Summary:
- Test name: [Brief test description]
- Test Status: Success | Partial Success | Failure
- Total steps executed: [number]
- Successful steps: [number]
- Failed steps: [number]
- Final conclusion: [1-2 sentence outcome summary]

**Example Execution:**
User Instruction: "Test login workflow"
1. go_to_website "http://localhost:5173/login"
2. find_element "username field" → //input[@id='username']
3. write_into_element (//input[@id='username'], "testuser")
4. find_element "password field" → //input[@id='password']
5. write_into_element (//input[@id='password'], "password123")
6. find_element "login button" → //button[contains(text(), 'Sign in')]
7. click_element //button[contains(text(), 'Sign in')]

**Example Report:**
Execution Summary:
- Test name: Login functionality test
- Test Status: Success
- Total steps executed: 7
- Successful steps: 7
- Failed steps: 0
- Final conclusion: Login workflow completed successfully
"""

# ------------------- Agent Execution Flow ------------------- #
def create_agent_executor(tools, base_url: str):
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT_TEMPLATE),
        ("human", "{user_instructions}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True
    )

# ------------------- Test Execution Core ------------------- #
def execute_test(instructions: List[str], url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # Create fresh tools and agent for each test run
            page_tools = create_page_tools(page)
            agent_executor = create_agent_executor([find_element] + page_tools, url)
            
            # Execute with structured instructions
            result = agent_executor.invoke({
                "user_instructions": "\n".join(
                    [f"{i+1}. {instr}" for i, instr in enumerate(instructions)]
                ),
                "base_url": url
            })
            
            return result["output"]
        finally:
            browser.close()


# ------------------- Main Execution ------------------- #
def main():
    # Windows event loop policy
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    # Load test cases
    test_file = os.path.join(os.path.dirname(__file__), "project_workflows.json")
    with open(test_file, 'r') as f:
        test_cases = json.load(f)

    # Execute sample test case
    test_case = test_cases[1]
    result = asyncio.run(
        execute_test_async(
            test_case['instructions'], 
            test_case.get('url', 'http://localhost:5173')
        )
    )
    print(f"Test Result:\n{result}")

if __name__ == '__main__':
    main()