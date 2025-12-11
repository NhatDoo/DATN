import re
import asyncio
from typing import List, Dict

class Augmentor:
    def __init__(self, similarity_threshold: float = 0.1, max_context_chars: int = 6000):
        self.similarity_threshold = similarity_threshold
        self.max_context_chars = max_context_chars

    def _clean_text(self, text: str) -> str:
        """Làm sạch text (HTML, xuống dòng, khoảng trắng, ký tự lạ)."""
        text = re.sub(r"<[^>]+>", " ", text or "")
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _is_duplicate(self, text: str, seen_texts: set) -> bool:
        for t in seen_texts:
            if text.lower() in t.lower() or t.lower() in text.lower():
                return True
        return False

    async def prepare_context(self, retrieved_items: List[Dict]) -> str:
        """Lọc, làm sạch, rút gọn, và ghép context (bao gồm lesson info)."""
        clean_contexts = []
        seen_texts = set()

        for item in retrieved_items:
            score = item.get("score", 0)
            meta = item.get("meta", {})
            if score < self.similarity_threshold:
                continue

            # === Lấy thông tin khóa học chính ===
            title = str(meta.get("title", ""))
            short_desc = str(meta.get("short_description", ""))
            desc = str(meta.get("description", ""))
            enrollment = meta.get("enrollment_count", 0)
            price = meta.get("price_bigint", "")
            currency = meta.get("currency", "")
            
            # === Tính toán lesson info ===
            lessons = meta.get("lessons", [])
            total_duration = sum(l.get("duration_seconds", 0) for l in lessons)
            num_lessons = len(lessons)

            # (Nếu bạn có rating trong reviews hoặc metadata)
            reviews = meta.get("reviews", [])
            avg_rating = None
            if reviews:
                ratings = [r.get("rating") for r in reviews if r.get("rating") is not None]
                if ratings:
                    avg_rating = round(sum(ratings) / len(ratings), 1)

            # === Ghép text mô tả ===
            text_parts = [
                f"Khóa học: {title}",
                f"Mô tả: {short_desc or desc}",
                f"Số học viên: {enrollment}",
                f"Bài học: {num_lessons} bài ({total_duration} giây tổng cộng)",
            ]
            if price:
                text_parts.append(f"Giá: {price} {currency}")
            if avg_rating is not None:
                text_parts.append(f"Đánh giá trung bình: {avg_rating} ⭐")

            text = " | ".join(text_parts)
            text = self._clean_text(text)

            if not text or self._is_duplicate(text, seen_texts):
                continue

            clean_contexts.append(f"- {text}")
            seen_texts.add(text)

            # Giới hạn độ dài context để tránh prompt quá dài
            if sum(len(c) for c in clean_contexts) > self.max_context_chars:
                break

        return "\n".join(clean_contexts)

    async def build_prompt(self, query: str, retrieved_items: List[Dict]) -> str:
        """Ghép context + câu hỏi thành prompt hoàn chỉnh."""
        context_block = await self.prepare_context(retrieved_items)
        prompt = (
            "Bạn là trợ lý của một phần mềm đăng ký khóa học. "
            "Hãy trả lời câu hỏi dựa trên thông tin sau:\n\n"
            f"{context_block}\n\n"
            f"Câu hỏi: {query}\n"
            "Trả lời ngắn gọn và dễ hiểu bằng tiếng Việt."
            
        )
        return prompt
