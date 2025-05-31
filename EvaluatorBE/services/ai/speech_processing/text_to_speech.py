from openai import OpenAI
import tempfile
client = OpenAI()   
def convert_text_to_speech(text:str):
     
    temporary_file =  tempfile.NamedTemporaryFile(dir="./.tmp",delete=False)
    response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=text
    )
    response.write_to_file(temporary_file.name)
    return temporary_file
