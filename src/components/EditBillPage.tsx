import React, { useState, useEffect } from 'react';
import { Search, Save, Trash2, MessageCircle, Smartphone, Share2 } from 'lucide-react';

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

interface Customer {
  name: string;
  phone: string;
  balance: number;
}

interface Product {
  id: number;
  name: string;
}

interface EditBillPageProps {
  bills: Bill[];
  customers: Customer[];
  products: Product[];
  onUpdateBill: (bill: Bill) => Promise<void>;
  onDeleteBill: (billId: number) => Promise<void>;
}

const EditBillPage: React.FC<EditBillPageProps> = ({
  bills,
  customers,
  products,
  onUpdateBill,
  onDeleteBill
}) => {
  const [searchBillNumber, setSearchBillNumber] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editItems, setEditItems] = useState<BillItem[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // Search for bill by bill number
  const handleSearchBill = () => {
    const foundBill = bills.find(bill => 
      bill.billNumber && bill.billNumber.toLowerCase() === searchBillNumber.toLowerCase()
    );
    
    if (foundBill) {
      setSelectedBill(foundBill);
      setEditingBill({ ...foundBill });
      setEditItems([...foundBill.items]);
    } else {
      alert('Bill not found');
      setSelectedBill(null);
      setEditingBill(null);
    }
  };

  // Calculate amount for each item
  const calculateAmount = (weight: string, rate: string) => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(rate) || 0;
    return w * r;
  };

  // Recalculate totals when items change
  const recalculateTotals = (items: BillItem[], paidAmount: number) => {
    const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const balanceAmount = itemsTotal - paidAmount;
    return { itemsTotal, balanceAmount };
  };

  // Handle item changes with automatic calculation
  const handleItemChange = (index: number, field: keyof BillItem, value: string) => {
    const newItems = [...editItems];
    (newItems[index] as any)[field] = value;
    
    if (field === 'weight' || field === 'rate') {
      newItems[index].amount = calculateAmount(newItems[index].weight, newItems[index].rate);
    }
    
    setEditItems(newItems);
    
    // Update the editing bill with new totals
    if (editingBill) {
      const { itemsTotal, balanceAmount } = recalculateTotals(newItems, editingBill.paidAmount);
      
      setEditingBill({
        ...editingBill,
        items: newItems,
        totalAmount: itemsTotal,
        balanceAmount: balanceAmount
      });
    }
  };

  // Add new item row
  const addNewItem = () => {
    const newItem: BillItem = {
      no: editItems.length + 1,
      item: '',
      weight: '',
      rate: '',
      amount: 0
    };
    const newItems = [...editItems, newItem];
    setEditItems(newItems);

    // Update totals
    if (editingBill) {
      const { itemsTotal, balanceAmount } = recalculateTotals(newItems, editingBill.paidAmount);
      
      setEditingBill({
        ...editingBill,
        items: newItems,
        totalAmount: itemsTotal,
        balanceAmount: balanceAmount
      });
    }
  };

  // Remove item row
  const removeItem = (index: number) => {
    const newItems = editItems.filter((_, i) => i !== index);
    // Renumber items
    const renumberedItems = newItems.map((item, i) => ({ ...item, no: i + 1 }));
    setEditItems(renumberedItems);
    
    // Update the editing bill with new totals
    if (editingBill) {
      const { itemsTotal, balanceAmount } = recalculateTotals(renumberedItems, editingBill.paidAmount);
      
      setEditingBill({
        ...editingBill,
        items: renumberedItems,
        totalAmount: itemsTotal,
        balanceAmount: balanceAmount
      });
    }
  };

  // Handle payment amount change with automatic balance calculation
  const handlePaymentAmountChange = (value: string) => {
    if (editingBill) {
      const paidAmount = parseFloat(value) || 0;
      const { itemsTotal, balanceAmount } = recalculateTotals(editingBill.items, paidAmount);
      
      setEditingBill({
        ...editingBill,
        paidAmount,
        balanceAmount: balanceAmount
      });
    }
  };

  // Save bill
  const handleSaveBill = async () => {
    if (editingBill) {
      try {
        await onUpdateBill(editingBill);
        alert('Bill updated successfully');
        // Refresh the displayed bill
        setSelectedBill(editingBill);
      } catch (error) {
        alert('Error updating bill. Please try again.');
        console.error('Error updating bill:', error);
      }
    }
  };

  // Delete bill
  const handleDeleteBill = async () => {
    if (selectedBill && window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      try {
        await onDeleteBill(selectedBill.id);
        alert('Bill deleted successfully');
        setSelectedBill(null);
        setEditingBill(null);
        setEditItems([]);
        setSearchBillNumber('');
      } catch (error) {
        alert('Error deleting bill. Please try again.');
        console.error('Error deleting bill:', error);
      }
    }
  };

  // Streamlined sharing functions
  const handleWhatsAppShare = (bill: Bill) => {
    const phoneNumber = bill.customerPhone.replace(/\D/g, '');
    const billContent = formatBillContent(bill);
    const encodedMessage = encodeURIComponent(billContent);
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setShowShareModal(false);
  };

  const handleSmsShare = (bill: Bill) => {
    const phoneNumber = bill.customerPhone.replace(/\D/g, '');
    const billContent = formatBillContent(bill);
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(billContent)}`;
    
    const link = document.createElement('a');
    link.href = smsUrl;
    link.click();
    
    setShowShareModal(false);
  };

  // Format bill content for sharing
  const formatBillContent = (bill: Bill) => {
    return `🏪 BILLING SYSTEM
