file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reports.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace branchId declaration
old_branchId = "const branchId = user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5';"
new_branchId = "const branchId = localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5';"

code = code.replace(old_branchId, new_branchId)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Reports.jsx updated successfully.")
