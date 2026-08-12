import React, { useState } from 'react';
import { Search, Printer, Download, Eye } from 'lucide-react';
import { Input, Badge, SecondaryButton } from '../DesignSystem';

const BillHistory = ({ invoiceHistory, onOpenPreview, onDownloadPDF, onPrint, onRefundInvoice }) => {
  const [search, setSearch] = useState('');

  const filteredHistory = invoiceHistory.filter(inv => 
    inv.id.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary">Past Settled Billings</h3>
          <p className="text-[10px] text-text-muted">Review, print, or download ReportLab PDF receipts</p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search by Invoice ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-xs text-text-muted">
          No settled invoices found.
        </div>
      ) : (
        <div className="overflow-x-auto border border-app-border/40 rounded-app-lg bg-app-elevated/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-app-border/40 bg-app-elevated font-extrabold text-text-primary">
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(inv => (
                <tr key={inv.id} className="border-b border-app-border/30 text-text-secondary hover:bg-app-elevated/20">
                  <td className="p-3 font-mono text-[10px] font-bold">#{inv.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3 font-semibold">{inv.customer_name || 'Walk-In'}</td>
                  <td className="p-3">
                    <Badge variant="default" className="text-[9px] uppercase font-black">
                      {inv.payment_method}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      inv.status === 'paid' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : inv.status === 'refunded'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 font-black text-text-primary">${Number(inv.total).toFixed(2)}</td>
                  <td className="p-3 text-right space-x-1 flex justify-end items-center">
                    <button 
                      onClick={() => onOpenPreview(inv)}
                      className="p-1.5 rounded bg-app-primary/10 text-app-primary hover:bg-app-primary hover:text-white"
                      title="Preview Receipt"
                    >
                      <Eye size={11} />
                    </button>
                    <button 
                      onClick={() => onPrint(inv.id)}
                      className="p-1.5 rounded bg-app-success/10 text-app-success hover:bg-app-success hover:text-white"
                      title="Print Receipt"
                    >
                      <Printer size={11} />
                    </button>
                    <button 
                      onClick={() => onDownloadPDF(inv.id)}
                      className="p-1.5 rounded bg-app-warning/10 text-app-warning hover:bg-app-warning hover:text-white"
                      title="Download PDF"
                    >
                      <Download size={11} />
                    </button>
                    {inv.status === 'paid' && onRefundInvoice && (
                      <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to process a transactional refund for this invoice? This will restore ingredient stock and cancel loyalty points.")) {
                            onRefundInvoice(inv.id);
                          }
                        }}
                        className="px-2 py-1 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                        title="Process Transactional Refund"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BillHistory;
