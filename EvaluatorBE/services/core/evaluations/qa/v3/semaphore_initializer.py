import asyncio
import os

from dotenv import load_dotenv

from services.core.evaluations.take_evaluation import take_evaluation

load_dotenv()

SEMAPHORE_LIMIT = int(os.environ.get("SEMAPHORE_LIMIT", 5))
print("Current Semaphore limit:", SEMAPHORE_LIMIT)
semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)



