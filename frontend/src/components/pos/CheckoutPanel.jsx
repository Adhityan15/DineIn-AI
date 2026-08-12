import React from 'react';
import { RefreshCw, Play, ShieldAlert, ShoppingBag } from 'lucide-react';
import { PrimaryButton, SecondaryButton, Badge } from '../DesignSystem';

const CheckoutPanel = ({ 
  activeOrder, 
  onSendToKitchen, 
  onHoldBill, 
  onVoidBill, 
  onOpenCheckout,
  loading 
}) => {
  return (
    <div className="space-y-3 pt-3 border-t border-app-border/40">
      {/* KOT Status HUD */}
      {activeOrder && (
        <div className="p-2.5 bg-app-elevated/70 border border-app-border/40 rounded-app-md flex items-center justify-between text-xs shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">KOT Kitchen Status</span>
            <span className="font-extrabold text-text-primary uppercase">Order #{activeOrder.id.slice(0, 8)}</span>
          </div>
          <Badge variant={
            activeOrder.status === 'received' ? 'info' :
            activeOrder.status === 'preparing' ? 'warning' :
            activeOrder.status === 'ready' ? 'success' :
            activeOrder.status === 'completed' ? 'success' : 'default'
          }>
            {activeOrder.status.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Primary Settlement Checkout & KOT Buttons */}
      <div className="space-y-2">
        <PrimaryButton 
          onClick={onSendToKitchen} 
          className="w-full py-2 bg-app-warning border-app-warning hover:bg-app-warning/90 text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Send to Kitchen (KOT)
        </PrimaryButton>

        <div className="flex gap-2">
          <SecondaryButton onClick={onHoldBill} className="flex-1 text-[10px] py-2 uppercase font-black">
            Hold Bill
          </SecondaryButton>
          <SecondaryButton 
            onClick={onVoidBill} 
            className="flex-1 text-[10px] text-app-danger hover:bg-app-danger/5 py-2 uppercase font-black"
          >
            {activeOrder ? 'Cancel KOT' : 'Void Bill'}
          </SecondaryButton>
        </div>

        <PrimaryButton 
          onClick={onOpenCheckout} 
          className="w-full py-3 shadow-app-md text-xs font-black uppercase tracking-wider mt-2.5 flex items-center justify-center gap-1.5"
        >
          <ShoppingBag size={13} />
          Settle & Cashout Bill
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CheckoutPanel;
