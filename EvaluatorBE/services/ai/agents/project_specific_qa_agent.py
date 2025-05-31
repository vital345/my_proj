from typing import List,Literal,Optional,Union
from langchain_openai import ChatOpenAI
from pydantic import BaseModel,Field
from db.chat_history import get_chat_history
from langchain_core.messages.ai import AIMessage
import json
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=1,
)

system_prompt = """
You are an intelligent agent designed to assess a user's understanding and 
knowledge of a given project. You will be provided with a project repository 
as input. Your task is to analyze the repository, ask the user relevant and 
challenging questions based on the project, and evaluate their answers.
Begin by asking questions to gauge the user's familiarity with the project 
structure, key functionalities, coding decisions, and implementation details.
The questions should become progressively more difficult based on the user's 
responses, covering areas such as architecture, design patterns, optimization, 
and specific technologies used in the project. Each question should aim to assess 
their knowledge and practical understanding of the project.
Final Output:
The Final output should contain a report containing the following details:
score: Generate a final score out of 10 at the end of the session, based on the cumulative 
performance. (score must be an integer)
explanation: Provide a brief explanation  explaining the score and highlight the user's strengths 
and areas for improvement.
EXAMPLE OUTPUTS:
Example 1 (Question):
Question(question = "what is react")
Example 2 (FinalReport):
FinalReport(score=5,explanation="This is example explanation")
Note:
You have to 8 questions.
After asking all the questions output final Report.
**Never give answer of the questions you asked to the user.** You only need to ask questions
and generate Final output. **When user is unable to give answer to a question simply move to 
next question.**
**After user response, ask  follow-up questions to probe deeper into user's knowledge. 
For instance, if an user mentions of using lambda function, ask user questions around lambda function. 
(How lambda functions are different from normal functions.)**
Project repo File:
{repo_txt}
"""
class Question(BaseModel):
    question:str = Field(description="question you want to ask the user")
    
class FinalReport(BaseModel):
    """Final report after the evaluation process"""
    score:int = Field(description="final score out of 10 at the end of evaluation process")
    explanation:str = Field(description="brief explanation  explaining the score and highlight the user's strengths and areas for improvement.")
    
class Output(BaseModel):
    output: Union[FinalReport,Question]


def project_specific_qa_agent(session_id:str,repo_txt:str,query:Optional[str] = ""):
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
                ("system",system_prompt.format(repo_txt = repo_txt))] + chat_history.messages + [("human",query)])
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
    int = ""
    while True:
        output = project_specific_qa_agent(1,"")
        print(output)
        inp = input("human: ")
        if(inp == "exit") : break
        
        

   
    