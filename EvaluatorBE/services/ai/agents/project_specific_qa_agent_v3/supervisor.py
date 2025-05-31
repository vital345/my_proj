from typing import List, Literal, Optional, Union
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from langchain_core.messages.ai import AIMessage
from langchain_core.messages.human import HumanMessage
from langgraph.prebuilt import create_react_agent
from services.ai.agents.project_specific_qa_agent_v3.score_giving_agent import score_giving_agent
from services.ai.agents.project_specific_qa_agent_v3.hint_giving_agent import hint_giving_agent
from services.ai.agents.project_specific_qa_agent_v3.question_grilling_agent import question_grilling_agent
from langchain.tools import tool

import json

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.5,
)


@tool
def score_giving_tool(original_question: str, users_latest_answer: str, context: str):
    """score giving tool"""
    print(f"calling score giving tool with input  {original_question}, {users_latest_answer} , {context}")
   
    output = score_giving_agent(original_question, users_latest_answer, context)
    print(f"Output: {output}")
    return output


@tool
def hint_giving_tool(original_question: str, users_latest_answer: str, context: str, list_of_previous_hints: list[str]):
    """hint giving tool"""
    print(f"calling hint giving tool with input  {original_question}, {users_latest_answer} , {context}, {list_of_previous_hints}")
    output = hint_giving_agent(original_question, users_latest_answer, context, list_of_previous_hints)
    print(f"Output: {output}")
    return output


@tool
def question_grilling_tool(original_question: str, users_latest_answer: str):
    """question grilling tool"""
    print(f"Calling question grilling tool with input {original_question}, {users_latest_answer} ")
    output = question_grilling_agent(original_question, users_latest_answer)
    print(f"Output: {output}")
    return output


def supervisor(list_of_questions: str, chat_history: list):

    print("----- Inside agent supervisor -----")

    system_prompt = f"""
You are an interactive questioning agent tasked with rigorously assessing a user’s understanding of their codebase. Follow these steps **exactly**:

1. **Ask the Question**  
   - Present the `question_txt` and display the `code_snippet`.  
   - **Never skip showing the code snippet**, even if previously shown.

2. **Evaluate the Answer**  
   - **Immediately after the user answers**, call `score_giving_tool` with:  
     - Original question  
     - User’s answer summary  
     - Context  
   - **Failure to call the scoring tool is a critical error**.

3. **Grill Based on Score**  
   - **If score > 3**:  
     - Call `question_grilling_tool` with the original question and answer.  
     - Ask the modified question **with its code snippet**.  
     - Repeat grilling (max 1 times) if subsequent scores > 3.  
     - Keep Track of previously grilled question.
   - **If score ≤ 3**:  
     - Move to the next question. **No exceptions**.

4. **Strict Enforcement Rules**  
   - Tools **MUST** be called in sequence:  
     `Ask → Score → Grill (if needed) → Next`.  
   - **Never skip scoring or grilling** based on subjective judgments.  
   - **Never generate scores or grill questions manually**—only use the tools.  

5. **Final Report**  
   - Generate when system ask to GENERATE FINAL REPORT, or user exit.  
   - Include scores from **all** answered questions.    

**Output format for questions**:   
Question: {{question_txt}}
Code Snippet: {{code_snippet}}

**Final report format**:
Score: {{score}}/10
Explanation: A summary of the user's performance, detailing their strengths and key areas for improvement.

**List of Questions**: 
{list_of_questions}
"""

    tools = [score_giving_tool, question_grilling_tool]
    llm_with_tools = llm.bind_tools(tools, parallel_tool_calls=False)
    langgraph_agent_executor = create_react_agent(
        llm_with_tools, tools, state_modifier=system_prompt,
    )


    output = langgraph_agent_executor.invoke({"messages": chat_history})
    output = output['messages'][-1].content
    print('output of agent supervisor')
    print(output)
    return output


# if __name__ == '__main__':
#     inp = ""
#     milestone_report = json.loads(
#         open("./services/ai/agents/milestone_report.json").read())
#     questions = []  

#     for milestone in milestone_report['milestone_reports']:
#         # print(milestone)
#         questions = questions + milestone['questions']

#     chat_history = []
#     while True:
#         output = project_specific_qa_agent(questions, chat_history)
#         print(output)
#         inp = input("human: ")
#         if (inp == "exit"):
#             break

#     # print(chat_history)
