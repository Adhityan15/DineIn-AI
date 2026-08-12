import React from 'react';
import { Badge, Input, PrimaryButton, SecondaryButton } from '../DesignSystem';

const CashDrawer = ({
  cashDrawerOpen,
  activeDrawerSession,
  openingBalanceInput,
  setOpeningBalanceInput,
  closingBalanceInput,
  setClosingBalanceInput,
  drawerNotes,
  setDrawerNotes,
  onOpenSession,
  onCloseSession,
  onClose
}) => {
  return (
    <div className="space-y-4 text-xs">
      {/* 1. Status overview */}
      <div className="bg-app-elevated/40 border border-app-border rounded-app-lg p-3 flex justify-between items-center text-xs">
        <span className="font-semibold text-text-secondary">Cash Drawer Status:</span>
        <Badge variant={cashDrawerOpen ? 'success' : 'danger'} className="text-[10px] px-2 py-0.5 uppercase">
          {cashDrawerOpen ? 'ACTIVE SESSION OPEN' : 'CLOSED'}
        </Badge>
      </div>

      {/* 2. Opening cash form */}
      {!cashDrawerOpen ? (
        <div className="space-y-3.5 p-3 bg-app-elevated/5 border border-app-border rounded-app-lg">
          <h4 className="font-extrabold text-sm text-text-primary">Open Daily Cash Session</h4>
          <p className="text-[10px] text-text-muted">Enter opening physical drawer cash balance to start billing</p>
          
          <Input
            label="Opening Cash Balance ($)"
            type="number"
            placeholder="0.00"
            value={openingBalanceInput}
            onChange={(e) => setOpeningBalanceInput(e.target.value)}
          />
          <Input
            label="Cashier Notes"
            placeholder="Drawer sync remarks..."
            value={drawerNotes}
            onChange={(e) => setDrawerNotes(e.target.value)}
          />
          
          <PrimaryButton onClick={onOpenSession} className="w-full py-2.5 bg-app-success border-none">
            Open Session & Activate Drawer
          </PrimaryButton>
        </div>
      ) : (
        /* 3. Closing cash form */
        <div className="space-y-3.5 p-3 bg-app-elevated/5 border border-app-border rounded-app-lg">
          <h4 className="font-extrabold text-sm text-text-primary">Close Active Cash Session</h4>
          <p className="text-[10px] text-text-muted">
            Opened at: {new Date(activeDrawerSession?.opening_time).toLocaleTimeString()}<br/>
            Expected balance in drawer: ${Number(activeDrawerSession?.expected_balance || 0).toFixed(2)}
          </p>
          
          <Input
            label="Closing Cash Count Balance ($)"
            type="number"
            placeholder="0.00"
            value={closingBalanceInput}
            onChange={(e) => setClosingBalanceInput(e.target.value)}
          />
          <Input
            label="Closing Remarks"
            placeholder="Cash discrepancies reasons..."
            value={drawerNotes}
            onChange={(e) => setDrawerNotes(e.target.value)}
          />
          
          <PrimaryButton onClick={onCloseSession} className="w-full py-2.5 bg-app-danger border-none">
            Close Session & Lock Drawer
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

export default CashDrawer;
