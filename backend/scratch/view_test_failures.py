with open("C:/Users/adhit/.gemini/antigravity/brain/113647d0-0a12-46f0-ac5e-5609846ed5f9/.system_generated/tasks/task-8859.log", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find FAILED blocks
lines = content.split("\n")
failed_indexes = [i for i, line in enumerate(lines) if "FAILURES" in line or "FAILED" in line]
for idx in failed_indexes:
    start = max(0, idx - 5)
    end = min(len(lines), idx + 80)
    print(f"\n--- Context around index {idx} ---")
    print("\n".join(lines[start:end]))
