import React from 'react';
import { Select, Input } from '../DesignSystem';

const WaiterSelector = ({ 
  waiters, 
  selectedWaiter, 
  onSelectWaiterChange,
  manualWaiterName,
  onManualWaiterNameChange,
  getWaiterStats 
}) => {
  return (
    <div className="space-y-3">
      <div>
        <Select
          label="Option 1: Select Waiter from Existing Staff"
          value={manualWaiterName ? '' : selectedWaiter}
          onChange={(e) => {
            onSelectWaiterChange(e.target.value);
            onManualWaiterNameChange(''); // Clear manual name on selecting from list
          }}
        >
          <option value="">Choose registered waiter...</option>
          {waiters.map(emp => {
            const stats = getWaiterStats ? getWaiterStats(emp.user) : { tablesCount: 0, activeOrdersCount: 0 };
            return (
              <option key={emp.id} value={emp.user}>
                {emp.name} (ID: {emp.employee_id}) — Tables: {stats.tablesCount}, Active Orders: {stats.activeOrdersCount}
              </option>
            );
          })}
        </Select>
      </div>

      <div>
        <Input
          label="Option 2: OR Enter Waiter Name Manually"
          placeholder="Enter temporary or unregistered staff name..."
          value={manualWaiterName}
          onChange={(e) => {
            onManualWaiterNameChange(e.target.value);
            onSelectWaiterChange(''); // Clear selection on typing manual name
          }}
        />
      </div>
    </div>
  );
};

export default WaiterSelector;
