file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Settings.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update imports
old_imports = """import { 
  Settings as SettingsIcon, 
  Sparkles, 
  MapPin, 
  Bell, 
  Globe, 
  Save, 
  CheckCircle,
  RefreshCw,
  Lock,
  Database,
  Palette,
  Eye,
  EyeOff,
  Cpu
} from 'lucide-react';"""

new_imports = """import { 
  Settings as SettingsIcon, 
  Sparkles, 
  MapPin, 
  Bell, 
  Globe, 
  Save, 
  CheckCircle,
  RefreshCw,
  Lock,
  Database,
  Palette,
  Eye,
  EyeOff,
  Cpu,
  Plus,
  Trash2,
  Edit,
  Check
} from 'lucide-react';
import Modal from '../components/Modal';"""

code = code.replace(old_imports, new_imports)

# 2. Add Branch management state and actions inside Settings component
old_states_and_effects = """  // Load current branch metadata from API
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
  }, [user?.branch]);"""

new_states_and_effects = """  const [branches, setBranches] = useState([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null); // null means adding new
  const [manageBranchForm, setManageBranchForm] = useState({
    name: '',
    branch_code: '',
    latitude: '',
    longitude: '',
    geofence_radius: '100',
    address: '',
    is_active: true
  });

  const loadBranches = async () => {
    try {
      const res = await client.get('/branches/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setBranches(list);
    } catch (err) {
      console.error('Failed to load branch list:', err);
    }
  };

  // Load current branch metadata from API and branches list
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
  }, [user?.branch]);

  const handleCreateOrEditBranch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: manageBranchForm.name,
        branch_code: manageBranchForm.branch_code,
        latitude: manageBranchForm.latitude ? parseFloat(manageBranchForm.latitude) : null,
        longitude: manageBranchForm.longitude ? parseFloat(manageBranchForm.longitude) : null,
        geofence_radius: parseInt(manageBranchForm.geofence_radius) || 100,
        address: manageBranchForm.address,
        is_active: manageBranchForm.is_active
      };

      if (editingBranch) {
        await client.patch(`/branches/${editingBranch.id}/`, payload);
        addToast('Branch details updated successfully.', 'success');
      } else {
        await client.post('/branches/', payload);
        addToast('New branch registered successfully.', 'success');
      }
      setBranchModalOpen(false);
      setEditingBranch(null);
      loadBranches();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save branch details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultBranch = async (branchObj) => {
    setLoading(true);
    try {
      await client.patch(`/branches/${branchObj.id}/`, { is_default: true });
      addToast(`${branchObj.name} is now the default enterprise branch.`, 'success');
      loadBranches();
      localStorage.setItem('branch_id', branchObj.id);
      localStorage.setItem('branch_name', branchObj.name);
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      addToast('Failed to set default branch.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch? All associated tables will be removed.')) return;
    setLoading(true);
    try {
      await client.delete(`/branches/${branchId}/`);
      addToast('Branch removed from directory.', 'info');
      loadBranches();
      window.dispatchEvent(new Event('branchUpdate'));
    } catch (err) {
      addToast('Failed to delete branch.', 'error');
    } finally {
      setLoading(false);
    }
  };"""

code = code.replace(old_states_and_effects, new_states_and_effects)

# 3. Add Branch directory UI card on the left column (or below the geofence form)
old_left_column = """      {/* Grid forms settings layout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-app-24">
        
        {/* Branch Geofencing settings */}
        <AppCard className="space-y-5">"""

