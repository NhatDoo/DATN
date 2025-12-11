from Retrieval.retriever import HighSpeedRetriever
from Augmented.augmentor import Augmentor
from Generation.generator import Generator

class RAGPipeline:
    def __init__(self):
        self.retriever = HighSpeedRetriever()
        self.augmentor = Augmentor()
        self.generator = Generator()

    async def run(self, query: str):
        retrieved = await self.retriever.retrieve(query)
        prompt = await self.augmentor.build_prompt(query, retrieved)
        answer = await self.generator.generate(prompt)
        return {
            "query": query,
            "answer": answer,
            "context": retrieved
        }
