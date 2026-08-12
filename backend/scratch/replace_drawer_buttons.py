file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Locate drawer buttons block exactly
old_drawer_block = """              {selectedBooking.status === 'pending' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Approval/rejection notes..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <PrimaryButton onClick={() => handleApprove(selectedBooking.id)} className="flex-1">
                      Approve Booking
                    </PrimaryButton>
                    <DangerButton onClick={() => { setRejectReason(''); setRejectModalOpen(true); }} className="flex-1">
                      Reject
                    </DangerButton>
                  </div>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <div className="flex gap-2">
                  <PrimaryButton onClick={() => handleCheckIn(selectedBooking.id)} className="flex-1">
                    Check In Guest
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setNoShowModalOpen(true)} className="flex-1">
                    Mark No Show
                  </SecondaryButton>
                </div>
              )}

              {selectedBooking.status === 'checked_in' && (
                <PrimaryButton onClick={() => handleSeat(selectedBooking.id)} className="w-full">
                  Seat / Start Dining
                </PrimaryButton>
              )}

              {selectedBooking.status === 'seated' && (
                <PrimaryButton onClick={() => handleCheckOut(selectedBooking.id)} className="w-full">
                  Complete / Checkout Dining
                </PrimaryButton>
              )}

              {['pending', 'confirmed', 'checked_in', 'seated'].includes(selectedBooking.status) && (
                <DangerButton onClick={() => handleCancelClick(selectedBooking)} className="w-full">
                  Cancel Reservation
                </DangerButton>
              )}"""

new_drawer_block = """              {selectedBooking.status === 'pending' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Approval/rejection notes..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <PrimaryButton onClick={() => handleApprove(selectedBooking.id)} className="flex-1">
                      Approve Booking
                    </PrimaryButton>
                    <DangerButton onClick={() => { setRejectReason(''); setRejectModalOpen(true); }} className="flex-1">
                      Reject
                    </DangerButton>
                  </div>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <div className="flex gap-2">
                  <PrimaryButton onClick={() => handleCheckIn(selectedBooking.id)} className="flex-1">
                    Check In Guest
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setNoShowModalOpen(true)} className="flex-1">
                    Mark No Show
                  </SecondaryButton>
                </div>
              )}

              {selectedBooking.status === 'arrived' && (
                <PrimaryButton onClick={() => handleSeat(selectedBooking.id)} className="w-full bg-amber-600 border-amber-600 hover:bg-amber-700">
                  Seat Guest
                </PrimaryButton>
              )}

              {selectedBooking.status === 'seated' && (
                <PrimaryButton onClick={() => handleStartDining(selectedBooking.id)} className="w-full bg-indigo-600 border-indigo-600 hover:bg-indigo-700">
                  Start Dining
                </PrimaryButton>
              )}

              {selectedBooking.status === 'dining' && (
                <PrimaryButton onClick={() => handleRequestCheckout(selectedBooking.id)} className="w-full">
                  Request Checkout
                </PrimaryButton>
              )}

              {selectedBooking.status === 'checkout_requested' && (
                <PrimaryButton onClick={() => handleCheckOut(selectedBooking.id)} className="w-full">
                  Complete Checkout
                </PrimaryButton>
              )}

              {selectedBooking.status === 'completed' && (
                <SecondaryButton onClick={() => handleArchive(selectedBooking.id)} className="w-full">
                  Archive Reservation
                </SecondaryButton>
              )}

              {['pending', 'confirmed', 'arrived', 'seated', 'dining', 'checkout_requested'].includes(selectedBooking.status) && (
                <DangerButton onClick={() => handleCancelClick(selectedBooking)} className="w-full">
                  Cancel Reservation
                </DangerButton>
              )}"""

if old_drawer_block in code:
    code = code.replace(old_drawer_block, new_drawer_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Drawer buttons replaced successfully.")
else:
    print("Error: Could not find exact old_drawer_block match.")
