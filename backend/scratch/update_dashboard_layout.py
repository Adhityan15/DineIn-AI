file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\layouts\DashboardLayout.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Import client
old_imports = "import { useToast } from '../contexts/ToastContext';"
new_imports = """import { useToast } from '../contexts/ToastContext';
import client from '../api/client';"""

code = code.replace(old_imports, new_imports)

# 2. Add branches list states and fetcher in DashboardLayout component
old_state = "  const [branchName, setBranchName] = useState(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');"
new_state = """  const [branchName, setBranchName] = useState(localStorage.getItem('branch_name') || user?.branch_name || 'Bangalore Main Branch');
  const [branchesList, setBranchesList] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await client.get('/branches/');
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setBranchesList(list);
        
        const storedBranchId = localStorage.getItem('branch_id');
        if (!storedBranchId && list.length > 0) {
          const defaultBranch = list.find(b => b.is_default) || list[0];
          localStorage.setItem('branch_id', defaultBranch.id);
          localStorage.setItem('branch_name', defaultBranch.name);
          setBranchName(defaultBranch.name);
          window.dispatchEvent(new Event('branchUpdate'));
        }
      } catch (err) {
        console.error('Failed to load branches for selector:', err);
      }
    };
    fetchBranches();
  }, []);"""

code = code.replace(old_state, new_state)

# 3. Replace static branch badge with select dropdown
old_badge = """            {/* Branch Badge */}
            <div className="bg-app-elevated text-text-secondary hidden lg:flex items-center gap-1.5 px-3 py-1 border border-app-border rounded-full text-xs font-bold">
              <MapPin size={12} className="text-text-muted" />
              <span>{branchName}</span>
            </div>"""

new_badge = """            {/* Branch Switcher Select Dropdown */}
            <div className="bg-app-elevated text-text-secondary hidden lg:flex items-center gap-1.5 px-3.5 py-1 border border-app-border rounded-full text-xs font-bold relative">
              <MapPin size={12} className="text-app-primary animate-pulse" />
              <select
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
                }}
                className="bg-transparent border-none text-text-primary outline-none cursor-pointer pr-5 font-bold text-[11px] appearance-none"
                style={{ background: 'none', border: 'none', outline: 'none' }}
              >
                {branchesList.map(b => (
                  <option key={b.id} value={b.id} className="bg-app-surface text-text-primary">
                    {b.name} {b.is_default ? '⭐' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-2 text-text-muted pointer-events-none" />
            </div>"""

code = code.replace(old_badge, new_badge)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("DashboardLayout.jsx updated successfully.")
