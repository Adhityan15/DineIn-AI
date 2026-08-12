with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/components/DesignSystem.jsx", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "export const Badge" in line or "Badge = " in line:
        print(f"Line {i+1}: {line.strip()}")
        # print the next 20 lines
        for j in range(1, 21):
            if i+j < len(lines):
                print(f"  Line {i+j+1}: {lines[i+j].strip()}")
