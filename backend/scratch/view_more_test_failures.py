with open("C:/Users/adhit/.gemini/antigravity/brain/113647d0-0a12-46f0-ac5e-5609846ed5f9/.system_generated/tasks/task-8859.log", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
# Find test_booking_creation_and_actions
for i, line in enumerate(lines):
    if "test_booking_creation_and_actions" in line:
        print("\n".join(lines[i-2:i+40]))
    if "test_waitlist_joining_and_promotion" in line:
        print("\n".join(lines[i-2:i+40]))
