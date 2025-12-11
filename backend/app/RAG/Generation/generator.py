import asyncio
import ollama

class Generator:
    def __init__(self, model_name="llama3.2"):
        self.model_name = model_name
        print(f"⚙️ Generator using model: {self.model_name}")

    async def generate(self, prompt: str) -> str:
        """Gọi mô hình Ollama để sinh câu trả lời."""
        response = await asyncio.to_thread(
            lambda: ollama.chat(model=self.model_name, messages=[
                {"role": "user", "content": prompt}
            ])
        )
        return response["message"]["content"]

    async def stream_generate(self, prompt: str):
        """(Tuỳ chọn) Trả kết quả dạng stream."""
        for chunk in ollama.chat(model=self.model_name, messages=[{"role": "user", "content": prompt}], stream=True):
            yield chunk["message"]["content"]