📋 BILL DETAILS
════════════════
🧾 Bill No: ${bill.billNumber || 'N/A'}
📅 Date: ${bill.date}
👤 Customer: ${bill.customer}
📱 Phone: ${bill.customerPhone}

🛒 ITEMS:
${bill.items.map((item, index) => 
  `${index + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
).join('\n')}

💰 BILL SUMMARY:
────────────────
Total Amount: ₹${bill.totalAmount.toFixed(2)}
Paid Amount: ₹${bill.paidAmount.toFixed(2)}
Balance Amount: ₹${bill.balanceAmount.toFixed(2)}
Payment Method: ${bill.paymentMethod?.toUpperCase() || 'CASH'}
${bill.paymentMethod === 'upi' ? `UPI Type: ${bill.upiType}` : ''}
${bill.paymentMethod === 'check' ? `Bank: ${bill.bankName}, Check No: ${bill.checkNumber}` : ''}

Thank you for your business! 🙏`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Edit Bill</h2>
      
      {/* Search Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchBillNumber}
            onChange={(e) => setSearchBillNumber(e.target.value.toUpperCase())}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter 6-character bill number (e.g., ABC123)"
            maxLength={6}
          />
          <button
            onClick={handleSearchBill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bill Edit Section */}
      {editingBill && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Bill No: {editingBill.billNumber} - {editingBill.customer}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share Bill
              </button>
              <button
                onClick={handleSaveBill}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <Save className="inline h-4 w-4 mr-1" />
                Save Changes
              </button>
              <button
                onClick={handleDeleteBill}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                <Trash2 className="inline h-4 w-4 mr-1" />
                Delete Bill
              </button>
            </div>
          </div>

          {/* Bill Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={editingBill.date}
                onChange={(e) => setEditingBill({ ...editingBill, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select
                value={editingBill.customer}
                onChange={(e) => {
                  const selectedCustomer = customers.find(c => c.name === e.target.value);
                  setEditingBill({ 
                    ...editingBill, 
                    customer: e.target.value,
                    customerPhone: selectedCustomer?.phone || editingBill.customerPhone
                  });
                }}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value={editingBill.customer}>{editingBill.customer}</option>
                {customers.filter(c => c.name !== editingBill.customer).map((customer, index) => (
                  <option key={index} value={customer.name}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={editingBill.customerPhone}
                onChange={(e) => setEditingBill({ ...editingBill, customerPhone: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">No</th>
                  <th className="border border-gray-300 p-2 text-left">Item</th>
                  <th className="border border-gray-300 p-2 text-left">Weight (kg)</th>
                  <th className="border border-gray-300 p-2 text-left">Rate (₹/kg)</th>
                  <th className="border border-gray-300 p-2 text-left">Amount (₹)</th>
                  <th className="border border-gray-300 p-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {editItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-center">{item.no}</td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={item.item}
                        onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                        className="w-full p-1 border border-gray-200 rounded"
                      >
                        <option value="">Select Item</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.name}>{product.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={item.weight}
                        onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                        className="w-full p-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className="w-full p-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-medium">
                      ₹{item.amount.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <button
                        onClick={() => removeItem(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addNewItem}
            className="mb-4 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Add Item
          </button>

          {/* Payment Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                value={editingBill.paidAmount}
                onChange={(e) => handlePaymentAmountChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select
                value={editingBill.paymentMethod}
                onChange={(e) => setEditingBill({ 
                  ...editingBill, 
                  paymentMethod: e.target.value as 'cash' | 'upi' | 'check' | 'cash_gpay' 
                })}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="check">Check/DD</option>
                <option value="cash_gpay">Cash + GPay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <div className="p-2 bg-gray-100 rounded font-medium">
                ₹{editingBill.totalAmount.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Balance Amount</label>
              <div className="p-2 bg-gray-100 rounded font-medium text-red-600">
                ₹{editingBill.balanceAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Additional payment method fields */}
          {editingBill.paymentMethod === 'upi' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">UPI Type</label>
              <input
                type="text"
                value={editingBill.upiType || ''}
                onChange={(e) => setEditingBill({ ...editingBill, upiType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="GPay, PhonePe, Paytm, etc."
              />
            </div>
          )}

          {editingBill.paymentMethod === 'check' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editingBill.bankName || ''}
                  onChange={(e) => setEditingBill({ ...editingBill, bankName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Bank Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check/DD Number</label>
                <input
                  type="text"
                  value={editingBill.checkNumber || ''}
                  onChange={(e) => setEditingBill({ ...editingBill, checkNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Check/DD Number"
                />
              </div>
            </div>
          )}

          {editingBill.paymentMethod === 'cash_gpay' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cash Amount</label>
                <input
                  type="number"
                  value={editingBill.cashAmount || ''}
                  onChange={(e) => setEditingBill({ ...editingBill, cashAmount: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Cash Amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GPay Amount</label>
                <input
                  type="number"
                  value={editingBill.gpayAmount || ''}
                  onChange={(e) => setEditingBill({ ...editingBill, gpayAmount: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="GPay Amount"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Bill</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Send bill to {editingBill.customer} ({editingBill.customerPhone})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleWhatsAppShare(editingBill)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => handleSmsShare(editingBill)}
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Smartphone className="h-5 w-5" />
                <span>SMS</span>
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">Bill Preview:</p>
              <div className="bg-white border border-gray-200 rounded p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
                  {formatBillContent(editingBill).substring(0, 200)}...
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBillPage;
