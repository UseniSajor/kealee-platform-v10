"""
LoRA fine-tune of Qwen on Kealee's approved generations.

    pip install -r training/qwen/requirements.txt
    python training/qwen/train_lora.py \
        --data training/qwen/data --out training/qwen/adapters/kealee-v1

Reads train.jsonl / eval.jsonl written by export-sft.ts (chat "messages"
format). Trains a LoRA adapter — the base model is untouched, so an adapter
that fails the evaluation gate (eval.ts) is simply not served.

Defaults fit one 24–48 GB GPU (L4 / A10 / L40S / A100) with 4-bit loading;
drop --load-4bit on an 80 GB card.
"""
import argparse
import json
import os

import torch
from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from trl import SFTConfig, SFTTrainer


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--base", default=os.environ.get("KEALEE_QWEN_BASE", "Qwen/Qwen3-8B"))
    p.add_argument("--data", default="training/qwen/data")
    p.add_argument("--out", default="training/qwen/adapters/kealee-v1")
    p.add_argument("--epochs", type=float, default=2)
    p.add_argument("--lr", type=float, default=1e-4)
    p.add_argument("--rank", type=int, default=16)
    p.add_argument("--max-len", type=int, default=4096)
    p.add_argument("--batch", type=int, default=1)
    p.add_argument("--grad-accum", type=int, default=16)
    p.add_argument("--load-4bit", action="store_true", default=True)
    p.add_argument("--no-load-4bit", dest="load_4bit", action="store_false")
    a = p.parse_args()

    files = {"train": os.path.join(a.data, "train.jsonl")}
    if os.path.getsize(os.path.join(a.data, "eval.jsonl")) > 0:
        files["eval"] = os.path.join(a.data, "eval.jsonl")
    ds = load_dataset("json", data_files=files)
    ds = ds.remove_columns([c for c in ds["train"].column_names if c != "messages"])
    if len(ds["train"]) < 50:
        raise SystemExit(f"Only {len(ds['train'])} approved examples — approve more generations before training.")

    tok = AutoTokenizer.from_pretrained(a.base)
    quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                               bnb_4bit_compute_dtype=torch.bfloat16) if a.load_4bit else None
    model = AutoModelForCausalLM.from_pretrained(a.base, torch_dtype=torch.bfloat16,
                                                 quantization_config=quant, device_map="auto")

    lora = LoraConfig(r=a.rank, lora_alpha=a.rank * 2, lora_dropout=0.05,
                      target_modules="all-linear", task_type="CAUSAL_LM")
    cfg = SFTConfig(
        output_dir=a.out, num_train_epochs=a.epochs, learning_rate=a.lr,
        per_device_train_batch_size=a.batch, gradient_accumulation_steps=a.grad_accum,
        max_length=a.max_len, bf16=True, logging_steps=10, save_strategy="epoch",
        eval_strategy="epoch" if "eval" in ds else "no", lr_scheduler_type="cosine", warmup_ratio=0.03,
        assistant_only_loss=True,   # learn the answers, not the prompts
        report_to="none",
    )
    trainer = SFTTrainer(model=model, args=cfg, train_dataset=ds["train"],
                         eval_dataset=ds.get("eval"), peft_config=lora, processing_class=tok)
    trainer.train()
    trainer.save_model(a.out)
    tok.save_pretrained(a.out)
    with open(os.path.join(a.out, "kealee-adapter.json"), "w") as f:
        json.dump({"base": a.base, "data": a.data, "examples": len(ds["train"]),
                   "epochs": a.epochs, "lr": a.lr, "rank": a.rank}, f, indent=2)
    print(f"Adapter written to {a.out}. Next: serve it and run training/qwen/eval.ts before promoting it.")


if __name__ == "__main__":
    main()
