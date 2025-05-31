from typing import List,Literal,Optional,Union
from langchain_openai import ChatOpenAI
from pydantic import BaseModel,Field
from db.chat_history import get_chat_history
from langchain_core.messages.ai import AIMessage
from langchain_core.messages.human import HumanMessage
import json
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=1,
)

system_prompt = """
You are an interactive questioning agent responsible for assessing a user's understanding of their codebase. 
You will receive a list of questions as input. Each question will have three parts:
1. question_txt: The question text that you need to ask the user.
2. code_snippet: An optimal code snippet related to the question.
3. context: An explanation of the context of the question.
 
Your task is to engage with the user by asking them the questions and evaluating their responses. 
Follow these steps for each question:
 
1. Ask the Question:
each question should have following components 
 - question_txt: The question text that you need to ask the user.
 - code_snippet: An optimal code snippet related to the question.
 
If the user answers the question correctly, proceed to the next question.
 
2. Provide Hints if Necessary:
If the user is unable to answer or struggles with the question, provide a gentle hint to guide them.
You are allowed to give up to 2 hints. If the user still cannot answer after 2 hints, move on to the next question.
 
3. Adjust Score for Hints:
 
If hints are provided, adjust the final score accordingly. Deduct points based on the level of assistance 
required, but ensure the process remains supportive and constructive.
 
4. Generate Final Report:
After asking all questions, produce a final report containing:
Score (out of 10): This should reflect the user's overall performance, including correct answers and adjustments 
for hints.
Explanation: Provide a brief explanation of the score, highlighting the user's strengths and areas for improvement. 
EXAMPLE OUTPUTS:
Example 1 (Question):
Question(question = "what is react",code_snippet="....")
Example 2 (FinalReport):
FinalReport(score=5,explanation="This is example explanation")
Important Notes:
Score should be an integer and should range between 0 to 10.
**Never give answer of the questions you asked to the user. YOu are only allowed 
to provide hints to the user** 
**Never repeat exact same question twice.**

List Of Questions:
{list_of_questions}
"""

class Question(BaseModel):
    question:str = Field(description="question you want to ask the user")
    code_snippet:Optional[str] = Field(description="An optimal code snippet related to the question.")
    
class FinalReport(BaseModel):
    """Final report after the evaluation process"""
    score:int = Field(description="final score out of 10 at the end of evaluation process")
    explanation:str = Field(description="brief explanation  explaining the score and highlight the user's strengths and areas for improvement.")
    
class Output(BaseModel):
    output: Union[FinalReport,Question]

chat_history = []
def project_specific_qa_agent(session_id:str,list_of_questions:str,query:Optional[str] = ""):
    chat_history = get_chat_history(session_id=session_id)
    if(len(chat_history.messages) > 0 and query == "" and chat_history.messages[-1].type == 'ai'):
        return Question(question = json.loads(chat_history.messages[-1].content)["output"]["question"])
        
    inp = ""
    global llm
    _llm = llm.with_structured_output(Output)
    
    n = 0
    
    while True:
        
        try:
            print("Generating project specific question")
            output:Output = _llm.invoke([
                ("system",system_prompt.format(list_of_questions = list_of_questions))] + chat_history.messages + [("human",query)])
            print("Successfully generated project specific question")
            break
        except:
            print("Error in generating output")
            n += 1
            if(n < 3): continue
            else:
                raise Exception("Unable to generate output from LLM")
                
            
    
    if(query != ""):
        chat_history.add_user_message(query)
    if(isinstance(output.output,Question)):
        chat_history.add_ai_message(json.dumps(output.model_dump()))
    
    
    return output.output
    
        
if __name__ == '__main__':
    inp = ""
    milestone_report = json.loads(open("./services/ai/agents/milestone_report.json").read())
    questions = []
    
    for milestone in milestone_report['milestone_reports']:
        # print(milestone)
        questions = questions + milestone['questions']
    
    while True:
        output = project_specific_qa_agent(1,questions,inp)
        print(output)
        inp = input("human: ")
        if(inp == "exit") : break
        
    print(chat_history)
        
        

   
    