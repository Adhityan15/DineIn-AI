import React from 'react';
import { GlassCard, Badge } from '../DesignSystem';
import { User, ShieldAlert, Award, Star } from 'lucide-react';

const CustomerPanel = ({ customerName, customerPhone, customerEmail, partySize, bookingDetails }) => {
  if (!customerName || customerName === 'Walk-In Customer') {
    return (
      <GlassCard className="p-3 border border-app-border/40 bg-app-elevated/20 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary">
          <User size={14} className="text-text-muted" />
          <span className="font-semibold">Walk-In Customer (No Table Reservation)</span>
        </div>
        <Badge variant="default" className="text-[9px] uppercase">Walk-In</Badge>
      </GlassCard>
    );
  }

  const loyaltyTier = bookingDetails?.loyalty_tier || 'silver';
  const loyaltyPoints = bookingDetails?.loyalty_points || 0;
  const isVip = bookingDetails?.is_vip || false;
  const allergyNotes = bookingDetails?.allergy_notes || '';
  const specialRequests = bookingDetails?.special_requests || '';

  return (
    <GlassCard className="p-4 border border-app-primary/10 bg-app-elevated/35 text-xs space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-text-primary flex items-center gap-1.5">
            <User size={15} className="text-app-primary" />
            {customerName}
          </h4>
          <p className="text-[10px] text-text-muted">
            Phone: {customerPhone || 'N/A'} | Guests: {partySize || 2} pax
          </p>
        </div>
        <div className="flex gap-1.5">
          {isVip && (
            <Badge variant="danger" className="text-[9px] uppercase font-black flex items-center gap-0.5">
              <Star size={8} className="fill-current" />
              VIP
            </Badge>
          )}
          <Badge variant="success" className="text-[9px] uppercase font-black flex items-center gap-0.5">
            <Award size={9} />
            {loyaltyTier.toUpperCase()} ({loyaltyPoints} pts)
          </Badge>
        </div>
      </div>

      {(allergyNotes || specialRequests) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-app-border/40 text-[11px]">
          {allergyNotes && (
            <div className="p-2 bg-app-danger/5 border border-app-danger/20 rounded-app-md text-app-danger flex items-start gap-1.5">
              <ShieldAlert size={12} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-extrabold block uppercase text-[8px] tracking-wider">Allergy Warnings</span>
                <span className="font-semibold">{allergyNotes}</span>
              </div>
            </div>
          )}
          {specialRequests && (
            <div className="p-2 bg-app-primary/5 border border-app-primary/20 rounded-app-md text-text-secondary flex items-start gap-1.5">
              <User size={12} className="mt-0.5 flex-shrink-0 text-app-primary" />
              <div>
                <span className="font-extrabold block uppercase text-[8px] tracking-wider">Special Requests</span>
                <span className="font-semibold">{specialRequests}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default CustomerPanel;
