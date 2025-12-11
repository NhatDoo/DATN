from sentence_transformers import SentenceTransformer
import torch

model_name = "sentence-transformers/all-MiniLM-L6-v2"
output_path = "model.onnx"

# 🧠 Load model về CPU (rất quan trọng!)
model = SentenceTransformer(model_name, device="cpu")
model.eval()

# Tạo input giả
example_texts = ["This is a dummy sentence."]
inputs = model.tokenizer(
    example_texts,
    padding=True,
    truncation=True,
    return_tensors="pt"
)

# Đảm bảo tất cả tensors đều ở CPU
inputs = {k: v.to("cpu") for k, v in inputs.items()}

# ✅ Export sang ONNX
torch.onnx.export(
    model._first_module().auto_model,  # lấy encoder bên trong SentenceTransformer
    (inputs["input_ids"], inputs["attention_mask"]),
    output_path,
    input_names=["input_ids", "attention_mask"],
    output_names=["last_hidden_state", "pooler_output"],
    dynamic_axes={
        "input_ids": {0: "batch", 1: "sequence"},
        "attention_mask": {0: "batch", 1: "sequence"}
    },
    opset_version=14
)

print("✅ Model exported successfully →", output_path)
