file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update List Buttons block
old_list_buttons = """                            {/* Actions by lifecycle stage */}
                            {b.status === 'pending' && (
                              <PrimaryButton
                                onClick={() => handleApprove(b.id)}
                                className="px-3 py-1 shadow-app-sm h-8"
                              >
                                Approve
                              </PrimaryButton>
                            )}
                            
                            {b.status === 'confirmed' && (
                              <PrimaryButton
                                onClick={() => handleCheckIn(b.id)}
                                className="px-3 py-1 shadow-app-sm h-8"
                              >
                                Check In
                              </PrimaryButton>
                            )}

                            {b.status === 'checked_in' && (
                              <PrimaryButton
                                onClick={() => handleSeat(b.id)}
                                className="px-3 py-1 shadow-app-sm h-8"
                              >
                                Seat Dining
                              </PrimaryButton>
                            )}

                            {b.status === 'seated' && (
                              <SecondaryButton
                                onClick={() => handleCheckOut(b.id)}
                                className="px-3 py-1 h-8"
                              >
                                Checkout
                              </SecondaryButton>
                            )}"""

new_list_buttons = """                            {/* Actions by lifecycle stage */}
                            {b.status === 'pending' && (
                              <div className="flex gap-1.5">
                                <PrimaryButton onClick={() => handleApprove(b.id)} className="px-2.5 py-1 shadow-app-sm h-8 text-[10px]">Approve</PrimaryButton>
                                <SecondaryButton onClick={() => { setSelectedBooking(b); setRejectModalOpen(true); }} className="px-2.5 py-1 h-8 text-[10px] text-app-danger hover:bg-app-danger/10">Reject</SecondaryButton>
                              </div>
                            )}
                            
                            {b.status === 'confirmed' && (
                              <PrimaryButton onClick={() => handleCheckIn(b.id)} className="px-3 py-1 shadow-app-sm h-8 text-[10px]">Check In</PrimaryButton>
                            )}

                            {b.status === 'arrived' && (
                              <PrimaryButton onClick={() => handleSeat(b.id)} className="px-3 py-1 shadow-app-sm h-8 bg-amber-600 border-amber-600 hover:bg-amber-700 text-[10px]">Seat Guest</PrimaryButton>
                            )}

                            {b.status === 'seated' && (
                              <PrimaryButton onClick={() => handleStartDining(b.id)} className="px-3 py-1 shadow-app-sm h-8 bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-[10px]">Start Dining</PrimaryButton>
                            )}

                            {b.status === 'dining' && (
                              <SecondaryButton onClick={() => handleRequestCheckout(b.id)} className="px-3 py-1 h-8 text-[10px]">Checkout</SecondaryButton>
                            )}

                            {b.status === 'checkout_requested' && (
                              <PrimaryButton onClick={() => handleCheckOut(b.id)} className="px-3 py-1 shadow-app-sm h-8 text-[10px]">Complete Checkout</PrimaryButton>
                            )}

                            {b.status === 'completed' && (
                              <SecondaryButton onClick={() => handleArchive(b.id)} className="px-3 py-1 h-8 text-[10px]">Archive</SecondaryButton>
                            )}"""

code = code.replace(old_list_buttons, new_list_buttons)

# 2. Update Drawer Buttons block
old_drawer_buttons = """              {selectedBooking.status === 'pending' && (
                <div className="space-y-3">
                  <Textarea
                    label="Internal Notes"
                    placeholder="Add approval/rejection details..."
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

new_drawer_buttons = """              {selectedBooking.status === 'pending' && (
                <div className="space-y-3">
                  <Textarea
                    label="Internal Notes"
                    placeholder="Add approval/rejection details..."
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

code = code.replace(old_drawer_buttons, new_drawer_buttons)

# 3. Update Visual Lifecycle timeline in Drawer
old_timeline_block = """            {/* Lifecycle Stages visual timeline */}
            <div className="border-t border-app-border pt-4">
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block mb-3">Reservation Lifecycle</span>
              <div className="grid grid-cols-5 text-center text-[8px] font-extrabold text-text-muted uppercase tracking-wider relative mb-2">
                <span className={['pending', 'confirmed', 'reminder_sent', 'checked_in', 'seated', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Pending</span>
                <span className={['confirmed', 'reminder_sent', 'checked_in', 'seated', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Confirmed</span>
                <span className={['checked_in', 'seated', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Checked In</span>
                <span className={['seated', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Dining</span>
                <span className={selectedBooking.status === 'completed' ? 'text-app-primary' : ''}>Completed</span>
              </div>
              <div className="w-full bg-app-border h-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-app-primary transition-all duration-300"
                  style={{
                    width: selectedBooking.status === 'pending' ? '10%' :
                           selectedBooking.status === 'confirmed' ? '30%' :
                           selectedBooking.status === 'checked_in' ? '50%' :
                           selectedBooking.status === 'seated' ? '70%' :
                           selectedBooking.status === 'completed' ? '100%' : '0%'
                  }}
                />
              </div>
            </div>"""

new_timeline_block = """            {/* Lifecycle Stages visual timeline */}
            <div className="border-t border-app-border pt-4">
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block mb-3">Reservation Lifecycle</span>
              <div className="grid grid-cols-6 text-center text-[7px] font-extrabold text-text-muted uppercase tracking-wider relative mb-2">
                <span className={['pending', 'confirmed', 'arrived', 'seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Pending</span>
                <span className={['confirmed', 'arrived', 'seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Confirmed</span>
                <span className={['arrived', 'seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Arrived</span>
                <span className={['seated', 'dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Seated</span>
                <span className={['dining', 'checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Dining</span>
                <span className={['checkout_requested', 'completed'].includes(selectedBooking.status) ? 'text-app-primary' : ''}>Completed</span>
              </div>
              <div className="w-full bg-app-border h-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-app-primary transition-all duration-300"
                  style={{
                    width: selectedBooking.status === 'pending' ? '10%' :
                           selectedBooking.status === 'confirmed' ? '30%' :
                           selectedBooking.status === 'arrived' ? '50%' :
                           selectedBooking.status === 'seated' ? '68%' :
                           selectedBooking.status === 'dining' ? '82%' :
                           selectedBooking.status === 'checkout_requested' ? '92%' :
                           selectedBooking.status === 'completed' ? '100%' : '0%'
                  }}
                />
              </div>
            </div>"""

code = code.replace(old_timeline_block, new_timeline_block)

# 4. Check if checked_in status references also filter arrived/dining etc.
code = code.replace("['confirmed', 'seated', 'checked_in', 'pending']", "['confirmed', 'seated', 'checked_in', 'pending', 'arrived', 'dining', 'checkout_requested']")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("List and drawer buttons updated successfully.")
