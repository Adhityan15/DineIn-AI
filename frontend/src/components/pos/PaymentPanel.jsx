import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, QrCode, DollarSign, Wallet, Gift, CheckCircle, Smartphone } from 'lucide-react';
import { PrimaryButton, SecondaryButton, Badge, Input } from '../DesignSystem';

const PaymentPanel = ({
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  splitAmounts,
  setSplitAmounts,
  splitPayments,
  setSplitPayments,
  tempSplitMethod,
  setTempSplitMethod,
  tempSplitAmount,
  setTempSplitAmount,
  tempGuestLabel,
  setTempGuestLabel,
  paymentStep,
  setPaymentStep,
  transactionId,
  setTransactionId,
  cardSimulationState,
  setCardSimulationState,
  onSubmitPayment,
  addToast
}) => {
  const [cashReceived, setCashReceived] = useState('');
  const [changeDue, setChangeDue] = useState(0);

  // Cash change due calculation
  useEffect(() => {
    if (paymentMethod === 'cash') {
      const rec = Number(cashReceived) || 0;
      setChangeDue(Math.max(0, rec - grandTotal));
    }
  }, [cashReceived, paymentMethod, grandTotal]);

  const paymentModes = [
    { id: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-500 bg-green-500/10' },
    { id: 'card', label: 'Card Payment', icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'upi', label: 'UPI QR', icon: QrCode, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'wallet', label: 'E-Wallet', icon: Smartphone, color: 'text-orange-500 bg-orange-500/10' },
    { id: 'gift_card', label: 'Gift Card', icon: Gift, color: 'text-pink-500 bg-pink-500/10' }
  ];

  const handleStartCardSimulation = () => {
    // Generate simulated terminal parameters
    setTransactionId(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentStep(2);
    setCardSimulationState('waiting');
    
    setTimeout(() => {
      setCardSimulationState('tap_card');
      setTimeout(() => {
        setCardSimulationState('approved');
        setTimeout(() => {
          setCardSimulationState('success');
        }, 1200);
      }, 1500);
    }, 1500);
  };

  const handleStartUpiSimulation = () => {
    setTransactionId(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentStep(2);
  };

  const handleAddSplitPayment = () => {
    if (!tempSplitAmount || Number(tempSplitAmount) <= 0) {
      if (addToast) addToast('Please enter a valid split payout amount.', 'warning');
      return;
    }
    const amount = Number(tempSplitAmount);
    const totalAdded = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = grandTotal - totalAdded;

    if (amount > remaining + 0.01) {
      if (addToast) addToast(`Payout exceeds outstanding total of $${remaining.toFixed(2)}.`, 'warning');
      return;
    }

    const newPayout = {
      id: Math.random().toString(),
      guest: tempGuestLabel || `Guest ${splitPayments.length + 1}`,
      method: tempSplitMethod,
      amount
    };

    setSplitPayments([...splitPayments, newPayout]);
    setTempSplitAmount('');
    setTempGuestLabel('');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* STEP 1: Select payment mode */}
      {paymentStep === 1 && (
        <div className="space-y-4">
          <div className="bg-app-elevated border border-app-border rounded-app-lg p-3 flex justify-between items-center text-sm font-extrabold text-text-primary">
            <span>Outstanding Invoice Total:</span>
            <span className="text-app-primary">${grandTotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paymentModes.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(mode.id);
                    setPaymentStep(1);
                  }}
                  className={`p-3.5 border rounded-app-lg flex flex-col items-center gap-2 text-center transition font-extrabold ${
                    paymentMethod === mode.id
                      ? 'border-app-primary bg-app-primary/5 text-app-primary'
                      : 'border-app-border/40 bg-app-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className={`p-2 rounded-full ${mode.color}`}>
                    <Icon size={16} />
                  </div>
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Payment options inputs */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 p-3 bg-app-elevated border border-app-border rounded-app-lg">
              <Input
                label="Cash Tendered Received ($)"
                type="number"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
              />
              <div className="flex justify-between items-center font-bold text-xs pt-1">
                <span className="text-text-muted">Change Balance Due:</span>
                <span className={`text-sm font-black ${changeDue > 0 ? 'text-app-success' : 'text-text-primary'}`}>
                  ${changeDue.toFixed(2)}
                </span>
              </div>
              <PrimaryButton 
                onClick={() => {
                  if (Number(cashReceived) < grandTotal) {
                    if (addToast) addToast('Tendered cash is less than invoice total!', 'warning');
                    return;
                  }
                  onSubmitPayment({
                    approval_code: 'CASH-SETTLED',
                    terminal_id: 'CASH-DRAW-1',
                    reference_number: `RRN-${Math.floor(100000 + Math.random() * 900000)}`,
                    change_due: changeDue
                  });
                }} 
                className="w-full py-2.5 mt-2 bg-app-success hover:bg-green-700 border-none"
              >
                Complete Cash Sale
              </PrimaryButton>
            </div>
          )}

          {/* Card Payment Simulator Start */}
          {paymentMethod === 'card' && (
            <PrimaryButton onClick={handleStartCardSimulation} className="w-full py-2.5 mt-2">
              Settle via Card Terminal Machine
            </PrimaryButton>
          )}

          {/* UPI QR Payment Simulator Start */}
          {paymentMethod === 'upi' && (
            <PrimaryButton onClick={handleStartUpiSimulation} className="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-700 border-none">
              Generate Dynamic UPI QR
            </PrimaryButton>
          )}
        </div>
      )}

      {/* STEP 2: Active simulators (Card or UPI) */}
      {paymentStep === 2 && (
        <div>
          {paymentMethod === 'card' && (
            <div className="space-y-4 text-center py-4">
              {cardSimulationState === 'waiting' && (
                <div className="space-y-3">
                  <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-extrabold text-text-primary">Waiting for Terminal machine sync...</p>
                  <p className="text-[10px] text-text-muted">Initializing Bluetooth secure terminal protocol</p>
                </div>
              )}
              {cardSimulationState === 'tap_card' && (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-app-primary/10 rounded-full flex items-center justify-center mx-auto text-app-primary animate-pulse">
                    <CreditCard size={24} />
                  </div>
                  <p className="font-extrabold text-text-primary text-sm">TAP or INSERT CUSTOMER CARD</p>
                  <p className="text-[10px] text-text-muted">Device ID: TERM-BLR-009 | Ref: {transactionId}</p>
                </div>
              )}
              {cardSimulationState === 'approved' && (
                <div className="space-y-3">
                  <div className="w-10 h-10 border-4 border-app-success border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-extrabold text-app-success text-sm">APPROVED!</p>
                  <p className="text-[10px] text-text-muted">Authorizing transaction holds...</p>
                </div>
              )}
              {cardSimulationState === 'success' && (
                <div className="space-y-4">
                  <CheckCircle size={44} className="text-app-success mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-app-success text-sm">Authorization successful!</p>
                    <p className="text-[10px] text-text-muted">Auth Code: AP-7729 | Ref ID: {transactionId}</p>
                  </div>
                  <PrimaryButton 
                    onClick={() => onSubmitPayment({
                      approval_code: 'AP-7729',
                      terminal_id: 'TERM-BLR-009',
                      card_type: 'VISA',
                      card_last4: '4099',
                      reference_number: `RRN-${Math.floor(100000 + Math.random() * 900000)}`
                    })} 
                    className="w-full bg-app-success hover:bg-green-700 border-none"
                  >
                    Complete Card Settle & Print Invoice
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="space-y-4 text-center py-2">
              <div className="p-3 bg-white border border-app-border rounded-app-lg w-40 h-40 mx-auto flex items-center justify-center">
                <QrCode size={130} className="text-black" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-text-primary text-sm">Scan Dynamic UPI QR Code</p>
                <p className="text-[10px] text-text-muted">Total: ${grandTotal.toFixed(2)} | Transaction: {transactionId}</p>
              </div>
              <div className="flex gap-2">
                <SecondaryButton onClick={() => setPaymentStep(1)} className="flex-1 py-2">
                  Change Mode
                </SecondaryButton>
                <PrimaryButton 
                  onClick={() => onSubmitPayment({
                    approval_code: 'UPI-VERIFIED',
                    terminal_id: 'UPI-QR-MAIN',
                    upi_id: 'pay@dinein.ai',
                    reference_number: `RRN-${Math.floor(100000 + Math.random() * 900000)}`
                  })}
                  className="flex-1 bg-app-success hover:bg-green-700 border-none py-2"
                >
                  Verify Payment & Settle
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentPanel;
