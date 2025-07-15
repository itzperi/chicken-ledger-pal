import React, { useState } from 'react';
import { Edit, Save, X, Printer, MessageCircle, Download } from 'lucide-react';

interface BillItem {
  no: number;
  item: string;
  weight: string;
  rate: string;
  amount: number;
}

interface Bill {
  id: number;
  billNumber?: string;
  customer: string;
  customerPhone: string;
  date: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'cash' | 'upi' | 'check' | 'cash_gpay';
  upiType?: string;
  bankName?: string;
  checkNumber?: string;
  cashAmount?: number;
  gpayAmount?: number;
  timestamp: Date;
}

interface EditableBillHistoryProps {
  customerHistory: Bill[];
  customerName: string;
  onUpdateBill?: (billId: number, updatedBill: Partial<Bill>) => void;
}

const EditableBillHistory: React.FC<EditableBillHistoryProps> = ({ 
  customerHistory, 
  customerName,
  onUpdateBill 
}) => {
  const [editingBill, setEditingBill] = useState<number | null>(null);
  const [editedBill, setEditedBill] = useState<Bill | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const startEditing = (bill: Bill) => {
    setEditingBill(bill.id);
    setEditedBill({ ...bill });
  };

  const cancelEditing = () => {
    setEditingBill(null);
    setEditedBill(null);
  };

  const saveChanges = () => {
    if (editedBill && onUpdateBill) {
      // Recalculate total amount
      const newTotal = editedBill.items.reduce((sum, item) => sum + item.amount, 0);
      const updatedBill = {
        ...editedBill,
        totalAmount: newTotal,
        balanceAmount: newTotal - editedBill.paidAmount
      };
      onUpdateBill(editedBill.id, updatedBill);
    }
    setEditingBill(null);
    setEditedBill(null);
  };

  const updateItem = (itemIndex: number, field: keyof BillItem, value: string) => {
    if (!editedBill) return;
    
    const newItems = [...editedBill.items];
    (newItems[itemIndex] as any)[field] = value;
    
    if (field === 'weight' || field === 'rate') {
      const weight = parseFloat(newItems[itemIndex].weight) || 0;
      const rate = parseFloat(newItems[itemIndex].rate) || 0;
      newItems[itemIndex].amount = weight * rate;
    }
    
    setEditedBill({ ...editedBill, items: newItems });
  };

  const generateHistoryContent = (bills: Bill[]) => {
    return `
BILLING SYSTEM - CUSTOMER HISTORY
==================================
Customer: ${customerName}

PURCHASE HISTORY:
================
${bills.map((bill, index) => {
  const currentItemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
  
  return `
Bill No: ${bill.billNumber || 'N/A'} - Date: ${formatDate(bill.date)}
${bill.items.map(item => 
  `• ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
).join('\n')}
Current Items: ₹${currentItemsTotal.toFixed(2)}
Paid: ₹${bill.paidAmount.toFixed(2)}
Balance: ₹${bill.balanceAmount.toFixed(2)}
Payment: ${bill.paymentMethod === 'cash' ? 'Cash' : 
          bill.paymentMethod === 'upi' ? `UPI - ${bill.upiType}` :
          bill.paymentMethod === 'cash_gpay' ? `Cash + GPay` :
          `Check/DD - ${bill.bankName} - ${bill.checkNumber}`}
-----------------------------------
`;
}).join('')}

Thank you for your business!
    `.trim();
  };

  const printHistory = () => {
    const content = generateHistoryContent(customerHistory);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>History - ${customerName}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadHistory = () => {
    const content = generateHistoryContent(customerHistory);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `History_${customerName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendToWhatsApp = () => {
    const content = generateHistoryContent(customerHistory);
    const encodedMessage = encodeURIComponent(content);
    const phoneNumber = customerHistory[0]?.customerPhone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (customerHistory.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold">History of {customerName}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={printHistory}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Printer className="inline mr-1 h-4 w-4" />
            Print
          </button>
          <button
            onClick={sendToWhatsApp}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <MessageCircle className="inline mr-1 h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={downloadHistory}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            <Download className="inline mr-1 h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-3 text-left">Date</th>
              <th className="border border-gray-300 p-3 text-left">Bill No</th>
              <th className="border border-gray-300 p-3 text-left">Items</th>
              <th className="border border-gray-300 p-3 text-left">Purchase</th>
              <th className="border border-gray-300 p-3 text-left">Paid</th>
              <th className="border border-gray-300 p-3 text-left">Balance</th>
              <th className="border border-gray-300 p-3 text-left">Payment Method</th>
              <th className="border border-gray-300 p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customerHistory.map((bill) => (
              <tr key={bill.id}>
                <td className="border border-gray-300 p-3">
                  {editingBill === bill.id ? (
                    <input
                      type="date"
                      value={editedBill?.date || ''}
                      onChange={(e) => setEditedBill(prev => prev ? {...prev, date: e.target.value} : null)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    formatDate(bill.date)
                  )}
                </td>
                <td className="border border-gray-300 p-3">
                  {editingBill === bill.id ? (
                    <input
                      type="text"
                      value={editedBill?.billNumber || ''}
                      onChange={(e) => setEditedBill(prev => prev ? {...prev, billNumber: e.target.value} : null)}
                      className="w-full p-1 border rounded font-mono"
                      placeholder="Bill Number"
                    />
                  ) : (
                    <span className="font-mono">{bill.billNumber || 'N/A'}</span>
                  )}
                </td>
                <td className="border border-gray-300 p-3">
                  {editingBill === bill.id ? (
                    <div className="space-y-2">
                      {editedBill?.items.map((item, i) => (
                        <div key={i} className="grid grid-cols-4 gap-1 text-xs">
                          <input
                            value={item.item}
                            onChange={(e) => updateItem(i, 'item', e.target.value)}
                            className="p-1 border rounded"
                            placeholder="Item"
                          />
                          <input
                            value={item.weight}
                            onChange={(e) => updateItem(i, 'weight', e.target.value)}
                            className="p-1 border rounded"
                            placeholder="Weight"
                          />
                          <input
                            value={item.rate}
                            onChange={(e) => updateItem(i, 'rate', e.target.value)}
                            className="p-1 border rounded"
                            placeholder="Rate"
                          />
                          <span className="p-1">₹{item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    bill.items.map((item, i) => (
                      <div key={i} className="text-sm">
                        {item.item} - {item.weight}kg @ ₹{item.rate}
                      </div>
                    ))
                  )}
                </td>
                <td className="border border-gray-300 p-3">
                  ₹{(editingBill === bill.id && editedBill ? 
                    editedBill.items.reduce((sum, item) => sum + item.amount, 0) : 
                    bill.items.reduce((sum, item) => {
                      const weight = parseFloat(item.weight) || 0;
                      const rate = parseFloat(item.rate) || 0;
                      return sum + (weight * rate);
                    }, 0)
                  ).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-3">
                  {editingBill === bill.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedBill?.paidAmount || 0}
                      onChange={(e) => setEditedBill(prev => prev ? {...prev, paidAmount: parseFloat(e.target.value)} : null)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    `₹${bill.paidAmount.toFixed(2)}`
                  )}
                </td>
                <td className="border border-gray-300 p-3 text-red-600 text-2xl font-bold">
                  ₹{(() => {
                    if (editingBill === bill.id && editedBill) {
                      // For editing mode, calculate running total up to this bill
                      const billIndex = customerHistory.findIndex(b => b.id === bill.id);
                      const billsUpToHere = customerHistory.slice(0, billIndex);
                      const previousBalance = billsUpToHere.reduce((sum, b) => sum + b.balanceAmount, 0);
                      const currentBillBalance = editedBill.items.reduce((sum, item) => sum + item.amount, 0) - editedBill.paidAmount;
                      return (previousBalance + currentBillBalance).toFixed(2);
                    } else {
                      // Calculate running total of unpaid amounts up to this bill
                      const billIndex = customerHistory.findIndex(b => b.id === bill.id);
                      const billsUpToHere = customerHistory.slice(0, billIndex + 1);
                      return billsUpToHere.reduce((sum, b) => sum + b.balanceAmount, 0).toFixed(2);
                    }
                  })()}
                </td>
                <td className="border border-gray-300 p-3">
                  {editingBill === bill.id ? (
                    <select
                      value={editedBill?.paymentMethod || 'cash'}
                      onChange={(e) => setEditedBill(prev => prev ? {...prev, paymentMethod: e.target.value as 'cash' | 'upi' | 'check' | 'cash_gpay'} : null)}
                      className="w-full p-1 border rounded"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="check">Check/DD</option>
                      <option value="cash_gpay">Cash + GPay</option>
                    </select>
                  ) : (
                    bill.paymentMethod === 'cash' ? 'Cash' : 
                    bill.paymentMethod === 'upi' ? `UPI - ${bill.upiType}` :
                    bill.paymentMethod === 'cash_gpay' ? 'Cash + GPay' :
                    `Check/DD - ${bill.bankName} - ${bill.checkNumber}`
                  )}
                </td>
                <td className="border border-gray-300 p-3">
                  {editingBill === bill.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={saveChanges}
                        className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(bill)}
                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EditableBillHistory;
