file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\layouts\DashboardLayout.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update state declarations
old_state_declarations = """  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [branchName, setBranchName] = useState(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');
  const [branchesList, setBranchesList] = useState([]);"""

new_state_declarations = """  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [branchName, setBranchName] = useState(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');
  const [selectedBranchId, setSelectedBranchId] = useState(localStorage.getItem('branch_id') || '');
  const [branchesList, setBranchesList] = useState([]);"""

code = code.replace(old_state_declarations, new_state_declarations)

# 2. Update fetchBranches block
old_fetch_block = """        const storedBranchId = localStorage.getItem('branch_id');
        if (!storedBranchId && list.length > 0) {
          const defaultBranch = list.find(b => b.is_default) || list[0];
          localStorage.setItem('branch_id', defaultBranch.id);
          localStorage.setItem('branch_name', defaultBranch.name);
          setBranchName(defaultBranch.name);
          window.dispatchEvent(new Event('branchUpdate'));
        }"""

new_fetch_block = """        const storedBranchId = localStorage.getItem('branch_id');
        if (storedBranchId) {
          setSelectedBranchId(storedBranchId);
        } else if (list.length > 0) {
          const defaultBranch = list.find(b => b.is_default) || list[0];
          localStorage.setItem('branch_id', defaultBranch.id);
          localStorage.setItem('branch_name', defaultBranch.name);
          setBranchName(defaultBranch.name);
          setSelectedBranchId(defaultBranch.id);
          window.dispatchEvent(new Event('branchUpdate'));
        }"""

code = code.replace(old_fetch_block, new_fetch_block)

# 3. Update handleUpdate block
old_handle_update = """  useEffect(() => {
    const handleUpdate = () => {
      setBranchName(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');
    };"""

new_handle_update = """  useEffect(() => {
    const handleUpdate = () => {
      setBranchName(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');
      setSelectedBranchId(localStorage.getItem('branch_id') || '');
    };"""

code = code.replace(old_handle_update, new_handle_update)

# 4. Update the select render
old_select_render = """              <select
                value={localStorage.getItem('branch_id') || ''}
                onChange={(e) => {
                  const bId = e.target.value;
                  const bObj = branchesList.find(b => b.id === bId);
                  if (bObj) {
                    localStorage.setItem('branch_id', bObj.id);
                    localStorage.setItem('branch_name', bObj.name);
                    setBranchName(bObj.name);
                    window.dispatchEvent(new Event('branchUpdate'));
                    addToast(`Switched active branch to ${bObj.name}`, 'info');
                  }
                }}"""

new_select_render = """              <select
                value={selectedBranchId}
                onChange={(e) => {
                  const bId = e.target.value;
                  const bObj = branchesList.find(b => b.id === bId);
                  if (bObj) {
                    localStorage.setItem('branch_id', bObj.id);
                    localStorage.setItem('branch_name', bObj.name);
                    setBranchName(bObj.name);
                    setSelectedBranchId(bObj.id);
                    window.dispatchEvent(new Event('branchUpdate'));
                    addToast(`Switched active branch to ${bObj.name}`, 'info');
                  }
                }}"""

code = code.replace(old_select_render, new_select_render)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("DashboardLayout.jsx updated successfully.")