new_left_column = """      {/* Grid forms settings layout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-app-24">
        
        <div className="space-y-app-24">
          {/* Branch Directory / Management Card */}
          <AppCard className="space-y-5">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-app-md bg-app-primary/10 text-app-primary flex items-center justify-center border border-app-primary/15">
                  <Globe size={16} />
                </span>
                <div>
                  <h2 className="text-text-primary text-xs font-bold uppercase tracking-wider">Enterprise Branch Directory</h2>
                  <p className="text-[10px] text-text-muted font-semibold mt-0.5">Manage physical locations and default settings</p>
                </div>
              </div>
              
              <PrimaryButton 
                onClick={() => {
                  setEditingBranch(null);
                  setManageBranchForm({
                    name: '',
                    branch_code: '',
                    latitude: '',
                    longitude: '',
                    geofence_radius: '100',
                    address: '',
                    is_active: true
                  });
                  setBranchModalOpen(true);
                }}
                icon={Plus}
                className="h-8 text-[10px] font-bold px-3"
              >
                Add Branch
              </PrimaryButton>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {branches.map(b => (
                <div key={b.id} className="bg-app-bg border border-app-border rounded-app-xl p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-text-primary">{b.name}</h4>
                      {b.is_default && <Badge status="success">DEFAULT</Badge>}
                      {!b.is_active && <Badge status="default">INACTIVE</Badge>}
                    </div>
                    <p className="text-[10px] text-text-muted">Code: {b.branch_code} | Radius: {b.geofence_radius}m</p>
                    <p className="text-[9px] text-text-muted">{b.address}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!b.is_default && (
                      <SecondaryButton 
                        onClick={() => handleSetDefaultBranch(b)}
                        className="px-2 py-1 text-[9px] h-7 font-bold"
                      >
                        Set Default
                      </SecondaryButton>
                    )}
                    <button
                      onClick={() => {
                        setEditingBranch(b);
                        setManageBranchForm({
                          name: b.name || '',
                          branch_code: b.branch_code || '',
                          latitude: b.latitude || '',
                          longitude: b.longitude || '',
                          geofence_radius: String(b.geofence_radius || 100),
                          address: b.address || '',
                          is_active: !!b.is_active
                        });
                        setBranchModalOpen(true);
                      }}
                      className="text-text-muted hover:text-app-primary transition-colors p-1"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(b.id)}
                      className="text-text-muted hover:text-app-danger transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AppCard>

          {/* Branch Geofencing settings */}
          <AppCard className="space-y-5">"""

code = code.replace(old_left_column, new_left_column)

# 4. Close the left column div wrapper in layout
old_left_column_end = """            <div className="flex justify-end pt-2">
              <PrimaryButton type="submit" icon={Save} className="shadow-app-md">
                Save Coordinates
              </PrimaryButton>
            </div>
          </form>
        </AppCard>"""

new_left_column_end = """            <div className="flex justify-end pt-2">
              <PrimaryButton type="submit" icon={Save} className="shadow-app-md">
                Save Coordinates
              </PrimaryButton>
            </div>
          </form>
        </AppCard>
        </div>"""

code = code.replace(old_left_column_end, new_left_column_end)

# 5. Inject Branch management Modal at the bottom of JSX
old_jsx_end = """        </div>

      </motion.div>
    </motion.div>
  );
};"""

new_jsx_end = """        </div>

      </motion.div>

      {/* BRANCH ADD/EDIT MODAL */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title={editingBranch ? 'Edit Physical Branch details' : 'Register New Branch Location'}
      >
        <form onSubmit={handleCreateOrEditBranch} className="space-y-4">
          <Input
            label="Branch Name"
            value={manageBranchForm.name}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, name: e.target.value })}
            placeholder="e.g. Indiranagar branch"
            required
          />
          <Input
            label="Branch Code Slug (Unique)"
            value={manageBranchForm.branch_code}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, branch_code: e.target.value })}
            placeholder="e.g. indiranagar-branch"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              value={manageBranchForm.latitude}
              onChange={(e) => setManageBranchForm({ ...manageBranchForm, latitude: e.target.value })}
              placeholder="e.g. 12.9715"
            />
            <Input
              label="Longitude"
              value={manageBranchForm.longitude}
              onChange={(e) => setManageBranchForm({ ...manageBranchForm, longitude: e.target.value })}
              placeholder="e.g. 77.5945"
            />
          </div>
          <Input
            label="Geofence Radius (meters)"
            type="number"
            value={manageBranchForm.geofence_radius}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, geofence_radius: e.target.value })}
            required
          />
          <Textarea
            label="Physical Address Location"
            value={manageBranchForm.address}
            onChange={(e) => setManageBranchForm({ ...manageBranchForm, address: e.target.value })}
            placeholder="Complete address line..."
            rows={2}
          />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_branch"
              checked={manageBranchForm.is_active}
              onChange={(e) => setManageBranchForm({ ...manageBranchForm, is_active: e.target.checked })}
              className="rounded border-app-border text-app-primary bg-app-bg focus:ring-0 w-4 h-4"
            />
            <label htmlFor="is_active_branch" className="text-xs font-bold text-text-primary select-none">
              Mark Branch Active for Bookings
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <SecondaryButton onClick={() => setBranchModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" className="shadow-app-md">
              Save Branch
            </PrimaryButton>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
};"""

code = code.replace(old_jsx_end, new_jsx_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Settings.jsx updated successfully.")
