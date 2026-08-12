file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Locate QR Show Modal
old_qr_modal = """      {/* 12. SHOW CUSTOMER QR CODE GENERATOR */}
      <Modal
        isOpen={qrShowModalOpen}
        onClose={() => setQrShowModalOpen(false)}
        title="DineIn QR Seat Pass"
      >
        {qrBooking && (
          <div className="space-y-6 text-center">
            <div className="bg-white p-4 rounded-app-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg border border-app-border/10">
              {/* Load a beautiful real QR code from qrserver API */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrBooking.id}`}
                alt={`QR Pass for Booking ${qrBooking.id}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2 max-w-[280px] mx-auto">
              <h4 className="text-xs font-extrabold text-text-primary">Pass for {qrBooking.guest_name}</h4>
              
              <div className="bg-app-elevated border border-app-border rounded-app-xl p-2.5 flex items-center justify-between text-left mt-2">
                <div className="font-mono text-[9px] text-text-primary select-all truncate max-w-[190px]">
                  ID: <span className="font-bold">{qrBooking.id}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrBooking.id);
                    addToast('Booking ID copied to clipboard!', 'success');
                  }}
                  className="text-app-primary hover:text-app-primary/80 text-[9px] font-extrabold uppercase ml-2 px-2 py-1 bg-app-primary/10 rounded"
                  type="button"
                >
                  Copy
                </button>
              </div>

              <p className="text-[10px] text-text-secondary leading-normal pt-2">
                Scan this pass at host reception to check in and seat dining immediately.
              </p>
              <SecondaryButton className="w-full text-[10px] h-9 font-bold mt-2" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrBooking.id}`)}>
                Download Pass
              </SecondaryButton>
            </div>
          </div>
        )}
      </Modal>"""

new_qr_modal = """      {/* 12. SHOW CUSTOMER QR CODE GENERATOR - LUXURY AIRLINE BOARDING PASS STYLING */}
      <Modal
        isOpen={qrShowModalOpen}
        onClose={() => setQrShowModalOpen(false)}
        title="DineIn Luxury Boarding Pass"
      >
        {qrBooking && (
          <div className="space-y-6">
            {/* Airline Boarding Pass Container */}
            <div className="bg-[#1e293b] text-white border border-[#334155] rounded-app-2xl overflow-hidden shadow-2xl relative font-sans">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-app-primary to-indigo-600 px-5 py-3.5 flex items-center justify-between border-b border-[#334155]">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-extrabold tracking-widest text-white uppercase">
                    DineIn AI
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-white/20 text-white rounded-full uppercase tracking-wider font-extrabold">Boarding Pass</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-white/90">
                  {qrBooking.branch_name || 'Main Branch'}
                </span>
              </div>

              {/* Passenger Info Grid */}
              <div className="p-5 grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Passenger Name</span>
                  <p className="text-sm font-extrabold truncate">{qrBooking.guest_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Booking Status</span>
                  <div>
                    <Badge status={getStatusBadge(qrBooking.status)}>{qrBooking.status.toUpperCase()}</Badge>
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Reservation ID</span>
                  <p className="text-[10px] font-mono text-white/90 break-all select-all">{qrBooking.id}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Date</span>
                  <p className="text-[11px] font-extrabold">{new Date(qrBooking.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Time Slot</span>
                  <p className="text-[11px] font-extrabold">
                    {new Date(qrBooking.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Guests Count</span>
                  <p className="text-[11px] font-extrabold">{qrBooking.party_size} Diners</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">Assigned Table</span>
                  <p className="text-[11px] font-extrabold text-app-primary">
                    {qrBooking.assigned_tables?.length > 0 
                      ? qrBooking.assigned_tables.map(n => `T-${n}`).join(', ') 
                      : 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* Dotted Separator with ticket cutouts on left/right */}
              <div className="relative flex items-center justify-center my-1">
                <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-app-bg border border-[#334155]" />
                <div className="w-full border-t border-dashed border-[#475569] mx-4" />
                <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-app-bg border border-[#334155]" />
              </div>

              {/* QR Code and Scan info */}
              <div className="p-5 flex flex-col items-center justify-center space-y-3">
                <div className="bg-white p-3 rounded-app-2xl w-36 h-36 flex items-center justify-center border border-[#334155] shadow-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrBooking.id}`}
                    alt="DineIn QR Pass"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-extrabold">Scan Pass at Reception</p>
              </div>

              {/* Ticket Footer details */}
              <div className="bg-[#1e293b] px-5 py-3 border-t border-[#334155] text-left text-[9px] text-text-muted flex justify-between items-center font-semibold">
                <span>DineIn AI Digital boarding pass</span>
                <span>Support: support@dinein.ai</span>
              </div>
            </div>

            {/* Quick Actions Boarding Pass Bar */}
            <div className="grid grid-cols-3 gap-2">
              <SecondaryButton 
                onClick={() => {
                  const addr = qrBooking.address || qrBooking.branch_name || 'Bangalore Main Branch';
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
                }}
                className="text-[9px] font-bold h-9 flex items-center justify-center gap-1"
              >
                Google Maps
              </SecondaryButton>

              <SecondaryButton 
                onClick={() => {
                  setQrShowModalOpen(false);
                  setSelectedBooking(qrBooking);
                  fetchBookingHistory(qrBooking.id);
                  setDrawerOpen(true);
                }}
                className="text-[9px] font-bold h-9"
              >
                View Booking
              </SecondaryButton>

              {['pending', 'confirmed', 'arrived', 'seated', 'dining', 'checkout_requested'].includes(qrBooking.status) && (
                <DangerButton 
                  onClick={() => {
                    setQrShowModalOpen(false);
                    handleCancelClick(qrBooking);
                  }}
                  className="text-[9px] font-bold h-9"
                >
                  Cancel Pass
                </DangerButton>
              )}
            </div>
          </div>
        )}
      </Modal>"""

code = code.replace(old_qr_modal, new_qr_modal)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Reservations.jsx QR boarding pass modal updated successfully.")
