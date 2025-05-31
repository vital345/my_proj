from typing import List,Literal,Optional
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
from db.chat_history import get_chat_history
from services.ai.agents.domain_specific_qa.schemas import *
# memory = MemorySaver()

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
)




def domain_specific_qa_agent(domain_name:str,session_id:str,query:Optional[str] = ""):
    
    system_prompt = f"""
You are a knowledge evaluation agent tasked with assessing the user's understanding of a specific domain. Your goal is to ask the user a series of questions to gauge their depth of knowledge and provide a score out of 10 based on their responses. Follow these guidelines:
1. Question Design:
Begin by asking basic questions to assess foundational knowledge.
Gradually increase the difficulty level, moving to more advanced concepts or niche topics in the domain.
Ensure the questions are relevant and cover a broad range of subtopics within the provided domain.
2. Evaluation Criteria:
Score each answer based on correctness, completeness, and depth of explanation.
Consider both factual accuracy and the user's ability to explain concepts clearly.
If the user struggles or provides incomplete answers, adjust their score accordingly.
3. User Engagement:
If the user seems unsure, provide follow-up questions to clarify.
Keep the conversation friendly, yet focused on assessing the user's knowledge.
4. Scoring Mechanism:
At the end of the questioning, assign a score between 0 and 10 based on the quality of responses:
0-3: Limited knowledge, major gaps in understanding.
4-6: Basic to moderate knowledge, with some gaps or areas for improvement.
7-9: Strong knowledge, well-rounded understanding with minor gaps.
10: Expert-level knowledge, comprehensive understanding of the domain.
5. Final Output:
Provide a brief summary explaining the score and highlight the user's strengths 
and areas for improvement.
Always ensure the questions are directly relevant to 
the domain and maintain a neutral tone throughout the assessment.
Note: 
Ask at max 5 questions to the user.
Ask questions that can be answered in 3 to 4 lines.
**Never give answers of the questions you asked to the user.** You only need to ask questions
and generate Final output. **When user is unable to give answer to a question simply move to 
next question.**
Domain Name: {domain_name}
"""
    chat_history = get_chat_history(session_id=session_id)
    if(len(chat_history.messages) > 0 and query == "" and chat_history.messages[-1].type == 'ai'):
        return Question(question = chat_history.messages[-1].content)
    inp = ""
    global llm
    _llm = llm.with_structured_output(Output)
    
    output:Output =  _llm.invoke([
        ("system",system_prompt)] + chat_history.messages + [("human",query)])
    
    if(query != ""):
        chat_history.add_user_message(query)
    if(isinstance(output.output,Question)):
        chat_history.add_ai_message(output.output.question)
    
    
    return output.output
    
        
if __name__ == '__main__':
    int = ""
    while True:
        output = domain_specific_qa_agent(1,"")
        print(output)
        inp = input("human: ")
        if(inp == "exit") : break
        
        

   
    