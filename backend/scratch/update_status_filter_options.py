file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

old_filter_block = """                  <option value="all">All Bookings</option>
                  <option value="pending">Pending Approval</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="reminder_sent">Reminder Sent</option>
                  <option value="checked_in">Checked In</option>
                  <option value="seated">Seated (Dining)</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>"""

new_filter_block = """                  <option value="all">All Bookings</option>
                  <option value="pending">Pending Approval</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="reminder_sent">Reminder Sent</option>
                  <option value="arrived">Arrived (Checked In)</option>
                  <option value="seated">Seated</option>
                  <option value="dining">Dining</option>
                  <option value="checkout_requested">Checkout Requested</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>"""

if old_filter_block in code:
    code = code.replace(old_filter_block, new_filter_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Status filter options updated successfully.")
else:
    print("Error: Could not find exact old_filter_block match.")
