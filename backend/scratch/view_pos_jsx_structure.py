with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r", encoding="utf-8") as f:
    content = f.read()

print("File size:", len(content), "bytes")
lines = content.split('\n')
print("Total lines:", len(lines))

# Print first 100 lines and some key search blocks
for idx, line in enumerate(lines[:100]):
    print(f"{idx+1}: {line}")
