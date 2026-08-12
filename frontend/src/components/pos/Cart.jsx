import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2, Percent, Copy } from 'lucide-react';
import { AppCard, SecondaryButton, Badge } from '../DesignSystem';

const Cart = ({ 
  cart, 
  updateQuantity, 
  removeFromCart, 
  onDuplicateItem,
  subtotal, 
  cgst, 
  sgst, 
  serviceCharge, 
  discount, 
  setDiscount, 
  couponCode, 
  setCouponCode, 
  couponDiscount, 
  setCouponDiscount, 
  grandTotal, 
  activeOrder, 
  addToast 
}) => {
  return (
    <div className="space-y-4 flex flex-col h-full justify-between">
      {/* 1. Cart Items List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[36vh] pr-1">
        {cart.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-text-muted">
            <ShoppingCart size={32} className="stroke-[1.5] mb-2 text-text-muted/60" />
            <p className="text-xs font-bold text-text-primary">Receipt list is empty</p>
            <p className="text-[10px] text-text-muted mt-0.5">Select menu items on the left catalog grid</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.id} className="p-2 bg-app-elevated/40 rounded-app-md border border-app-border/40 space-y-1">
                <div className="flex justify-between items-start text-xs">
                  <div className="space-y-0.5 pr-2">
                    <span className="font-extrabold text-text-primary block leading-tight">{item.name}</span>
                    {item.variantName && (
                      <span className="text-[9px] bg-app-primary/10 text-app-primary px-1 rounded block w-max uppercase font-black">
                        {item.variantName} Size
                      </span>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <span className="text-[9px] text-text-muted block">
                        Mods: {item.modifiers.map(m => m.name).join(', ')}
                      </span>
                    )}
                    {item.kitchenNotes && (
                      <span className="text-[9px] text-app-warning block italic">
                        Notes: {item.kitchenNotes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)} 
                      className="w-5 h-5 rounded bg-app-elevated border border-app-border/60 text-text-secondary flex items-center justify-center hover:bg-app-border/30"
                    >
                      <Minus size={9} />
                    </button>
                    <span className="text-xs font-black text-text-primary min-w-[14px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)} 
                      className="w-5 h-5 rounded bg-app-elevated border border-app-border/60 text-text-secondary flex items-center justify-center hover:bg-app-border/30"
                    >
                      <Plus size={9} />
                    </button>
                    <button 
                      onClick={() => onDuplicateItem(item)} 
                      className="w-5 h-5 rounded text-app-primary flex items-center justify-center hover:bg-app-primary/10 ml-1"
                      title="Duplicate Item"
                    >
                      <Copy size={10} />
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="w-5 h-5 rounded text-app-danger flex items-center justify-center hover:bg-app-danger/10 ml-1"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted font-bold pt-1 border-t border-app-border/20">
                  <span>${Number(item.price).toFixed(2)} each</span>
                  <span className="text-text-secondary font-extrabold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Billing Breakdown */}
      {cart.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-app-border/60 text-xs">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="font-extrabold text-text-primary">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>CGST (2.5%)</span>
            <span>${cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>SGST (2.5%)</span>
            <span>${sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Service Charge (10%)</span>
            <span>${serviceCharge.toFixed(2)}</span>
          </div>

          {/* Discount Inputs */}
          <div className="flex items-center justify-between text-text-secondary">
            <span className="flex items-center gap-1">
              <Percent size={11} className="text-text-muted" />
              Discount ($)
            </span>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              className="w-16 text-right border border-app-border rounded bg-app-elevated text-[11px] font-black px-1.5 py-0.5 outline-none focus:border-app-primary"
            />
          </div>

          <div className="flex items-center justify-between text-text-secondary">
            <span className="flex items-center gap-1">
              <Percent size={11} className="text-text-muted" />
              Coupon Code
            </span>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="SAVE20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-16 border border-app-border rounded bg-app-elevated text-[10px] uppercase font-black px-1 outline-none focus:border-app-primary"
              />
              <button
                type="button"
                onClick={() => {
                  if (couponCode.toUpperCase() === 'SAVE20') {
                    setCouponDiscount(subtotal * 0.20);
                    if (addToast) addToast('Coupon SAVE20 applied! 20% discount added.', 'success');
                  } else if (couponCode.toUpperCase() === 'WELCOME10') {
                    setCouponDiscount(10.00);
                    if (addToast) addToast('Coupon WELCOME10 applied! $10 flat discount added.', 'success');
                  } else {
                    if (addToast) addToast('Invalid coupon code.', 'error');
                    setCouponDiscount(0);
                  }
                }}
                className="px-1.5 py-0.5 bg-app-primary/10 text-app-primary border border-app-primary/20 rounded text-[9px] font-black uppercase hover:bg-app-primary hover:text-white"
              >
                Apply
              </button>
            </div>
          </div>

          {couponDiscount > 0 && (
            <div className="flex justify-between text-text-secondary">
              <span>Coupon Discount</span>
              <span className="text-app-success font-bold">-${couponDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-text-primary font-black text-sm pt-2.5 border-t border-app-border/80">
            <span>Grand Total</span>
            <span className="text-app-primary">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
