file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Dashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Inject activeBranchName state and listener
old_state_block = """  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeInsight, setActiveInsight] = useState(0);"""

new_state_block = """  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeInsight, setActiveInsight] = useState(0);
  const [activeBranchName, setActiveBranchName] = useState(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');

  useEffect(() => {
    const handleBranchChange = () => {
      setActiveBranchName(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');
    };
    window.addEventListener('branchUpdate', handleBranchChange);
    return () => {
      window.removeEventListener('branchUpdate', handleBranchChange);
    };
  }, [user?.branch_name]);"""

code = code.replace(old_state_block, new_state_block)

# 2. Update Branch badge rendering
old_badge_render = """            <Badge status="info">
              Branch: {user?.branch_name || 'Bangalore Main'}
            </Badge>"""

new_badge_render = """            <Badge status="info">
              Branch: {activeBranchName}
            </Badge>"""

code = code.replace(old_badge_render, new_badge_render)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Dashboard.jsx updated successfully.")
