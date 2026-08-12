file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Dashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace fetchDashboardData block to filter by branch
old_fetch = """  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [bookingsRes, waitlistRes, alertsRes, staffRes, feedbackRes, tablesRes] = await Promise.all([
          client.get('/reservation/bookings/'),
          client.get('/reservation/waitlist/?status=waiting'),
          client.get('/inventory/reorder_alerts/'),
          client.get('/workforce/employees/'),
          client.get('/feedback/reviews/analytics/'),
          client.get('/reservation/tables/')
        ]);"""

new_fetch = """  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const activeBranchId = localStorage.getItem('branch_id') || user?.branch || '';
        const [bookingsRes, waitlistRes, alertsRes, staffRes, feedbackRes, tablesRes] = await Promise.all([
          client.get('/reservation/bookings/', { params: { branch: activeBranchId } }),
          client.get('/reservation/waitlist/?status=waiting', { params: { branch: activeBranchId } }),
          client.get('/inventory/reorder_alerts/', { params: { branch: activeBranchId } }),
          client.get('/workforce/employees/', { params: { branch: activeBranchId } }),
          client.get('/feedback/reviews/analytics/', { params: { branch_id: activeBranchId } }),
          client.get('/reservation/tables/', { params: { branch: activeBranchId } })
        ]);"""

code = code.replace(old_fetch, new_fetch)

# Add branchUpdate listener inside useEffect
old_trigger = """    fetchDashboardData();
  }, [user?.branch]);"""

new_trigger = """    fetchDashboardData();
    window.addEventListener('branchUpdate', fetchDashboardData);
    return () => {
      window.removeEventListener('branchUpdate', fetchDashboardData);
    };
  }, [user?.branch]);"""

code = code.replace(old_trigger, new_trigger)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Dashboard.jsx updated successfully with dynamic branch filtering and listeners.")
