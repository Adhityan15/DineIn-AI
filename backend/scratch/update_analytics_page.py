file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Analytics.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace branchId declaration
old_branchId = "const branchId = user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5';"
new_branchId = "const branchId = localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5';"

code = code.replace(old_branchId, new_branchId)

# Replace fetchAnalyticsData block to pass branchId params
old_fetch = """      const [invRes, workRes, feedRes, bookRes, statsRes] = await Promise.all([
        client.get('/inventory/analytics/'),
        client.get('/workforce/analytics/'),
        client.get(`/feedback/reviews/analytics/?branch_id=${branchId}`),
        client.get('/reservation/bookings/'),
        client.get('/workforce/attendance/today-stats/')
      ]);"""

new_fetch = """      const [invRes, workRes, feedRes, bookRes, statsRes] = await Promise.all([
        client.get(`/inventory/analytics/?branch=${branchId}`),
        client.get(`/workforce/analytics/?branch=${branchId}`),
        client.get(`/feedback/reviews/analytics/?branch_id=${branchId}`),
        client.get(`/reservation/bookings/?branch=${branchId}`),
        client.get(`/workforce/attendance/today-stats/?branch=${branchId}`)
      ]);"""

code = code.replace(old_fetch, new_fetch)

# Add branchUpdate listener inside useEffect
old_effect = """  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);"""

new_effect = """  useEffect(() => {
    fetchAnalyticsData();
    window.addEventListener('branchUpdate', fetchAnalyticsData);
    return () => {
      window.removeEventListener('branchUpdate', fetchAnalyticsData);
    };
  }, [fetchAnalyticsData]);"""

code = code.replace(old_effect, new_effect)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Analytics.jsx updated successfully with dynamic branch filtering and listeners.")
