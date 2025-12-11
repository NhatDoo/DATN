from Retrieval.retriever import HighSpeedRetriever
from Augmented.augmentor import Augmentor
import asyncio

async def main():
    retriever = HighSpeedRetriever()

    query = "tft"
    retrieved = await retriever.retrieve(query)
   
    print(retrieved)

asyncio.run(main())