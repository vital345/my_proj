import requests

# Replace with your ElevenLabs API key
API_KEY = "sk_d579b1ad8ed8d26ec17178fcde498f5b4d4d8f61839ec200"

# Define the ElevenLabs API endpoint
BASE_URL = "https://api.elevenlabs.io/v1"

# Define the text you want to convert to speech
TEXT_TO_SPEECH = "Hello! This is an example of human-like text-to-speech conversion using ElevenLabs."

# Select the voice you want to use (use an existing ElevenLabs voice ID)
VOICE_ID = "pqHfZKP75CvOlQylNhV4"  # Replace with your desired voice ID

# Set up the headers and payload
headers = {
    "Content-Type": "application/json",
    "xi-api-key": API_KEY
}

payload = {
    "text": TEXT_TO_SPEECH,
    "model_id": "eleven_monolingual_v1",  # Default TTS model
    "voice_settings": {
        "stability": 0.75,  # Adjust to control voice stability (0.0 - 1.0)
        "similarity_boost": 0.75  # Adjust for voice similarity (0.0 - 1.0)
    }
}

# Make the API call to generate speech
response = requests.post(
    f"{BASE_URL}/text-to-speech/{VOICE_ID}",
    headers=headers,
    json=payload
)

# Check if the request was successful
if response.status_code == 200:
    # Save the generated audio to a file
    with open("output_audio.mp3", "wb") as audio_file:
        audio_file.write(response.content)
    print("Audio has been saved as 'output_audio.mp3'")
else:
    # Print an error message if something went wrong
    print(f"Error: {response.status_code} - {response.text}")
