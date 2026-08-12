file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

old_sync_block = """        if (selectedTable) {
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
      }"""

new_sync_block = """        if (selectedTable) {
          const freshTable = freshTables.find(t => t.id === selectedTable.id);
          setSelectedTable(freshTable || null);
        }
      }
      if (bookingsRes.data?.success) {
        const freshBookings = bookingsRes.data.data;
        setBookings(freshBookings);
        if (selectedBooking) {
          const freshBooking = freshBookings.find(b => b.id === selectedBooking.id);
          setSelectedBooking(freshBooking || null);
          if (!freshBooking) {
            setDrawerOpen(false);
          }
        }
      }"""

if old_sync_block in code:
    code = code.replace(old_sync_block, new_sync_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Fetch synchronization logic updated successfully.")
else:
    print("Error: Could not find exact old_sync_block match.")
