
import React, { useState } from 'react';
import { Search, Calendar, Download, Printer, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface EnhancedBillHistoryProps {
  bills: Bill[];
  customers: Customer[];
  onUpdateBill: (bill: Bill) => Promise<void>;
  onDeleteBill: (billId: number) => Promise<void>;
}

const EnhancedBillHistory: React.FC<EnhancedBillHistoryProps> = ({
  bills,
  customers,
  onUpdateBill,
  onDeleteBill
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Format date to DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Get history for selected date
  const handleGetHistory = () => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    const filtered = bills.filter(bill => bill.date === selectedDate);
    setFilteredBills(filtered);
    setShowHistory(true);
  };

  // Print history
  const handlePrintHistory = () => {
    const printContent = generateHistoryContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill History - ${formatDate(selectedDate)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .bill { border: 1px solid #ccc; margin: 10px 0; padding: 10px; }
              .items { margin: 10px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate WhatsApp message
  const handleWhatsAppHistory = () => {
    const historyContent = generateHistoryContent(true);
    const encodedMessage = encodeURIComponent(historyContent);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Download history as JSON
  const handleDownloadHistory = () => {
    const historyData = {
      date: selectedDate,
      formattedDate: formatDate(selectedDate),
      totalBills: filteredBills.length,
      totalAmount: filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalPaid: filteredBills.reduce((sum, bill) => sum + bill.paidAmount, 0),
      totalBalance: filteredBills.reduce((sum, bill) => sum + bill.balanceAmount, 0),
      bills: filteredBills,
      generatedOn: new Date().toLocaleString()
    };

    const dataStr = JSON.stringify(historyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bill_history_${selectedDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate history content for print/WhatsApp
  const generateHistoryContent = (forWhatsApp = false) => {
    const lineBreak = forWhatsApp ? '\n' : '<br>';
    const separator = forWhatsApp ? '================================' : '<hr>';
    
    let content = `SANTHOSH CHICKEN - BILLING SYSTEM${lineBreak}`;
    content += `Bill History for ${formatDate(selectedDate)}${lineBreak}`;
    content += `${separator}${lineBreak}`;
    content += `Total Bills: ${filteredBills.length}${lineBreak}`;
    content += `Total Amount: ₹${filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}${lineBreak}`;
    content += `Total Paid: ₹${filteredBills.reduce((sum, bill) => sum + bill.paidAmount, 0).toFixed(2)}${lineBreak}`;
    content += `Total Balance: ₹${filteredBills.reduce((sum, bill) => sum + bill.balanceAmount, 0).toFixed(2)}${lineBreak}`;
    content += `${separator}${lineBreak}`;

    filteredBills.forEach((bill, index) => {
      content += `${lineBreak}BILL ${index + 1}:${lineBreak}`;
      content += `Bill No: ${bill.billNumber || 'N/A'}${lineBreak}`;
      content += `Customer: ${bill.customer}${lineBreak}`;
      content += `Phone: ${bill.customerPhone}${lineBreak}`;
      content += `${lineBreak}ITEMS:${lineBreak}`;
      
      bill.items.forEach((item, itemIndex) => {
        content += `${itemIndex + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}${lineBreak}`;
      });
      
      content += `${lineBreak}Total: ₹${bill.totalAmount.toFixed(2)}${lineBreak}`;
      content += `Paid: ₹${bill.paidAmount.toFixed(2)}${lineBreak}`;
      content += `Balance: ₹${bill.balanceAmount.toFixed(2)}${lineBreak}`;
      content += `Payment: ${bill.paymentMethod.toUpperCase()}${lineBreak}`;
      content += `--------------------------------${lineBreak}`;
    });

    return content;
  };

  // Send individual bill to WhatsApp
  const sendBillToWhatsApp = (bill: Bill) => {
    const billContent = `
SANTHOSH CHICKEN - BILLING SYSTEM
================================
Bill No: ${bill.billNumber || 'N/A'}
Date: ${formatDate(bill.date)}
Customer: ${bill.customer}
Phone: ${bill.customerPhone}

ITEMS:
------
${bill.items.map((item, index) => 
  `${index + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
).join('\n')}

--------------------------------
Total Bill Amount: ₹${bill.totalAmount.toFixed(2)}
Paid Amount: ₹${bill.paidAmount.toFixed(2)}
Balance Amount: ₹${bill.balanceAmount.toFixed(2)}
Payment Method: ${bill.paymentMethod.toUpperCase()}
${bill.paymentMethod === 'upi' ? `UPI Type: ${bill.upiType}` : ''}
${bill.paymentMethod === 'check' ? `Bank: ${bill.bankName}, Check No: ${bill.checkNumber}` : ''}
================================

Thank you for your business!
    `.trim();

    const encodedMessage = encodeURIComponent(billContent);
    const phoneNumber = bill.customerPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Balance & History</h2>
      
      {/* Date Selection */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="historyDate">Select Date</Label>
            <Input
              type="date"
              id="historyDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleGetHistory} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Get History
          </Button>
        </div>
      </div>

      {/* History Results */}
      {showHistory && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              History for {formatDate(selectedDate)} ({filteredBills.length} bills)
            </h3>
            <div className="flex gap-2">
              <Button onClick={handlePrintHistory} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleWhatsAppHistory} variant="outline" size="sm" className="bg-green-50">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={handleDownloadHistory} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h4 className="font-medium text-blue-700">Total Bills</h4>
              <p className="text-2xl font-bold text-blue-600">{filteredBills.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h4 className="font-medium text-green-700">Total Amount</h4>
              <p className="text-2xl font-bold text-green-600">
                ₹{filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <h4 className="font-medium text-yellow-700">Total Paid</h4>
              <p className="text-2xl font-bold text-yellow-600">
                ₹{filteredBills.reduce((sum, bill) => sum + bill.paidAmount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <h4 className="font-medium text-red-700">Total Balance</h4>
              <p className="text-2xl font-bold text-red-600">
                ₹{filteredBills.reduce((sum, bill) => sum + bill.balanceAmount, 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Bills List */}
          <div className="space-y-4">
            {filteredBills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bills found for the selected date.
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">
                        Bill #{bill.billNumber} - {bill.customer}
                      </h4>
                      <p className="text-sm text-gray-600">Phone: {bill.customerPhone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => sendBillToWhatsApp(bill)}
                        size="sm"
                        variant="outline"
                        className="bg-green-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Items */}
                  <div className="mb-3">
                    <h5 className="font-medium mb-2">Items:</h5>
                    <div className="space-y-1">
                      {bill.items.map((item, index) => (
                        <div key={index} className="text-sm flex justify-between">
                          <span>{item.item} ({item.weight}kg @ ₹{item.rate}/kg)</span>
                          <span>₹{item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Totals */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total Amount:</span>
                      <span className="font-medium">₹{bill.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid Amount:</span>
                      <span className="font-medium">₹{bill.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Balance Amount:</span>
                      <span className={`font-medium ${bill.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{bill.balanceAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Payment Method:</span>
                      <span className="font-medium capitalize">{bill.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBillHistory;
