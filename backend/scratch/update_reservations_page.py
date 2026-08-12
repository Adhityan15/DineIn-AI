import os

file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add handleStartDining and handleRequestCheckout and handleArchive
old_checkout = """  // Check-out / Completed
  const handleCheckOut = async (bookingId) => {"""

new_handlers = """  const handleStartDining = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/start-dining/`);
      if (res.data?.success) {
        addToast('Dining session started successfully!', 'success');
        fetchData();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to start dining.', 'error');
    }
  };

  const handleRequestCheckout = async (bookingId) => {
    try {
      const res = await client.post(`/reservation/bookings/${bookingId}/request-checkout/`);
      if (res.data?.success) {
        addToast('Checkout request registered.', 'info');
        fetchData();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.data);
          fetchBookingHistory(bookingId);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to request checkout.', 'error');
    }
  };

  const handleArchive = async (bookingId) => {
    addToast('Reservation archived from active view.', 'success');
    fetchData();
    setDrawerOpen(false);
  };

  // Check-out / Completed
  const handleCheckOut = async (bookingId) => {"""

code = code.replace(old_checkout, new_handlers)


# 2. Update getStatusBadge
old_badge = """  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'reminder_sent': return 'info';
      case 'checked_in': return 'info';
      case 'seated': return 'danger';
      case 'completed': return 'success';
      case 'cancelled': return 'default';
      case 'rejected': return 'default';
      case 'no_show': return 'danger';
      default: return 'default';
    }
  };"""

new_badge = """  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'reminder_sent': return 'info';
      case 'checked_in': return 'info';
      case 'arrived': return 'warning';
      case 'seated': return 'info';
      case 'dining': return 'danger';
      case 'checkout_requested': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'default';
      case 'rejected': return 'default';
      case 'no_show': return 'danger';
      default: return 'default';
    }
  };"""

code = code.replace(old_badge, new_badge)


# 3. Update getTableColor to include cleaning status
old_table_color = """  const getTableColor = (statusVal) => {
    switch (statusVal) {
      case 'available': return 'var(--color-success)';
      case 'reserved': return 'var(--color-warning)';
      case 'occupied': return 'var(--color-danger)';
      default: return 'var(--color-text-muted)';
    }
  };"""

new_table_color = """  const getTableColor = (statusVal) => {
    switch (statusVal) {
      case 'available': return 'var(--color-success)';
      case 'reserved': return 'var(--color-warning)';
      case 'occupied': return 'var(--color-danger)';
      case 'cleaning': return 'var(--color-primary)';
      default: return 'var(--color-text-muted)';
    }
  };"""

code = code.replace(old_table_color, new_table_color)


# 4. Update branch query parameters for fetchData and create payloads
code = code.replace("client.get('/reservation/tables/')", "client.get('/reservation/tables/', { params: { branch: localStorage.getItem('branch_id') || user?.branch || '' } })")
code = code.replace("client.get('/reservation/bookings/', { params: { start_date: selectedDate } })", "client.get('/reservation/bookings/', { params: { start_date: selectedDate, branch: localStorage.getItem('branch_id') || user?.branch || '' } })")
code = code.replace("client.get('/reservation/waitlist/')", "client.get('/reservation/waitlist/', { params: { branch: localStorage.getItem('branch_id') || user?.branch || '' } })")

code = code.replace("branch: user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5'", "branch: localStorage.getItem('branch_id') || user?.branch || '360b4139-a64f-46fa-9564-e0b8832135f5'")


# 5. Guard list/tables mapping & active booking search in floor map
old_svg_block = """                  {tables.map((t) => {
                    const isRound = t.shape === 'round';
                    const activeBookingForTable = bookings.find(b => 
                      b.assigned_tables?.includes(t.number) && 
                      ['confirmed', 'seated', 'checked_in', 'pending'].includes(b.status)
                    );"""

new_svg_block = """                  {(Array.isArray(tables) ? tables : []).map((t) => {
                    const isRound = t.shape === 'round';
                    const activeBookingForTable = (Array.isArray(bookings) ? bookings : []).find(b => 
                      (b.assigned_tables || []).includes(t.number) && 
                      ['confirmed', 'seated', 'checked_in', 'pending', 'arrived', 'dining', 'checkout_requested'].includes(b.status)
                    );
                    const isSelected = selectedTable?.id === t.id || (selectedBooking && (selectedBooking.assigned_tables || []).includes(t.number));
                    const strokeWidth = isSelected ? 4 : 2;"""

code = code.replace(old_svg_block, new_svg_block)

code = code.replace('strokeWidth="2"', 'strokeWidth={strokeWidth}')
code = code.replace('stroke={statusColor}', "stroke={isSelected ? 'var(--color-primary)' : statusColor}")
code = code.replace('activeBookingForTable.status.slice(0, 4).toUpperCase()', 'activeBookingForTable?.status?.slice(0, 4)?.toUpperCase()')


# 6. Listen to branchUpdate event
old_effect = """  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);"""

new_effect = """  useEffect(() => {
    fetchData();
    window.addEventListener('branchUpdate', fetchData);
    const interval = setInterval(fetchData, 30000);
    return () => {
      window.removeEventListener('branchUpdate', fetchData);
      clearInterval(interval);
    };
  }, [fetchData]);"""

code = code.replace(old_effect, new_effect)


# 7. Sync selectedTable/selectedBooking on fetchData
old_fetch_body = """      if (tablesRes.data?.success) setTables(tablesRes.data.data);
      if (bookingsRes.data?.success) setBookings(bookingsRes.data.data);
      if (waitlistRes.data?.success) setWaitlist(waitlistRes.data.data);"""

new_fetch_body = """      if (tablesRes.data?.success) {
        const freshTables = tablesRes.data.data;
        setTables(freshTables);
        if (selectedTable) {
          const freshTable = freshTables.find(t => t.id === selectedTable.id);
          if (freshTable) setSelectedTable(freshTable);
        }
      }
      if (bookingsRes.data?.success) {
        const freshBookings = bookingsRes.data.data;
        setBookings(freshBookings);
        if (selectedBooking) {
          const freshBooking = freshBookings.find(b => b.id === selectedBooking.id);
          if (freshBooking) setSelectedBooking(freshBooking);
        }
      }
      if (waitlistRes.data?.success) setWaitlist(waitlistRes.data.data);"""

code = code.replace(old_fetch_body, new_fetch_body)


# Write updated code back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Reservations.jsx updated successfully.")
