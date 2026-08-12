file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Settings.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace loadBranch useEffect block
old_load_block = """  // Load current branch metadata from API and branches list
  useEffect(() => {
    const loadBranch = async () => {
      if (!user?.branch) return;
      setLoading(true);
      try {
        const res = await client.get(`/branches/${user.branch}/`);
        setBranchForm({
          name: res.data.name || '',
          address: res.data.address || '',
          latitude: res.data.latitude || '',
          longitude: res.data.longitude || '',
          geofence_radius: String(res.data.geofence_radius || 100)
        });
      } catch (err) {
        console.error('Failed to load branch details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBranch();
    loadBranches();
  }, [user?.branch]);"""

new_load_block = """  // Load current branch metadata from API and branches list
  useEffect(() => {
    const loadBranch = async () => {
      const activeBranchId = localStorage.getItem('branch_id') || user?.branch;
      if (!activeBranchId) return;
      setLoading(true);
      try {
        const res = await client.get(`/branches/${activeBranchId}/`);
        setBranchForm({
          name: res.data.name || '',
          address: res.data.address || '',
          latitude: res.data.latitude || '',
          longitude: res.data.longitude || '',
          geofence_radius: String(res.data.geofence_radius || 100)
        });
      } catch (err) {
        console.error('Failed to load branch details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBranch();
    loadBranches();

    window.addEventListener('branchUpdate', loadBranch);
    return () => window.removeEventListener('branchUpdate', loadBranch);
  }, [user?.branch]);"""

code = code.replace(old_load_block, new_load_block)

# 2. Replace handleBranchSave function block
old_save_block = """  const handleBranchSave = async (e) => {
    e.preventDefault();
    if (!user?.branch) return;
    setLoading(true);
    try {
      const payload = {
        name: branchForm.name,
        address: branchForm.address,
        latitude: branchForm.latitude || null,
        longitude: branchForm.longitude || null,
        geofence_radius: parseInt(branchForm.geofence_radius) || 100
      };
      const res = await client.patch(`/branches/${user.branch}/`, payload);
      localStorage.setItem('branch_name', res.data.name);
      window.dispatchEvent(new Event('branchUpdate'));
      addToast('Branch coordinates and boundary limits updated.', 'success');
    } catch (err) {
      addToast('Failed to save branch parameters.', 'error');
    } finally {
      setLoading(false);
    }
  };"""

new_save_block = """  const handleBranchSave = async (e) => {
    e.preventDefault();
    const activeBranchId = localStorage.getItem('branch_id') || user?.branch;
    if (!activeBranchId) return;
    setLoading(true);
    try {
      const payload = {
        name: branchForm.name,
        address: branchForm.address,
        latitude: branchForm.latitude ? parseFloat(branchForm.latitude) : null,
        longitude: branchForm.longitude ? parseFloat(branchForm.longitude) : null,
        geofence_radius: parseInt(branchForm.geofence_radius) || 100
      };
      const res = await client.patch(`/branches/${activeBranchId}/`, payload);
      localStorage.setItem('branch_name', res.data.name);
      window.dispatchEvent(new Event('branchUpdate'));
      addToast('Branch coordinates and boundary limits updated.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save branch parameters.', 'error');
    } finally {
      setLoading(false);
    }
  };"""

code = code.replace(old_save_block, new_save_block)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Settings.jsx updated successfully.")
