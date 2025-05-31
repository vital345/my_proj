import asyncio
from typing import Dict, List
from collections import defaultdict

response_queues: Dict[int, asyncio.Queue] = defaultdict(asyncio.Queue)
already_asked_questions: Dict[int, list] = defaultdict(list)
