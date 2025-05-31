from langchain_community.chat_message_histories import PostgresChatMessageHistory
from core.config import settings
from dotenv import load_dotenv
import os
load_dotenv()



def get_chat_history(session_id):

    history = PostgresChatMessageHistory(
        connection_string=os.getenv("DB_URL"),
        session_id=session_id,
        table_name="chathistory"
    )
    
    return history

