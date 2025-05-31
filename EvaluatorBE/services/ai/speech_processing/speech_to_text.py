from openai import OpenAI
from fastapi import UploadFile
import tempfile
from shutil import copyfileobj
import os

client = OpenAI()

def convert_speech_to_text(file:UploadFile)->str:
    temporary_file =  tempfile.NamedTemporaryFile(dir="./.tmp",delete=False,suffix=".mp3")
    audio_file= file.file
    copyfileobj(audio_file,temporary_file)
    temporary_file.close()
    
    temporary_file_reader = open(temporary_file.name,'rb')

    
    transcription = client.audio.transcriptions.create(
        model="whisper-1", 
        file=temporary_file_reader,
        language='en'
    )
    
    temporary_file_reader.close()
    
    os.remove(temporary_file.name)
    

    
    
    return transcription.text