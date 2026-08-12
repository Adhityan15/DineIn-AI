import React from 'react';
import { Printer, Download, Mail, RefreshCw, X } from 'lucide-react';
import { GlassCard, PrimaryButton, SecondaryButton } from '../DesignSystem';

const InvoicePreview = ({ invoice, orderDetails, onDownloadPDF, onEmailInvoice, onPrint, onClose }) => {
  if (!invoice) return null;

  const items = orderDetails?.items || [];
  const tax = Number(invoice.subtotal || 0) * 0.05;
  const cgst = tax / 2.0;
  const sgst = tax / 2.0;

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center border-b border-app-border/40 pb-2">
        <div>
          <h3 className="font-extrabold text-sm text-text-primary">Invoice #{invoice.id.slice(0, 8).toUpperCase()}</h3>
          <p className="text-[9px] text-text-muted">Settled via {invoice.payment_method?.toUpperCase()} payment</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
          <X size={15} />
        </button>
      </div>

      {/* Styled Invoice Paper Receipt */}
      <GlassCard className="p-4 border border-app-border/60 bg-white text-black font-mono space-y-3.5 max-h-[350px] overflow-y-auto leading-relaxed shadow-inner">
        {/* Header Logo */}
        <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-2">
          <h4 className="font-black text-sm uppercase">DineIn AI Restaurant</h4>
          <p className="text-[9px] text-gray-600">MG Road, Bangalore, KA, India</p>
          <p className="text-[8px] text-gray-500 font-bold">GSTIN: 29AAAAA1111A1Z1 | FSSAI: 12345678901234</p>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-700">
          <div>
            <span className="block">Invoice: #{invoice.id.slice(0, 6)}</span>
            <span className="block">Table: {orderDetails?.table_number || invoice.table_number || 'Takeaway'}</span>
            <span className="block">Waiter: {invoice.waiter_name || 'Direct cashier'}</span>
          </div>
          <div className="text-right">
            <span className="block">Date: {new Date(invoice.created_at || Date.now()).toLocaleDateString()}</span>
            <span className="block">Guest: {invoice.customer_name || 'Walk-In'}</span>
            <span className="block">Cashier: {invoice.cashier_name || 'Admin'}</span>
          </div>
        </div>

        {/* Items Listing */}
        <div className="border-t border-b border-dashed border-gray-400 py-2 text-[9px]">
          <div className="grid grid-cols-4 font-bold border-b border-dashed border-gray-300 pb-1 mb-1">
            <span className="col-span-2">Item Description</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
          </div>
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-4 text-gray-700">
                <span className="col-span-2">{item.menu_item_name}</span>
                <span className="text-center">{item.quantity}</span>
                <span className="text-right">${(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="space-y-1 text-[9px] text-gray-700 pt-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>CGST (2.5%):</span>
            <span>${cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST (2.5%):</span>
            <span>${sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge (10%):</span>
            <span>${(Number(invoice.subtotal) * 0.1).toFixed(2)}</span>
          </div>
          {Number(invoice.discount) > 0 && (
            <div className="flex justify-between text-green-700 font-bold">
              <span>Discount Applied:</span>
              <span>-${Number(invoice.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-[11px] text-black border-t border-dashed border-gray-400 pt-1.5">
            <span>Grand Total:</span>
            <span>${Number(invoice.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer Payment Ref */}
        <div className="text-center text-[8px] text-gray-500 pt-1 border-t border-dashed border-gray-300">
          <p className="uppercase">Ref: {invoice.transaction_id || 'N/A'}</p>
          <p className="font-bold mt-1">Scan QR code at checkout to verify receipt authenticity.</p>
        </div>
      </GlassCard>

      {/* Control Actions buttons */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <SecondaryButton onClick={() => onPrint(invoice.id)} className="flex items-center justify-center gap-1">
          <Printer size={12} />
          Print
        </SecondaryButton>
        <SecondaryButton onClick={() => onDownloadPDF(invoice.id)} className="flex items-center justify-center gap-1">
          <Download size={12} />
          Download
        </SecondaryButton>
        <SecondaryButton onClick={() => onEmailInvoice(invoice.id)} className="flex items-center justify-center gap-1">
          <Mail size={12} />
          Email
        </SecondaryButton>
      </div>
    </div>
  );
};

export default InvoicePreview;
