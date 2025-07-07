import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Calculator, Check, X, Users, History, Printer, FileText, MessageCircle, Calendar, LogOut, Package, BarChart3, Truck } from 'lucide-react';
import Login from '../components/Login';
import CustomerManager from '../components/CustomerManager';
import Products from '../components/Products';
import SalesDashboard from '../components/SalesDashboard';
import EditBillPage from '../components/EditBillPage';
import LoadManager from '../components/LoadManager';
import { useSupabaseData } from '../hooks/useSupabaseData';

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

type UserType = 'owner' | 'staff';
type BusinessId = 'santhosh1' | 'santhosh2';

const Index = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType>('staff');
  const [businessId, setBusinessId] = useState<BusinessId>('santhosh1');

  // Supabase data hook
  const {
    products,
    customers,
    bills,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    updateCustomerBalance,
    deleteCustomer,
    addBill,
    updateBill,
    deleteBill,
    getLatestBalanceByPhone
  } = useSupabaseData(isLoggedIn ? businessId : '');

  // State management
  const [currentView, setCurrentView] = useState('billing');
  const [suppliers, setSuppliers] = useState(['Mahi poultry services', 'Pragathi broiler farms']);
  
  // Billing form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');
  const [customerInput, setCustomerInput] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([
    { no: 1, item: '', weight: '', rate: '', amount: 0 }
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);

  // Updated payment method state with cash+gpay option
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'check' | 'cash_gpay'>('cash');
  const [upiType, setUpiType] = useState('');
  const [bankName, setBankName] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [gpayAmount, setGpayAmount] = useState('');

  // Add supplier state
  const [newSupplierName, setNewSupplierName] = useState('');

  // Balance tracking state
  const [balanceCustomer, setBalanceCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerHistory, setCustomerHistory] = useState<Bill[]>([]);
  const [addBalanceCustomer, setAddBalanceCustomer] = useState('');
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  
  // Running balance state - Previous balance from last bill
  const [previousBalance, setPreviousBalance] = useState(0);

  // Refs
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Additional state for bill confirmation - Updated to handle both scenarios
  const [showBillActions, setShowBillActions] = useState(false);
  const [confirmedBill, setConfirmedBill] = useState<Bill | null>(null);
  const [isBalanceOnlyBill, setIsBalanceOnlyBill] = useState(false);

  // Filter customers based on input
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerInput.toLowerCase())
  );

  // Calculate amount for each item
  const calculateAmount = (weight: string, rate: string) => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(rate) || 0;
    return w * r;
  };

  // Update total amount
  useEffect(() => {
    const total = billItems.reduce((sum, item) => sum + item.amount, 0);
    setTotalAmount(total);
  }, [billItems]);

  // Handle login
  const handleLogin = (type: UserType, id: BusinessId) => {
    setUserType(type);
    setBusinessId(id);
    setIsLoggedIn(true);
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('billing');
    resetForm();
  };

  // Handle customer selection - UPDATED to fetch previous balance using phone number
  const handleCustomerSelect = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    const customerPhone = customer?.phone || '';
    
    setSelectedCustomer(customerName);
    setSelectedCustomerPhone(customerPhone);
    setCustomerInput(customerName);
    setShowCustomerSuggestions(false);
    
    // Get latest balance using phone number (more reliable than name)
    if (customerPhone) {
      const latestBalance = getLatestBalanceByPhone(customerPhone);
      setPreviousBalance(latestBalance);
    } else {
      setPreviousBalance(0);
    }
  };

  // Handle manual phone entry to auto-fill previous balance
  const handlePhoneChange = (phone: string) => {
    setSelectedCustomerPhone(phone);
    
    // Auto-fill previous balance when phone is entered
    if (phone.length >= 10) { // Valid phone number length
      const latestBalance = getLatestBalanceByPhone(phone);
      setPreviousBalance(latestBalance);
      
      // Try to find existing customer name for this phone
      const existingCustomer = customers.find(c => c.phone === phone);
      if (existingCustomer && !selectedCustomer) {
        setSelectedCustomer(existingCustomer.name);
        setCustomerInput(existingCustomer.name);
      }
    }
  };

  // Handle bill item changes with default item selection - UPDATED to use Chicken Live as default
  const handleItemChange = (index: number, field: keyof BillItem, value: string) => {
    const newItems = [...billItems];
    (newItems[index] as any)[field] = value;
    
    if (field === 'weight' || field === 'rate') {
      newItems[index].amount = calculateAmount(newItems[index].weight, newItems[index].rate);
    }
    
    setBillItems(newItems);
    
    // Add new row if this is the last row and has content
    if (index === billItems.length - 1 && billItems.length < 10 && 
        (newItems[index].item || newItems[index].weight || newItems[index].rate)) {
      // Default to "Chicken Live" for new rows
      const chickenLiveProduct = products.find(p => p.name.toLowerCase().includes('chicken live')) || 
                                products.find(p => p.name.toLowerCase().includes('live')) ||
                                products[0]; // fallback to first product
      setBillItems([...newItems, { 
        no: newItems.length + 1, 
        item: chickenLiveProduct ? chickenLiveProduct.name : 'Chicken Live', 
        weight: '', 
        rate: '', 
        amount: 0 
      }]);
    }
  };

  // Updated function to show confirmation dialog
  const handleShowConfirmDialog = () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    // Check if it's a balance-only payment or has items
    const validItems = billItems.filter(item => item.item && item.weight && item.rate);
    const existingBalance = customers.find(c => c.name === selectedCustomer)?.balance || 0;
    const hasPaymentAmount = paymentAmount && parseFloat(paymentAmount) > 0;
    
    // Allow balance-only payment if customer has existing balance and payment amount is entered
    if (validItems.length === 0 && existingBalance <= 0 && !hasPaymentAmount) {
      alert('Please add at least one item or enter payment amount for balance payment');
      return;
    }

    // If payment amount is entered, show payment method selection
    if (hasPaymentAmount) {
      setShowConfirmDialog(true);
    } else {
      // No payment amount - direct bill creation for balance
      handleConfirmBillWithoutPayment();
    }
  };

  // Handle bill confirmation without payment (Case 1) - UPDATED with running balance logic
  const handleConfirmBillWithoutPayment = async () => {
    // Calculate current items total
    const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
    const validItems = billItems.filter(item => item.item && item.weight && item.rate);
    
    // Running balance calculation: Total = Previous Balance + Current Items
    const totalBillAmount = previousBalance + itemsTotal;
    const newBalance = totalBillAmount - 0; // No payment, so new balance = total bill amount

    // Create bill record with running balance logic
    const billRecord = {
      customer: selectedCustomer,
      customerPhone: selectedCustomerPhone,
      date: selectedDate,
      items: validItems,
      totalAmount: totalBillAmount, // Previous balance + current items
      paidAmount: 0,
      balanceAmount: newBalance, // Amount to carry forward
      paymentMethod: 'cash' as const,
    };

    // Add to billing history
    const savedBill = await addBill(billRecord);
    
    // Set confirmed bill and show actions
    if (savedBill) {
      setConfirmedBill(savedBill);
      setIsBalanceOnlyBill(true);
      setShowBillActions(true);
      
      // Refresh customer data to show updated balance
      window.location.reload();
    }
  };

  // Handle bill confirmation with payment (Case 2) - UPDATED with running balance logic
  const handleConfirmBill = async () => {
    let paidAmount = 0;
    
    // Calculate paid amount based on payment method
    if (paymentMethod === 'cash_gpay') {
      paidAmount = (parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0);
    } else {
      paidAmount = parseFloat(paymentAmount) || 0;
    }
    
    // Calculate current items total
    const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
    const validItems = billItems.filter(item => item.item && item.weight && item.rate);
    
    // Running balance calculation
    let totalBillAmount, newBalance;
    
    if (validItems.length === 0 && previousBalance > 0) {
      // This is a balance-only payment (no new items, just paying existing balance)
      totalBillAmount = previousBalance; // Total is just the previous balance
      newBalance = previousBalance - paidAmount; // Remaining balance after payment
    } else {
      // Regular bill with items: Total = Previous Balance + Current Items
      totalBillAmount = previousBalance + itemsTotal;
      newBalance = totalBillAmount - paidAmount; // New balance after payment
    }

    // Create bill record with running balance logic
    const billRecord = {
      customer: selectedCustomer,
      customerPhone: selectedCustomerPhone,
      date: selectedDate,
      items: validItems.length > 0 ? validItems : [{ no: 1, item: 'Balance Payment', weight: '1', rate: paidAmount.toString(), amount: paidAmount }],
      totalAmount: totalBillAmount,
      paidAmount,
      balanceAmount: newBalance,
      paymentMethod,
      upiType: paymentMethod === 'upi' ? upiType : undefined,
      bankName: paymentMethod === 'check' ? bankName : undefined,
      checkNumber: paymentMethod === 'check' ? checkNumber : undefined,
      cashAmount: paymentMethod === 'cash_gpay' ? parseFloat(cashAmount) || 0 : undefined,
      gpayAmount: paymentMethod === 'cash_gpay' ? parseFloat(gpayAmount) || 0 : undefined,
    };

    // Add to billing history
    const savedBill = await addBill(billRecord);
    
    // Set confirmed bill and show actions
    if (savedBill) {
      setConfirmedBill(savedBill);
      setIsBalanceOnlyBill(validItems.length === 0);
      setShowBillActions(true);
      
      // Refresh customer data to show updated balance
      window.location.reload();
    }
    setShowConfirmDialog(false);
  };

  // Generate bill content using running balance system
  const generateBillContent = (bill: Bill) => {
    const time = new Date(bill.timestamp).toLocaleTimeString();
    
    // Get previous balance from bill history (not customer table)
    const customerBills = bills.filter(b => b.customer === bill.customer && b.id < bill.id);
    const previousBalance = customerBills.length > 0 
      ? customerBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].balanceAmount || 0
      : 0;
    
    const itemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
    const totalBillAmount = previousBalance + itemsTotal;
    const newBalance = totalBillAmount - bill.paidAmount;
    
    let paymentMethodText = '';
    if (bill.paidAmount > 0) {
      if (bill.paymentMethod === 'cash') {
        paymentMethodText = `\nPayment Method: Cash`;
      } else if (bill.paymentMethod === 'upi') {
        paymentMethodText = `\nPayment Method: UPI - ${bill.upiType}`;
      } else if (bill.paymentMethod === 'check') {
        paymentMethodText = `\nPayment Method: Check/DD - ${bill.bankName} - ${bill.checkNumber}`;
      } else if (bill.paymentMethod === 'cash_gpay') {
        paymentMethodText = `\nPayment Method: Cash: ₹${bill.cashAmount?.toFixed(2) || '0.00'} + GPay: ₹${bill.gpayAmount?.toFixed(2) || '0.00'}`;
      }
    }
    
    return `
SANTHOSH CHICKEN - BILLING SYSTEM
==================================
21 West Cemetery Road
Old Washermanpet
Chennai 21
Phone: 9840217992
WhatsApp: 7200226930
Email: mathangopal5467@yahoo.com

Bill No: ${bill.billNumber || 'N/A'}
Date: ${bill.date}
Time: ${time}
Customer: ${bill.customer}
Phone: ${bill.customerPhone}

ITEMS:
------
${bill.items.map((item, index) => 
  `${index + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
).join('\n')}

--------------------------------
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${itemsTotal.toFixed(2)}
Total Bill Amount: ₹${totalBillAmount.toFixed(2)}
Payment Amount: ₹${bill.paidAmount.toFixed(2)}
New Balance: ₹${newBalance.toFixed(2)}${paymentMethodText}
================================

Thank you for your business!
    `.trim();
  };

  // Print current billing form (frontend view) - UPDATED with running balance system
  const printCurrentBillingForm = () => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    const validItems = billItems.filter(item => item.item && (item.weight || item.rate));
    if (validItems.length === 0) {
      alert('Please add at least one item to print');
      return;
    }

    // Use the previousBalance state (from latest bill) instead of customer table balance
    const itemsTotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    const totalBillAmount = previousBalance + itemsTotal;
    const paidAmount = parseFloat(paymentAmount) || 0;
    const newBalance = totalBillAmount - paidAmount;
    
    const time = new Date().toLocaleTimeString();
    
    const printContent = `
SANTHOSH CHICKEN - BILLING PREVIEW
==================================
21 West Cemetery Road
Old Washermanpet
Chennai 21
Phone: 9840217992
WhatsApp: 7200226930
Email: mathangopal5467@yahoo.com

Date: ${selectedDate}
Time: ${time}
Customer: ${selectedCustomer}
Phone: ${selectedCustomerPhone}

ITEMS:
------
${validItems.map((item, index) => 
  `${index + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
).join('\n')}

--------------------------------
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${itemsTotal.toFixed(2)}
Total Bill Amount: ₹${totalBillAmount.toFixed(2)}
Payment Amount: ₹${paidAmount.toFixed(2)}
New Balance: ₹${newBalance.toFixed(2)}
================================

** BILLING PREVIEW - NOT CONFIRMED **
Use "Confirm Bill" to save this bill.
    `.trim();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Billing Preview - ${selectedCustomer}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                padding: 20px; 
                line-height: 1.4;
                background: white;
              }
              pre { 
                white-space: pre-wrap; 
                font-size: 12px;
                margin: 0;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                pre { font-size: 11px; }
              }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Print to printer (for confirmed bills)
  const printBill = (bill: Bill) => {
    const printContent = generateBillContent(bill);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${bill.customer}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                padding: 20px; 
                line-height: 1.4;
                background: white;
              }
              pre { 
                white-space: pre-wrap; 
                font-size: 12px;
                margin: 0;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                pre { font-size: 11px; }
              }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Save as document
  const saveAsDocument = (bill: Bill) => {
    const billContent = generateBillContent(bill);
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${bill.customer}_${bill.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send to WhatsApp
  const sendToWhatsApp = (bill: Bill) => {
    const billContent = generateBillContent(bill);
    const encodedMessage = encodeURIComponent(billContent);
    const phoneNumber = bill.customerPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // New function to handle "Bill for Next Customer"
  const handleNextCustomer = () => {
    setShowBillActions(false);
    setConfirmedBill(null);
    setIsBalanceOnlyBill(false);
    resetForm();
    if (customerInputRef.current) {
      customerInputRef.current.focus();
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    // Clear form and focus on customer input
    resetForm();
    if (customerInputRef.current) {
      customerInputRef.current.focus();
    }
  };

  // Reset form with default item - UPDATED to clear cash/gpay amounts and reset previous balance
  const resetForm = () => {
    setSelectedCustomer('');
    setSelectedCustomerPhone('');
    setCustomerInput('');
    setPreviousBalance(0); // Reset previous balance
    // Default to "Chicken Live" instead of empty
    const chickenLiveProduct = products.find(p => p.name.toLowerCase().includes('chicken live')) || 
                              products.find(p => p.name.toLowerCase().includes('live')) ||
                              products[0]; // fallback to first product
    setBillItems([{ 
      no: 1, 
      item: chickenLiveProduct ? chickenLiveProduct.name : 'Chicken Live', 
      weight: '', 
      rate: '', 
      amount: 0 
    }]);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setUpiType('');
    setBankName('');
    setCheckNumber('');
    setCashAmount('');
    setGpayAmount('');
    setCurrentBill(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Add new supplier
  const addSupplier = () => {
    if (newSupplierName.trim() && !suppliers.includes(newSupplierName.trim())) {
      setSuppliers(prev => [...prev, newSupplierName.trim()]);
      setNewSupplierName('');
      alert('Supplier added successfully!');
    }
  };

  // Get customer history
  const getCustomerHistory = () => {
    if (!balanceCustomer) return;
    
    let filteredHistory = bills.filter(bill => bill.customer === balanceCustomer);
    
    if (startDate && endDate) {
      filteredHistory = filteredHistory.filter(bill => 
        bill.date >= startDate && bill.date <= endDate
      );
    }
    
    setCustomerHistory(filteredHistory);
  };

  // Add balance to customer
  const handleAddBalance = async () => {
    if (!addBalanceCustomer || !addBalanceAmount) {
      alert('Please select customer and enter amount');
      return;
    }

    const amount = parseFloat(addBalanceAmount);
    const customer = customers.find(c => c.name === addBalanceCustomer);
    if (customer) {
      const newBalance = customer.balance + amount;
      await updateCustomerBalance(addBalanceCustomer, newBalance);
    }
    
    setAddBalanceCustomer('');
    setAddBalanceAmount('');
    alert(`Balance added successfully!`);
  };

  // Get customer balance and history for display - uses database balance
  const getCustomerBalance = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    return customer?.balance || 0;
  };

  // Get last billed date for a customer
  const getLastBilledDate = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    if (customer?.phone) {
      const customerBills = bills.filter(bill => bill.customerPhone === customer.phone);
      if (customerBills.length > 0) {
        const latestBill = customerBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return latestBill.date;
      }
    }
    return null;
  };

  const getCustomerTransactionHistory = (customerName: string) => {
    return bills.filter(bill => bill.customer === customerName);
  };

  // Format date to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Generate history content for printing/sharing
  const generateHistoryContent = (bills: Bill[], customerName: string) => {
    const totalAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const totalBalance = bills.reduce((sum, bill) => sum + bill.balanceAmount, 0);

    return `
SANTHOSH CHICKEN - CUSTOMER HISTORY
==================================
Customer: ${customerName}

PURCHASE HISTORY:
================
${bills.map((bill, index) => {
  // Calculate previous balance for this bill
  const previousBills = bills.filter(b => b.id < bill.id);
  const previousBalance = previousBills.reduce((sum, b) => sum + b.balanceAmount, 0);
  const currentItemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
  const totalBillAmount = previousBalance + currentItemsTotal;
  
  return `
Bill No: ${bill.billNumber || 'N/A'} - Date: ${formatDate(bill.date)}
${bill.items.map(item => 
  `• ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}`
).join('\n')}
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${currentItemsTotal.toFixed(2)}
Total: ₹${totalBillAmount.toFixed(2)}
Paid: ₹${bill.paidAmount.toFixed(2)}
Balance: ₹${bill.balanceAmount.toFixed(2)}
Payment: ${bill.paymentMethod === 'cash' ? 'Cash' : 
          bill.paymentMethod === 'upi' ? `UPI - ${bill.upiType}` :
          bill.paymentMethod === 'cash_gpay' ? `Cash + GPay` :
          `Check/DD - ${bill.bankName} - ${bill.checkNumber}`}
-----------------------------------
`;
}).join('')}

SUMMARY:
========
Total Amount: ₹${totalAmount.toFixed(2)}
Total Paid: ₹${totalPaid.toFixed(2)}
Total Balance: ₹${totalBalance.toFixed(2)}

==================================
Thank you for your business!
    `.trim();
  };

  // Print history
  const printHistory = () => {
    if (customerHistory.length === 0) return;
    
    const content = generateHistoryContent(customerHistory, balanceCustomer);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>History - ${balanceCustomer}</title>
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

  // Download history
  const downloadHistory = () => {
    if (customerHistory.length === 0) return;
    
    const content = generateHistoryContent(customerHistory, balanceCustomer);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `History_${balanceCustomer}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send history to WhatsApp
  const sendHistoryToWhatsApp = () => {
    if (customerHistory.length === 0) return;
    
    const content = generateHistoryContent(customerHistory, balanceCustomer);
    const encodedMessage = encodeURIComponent(content);
    const phoneNumber = customerHistory[0]?.customerPhone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Initialize form with default item on component mount
  useEffect(() => {
    if (products.length > 0 && billItems.length === 1 && !billItems[0].item) {
      const chickenLiveProduct = products.find(p => p.name.toLowerCase().includes('chicken live')) || 
                                products.find(p => p.name.toLowerCase().includes('live')) ||
                                products[0];
      if (chickenLiveProduct) {
        setBillItems([{ 
          no: 1, 
          item: chickenLiveProduct.name, 
          weight: '', 
          rate: '', 
          amount: 0 
        }]);
      }
    }
  }, [products]);

  // Manual balance update function
  const updateCustomerBalanceManually = async () => {
    if (!selectedCustomer) return;
    
    const customer = customers.find(c => c.name === selectedCustomer);
    const existingBalance = customer ? customer.balance : 0;
    const itemsTotal = billItems.filter(item => item.item && item.weight && item.rate).reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = parseFloat(paymentAmount) || 0;
    
    // Calculate new balance: Previous balance + Current purchase - Payment
    const newBalance = existingBalance + itemsTotal - paidAmount;
    
    // Update customer balance
    await updateCustomerBalance(selectedCustomer, newBalance);
    
    alert(`Customer balance updated successfully!\nPrevious Balance: ₹${existingBalance.toFixed(2)}\nNew Items: ₹${itemsTotal.toFixed(2)}\nPayment: ₹${paidAmount.toFixed(2)}\nNew Balance: ₹${newBalance.toFixed(2)}`);
  };

  // Generate comprehensive customer data for download
  const generateCustomerData = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    const customerBills = bills.filter(bill => bill.customer === customerName);
    
    if (!customer) {
      alert('Customer not found');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    let content = `SANTHOSH CHICKEN - CUSTOMER DATA REPORT
================================================
Generated on: ${currentDate} at ${currentTime}
Business: ${businessId === 'santhosh1' ? 'Santhosh Chicken 1' : 'Santhosh Chicken 2'}

CUSTOMER INFORMATION:
====================
Name: ${customer.name}
Phone: ${customer.phone}
Current Balance: ₹${customer.balance.toFixed(2)}

BILLING HISTORY:
===============
Total Bills: ${customerBills.length}
Total Amount: ₹${customerBills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}
Total Paid: ₹${customerBills.reduce((sum, bill) => sum + bill.paidAmount, 0).toFixed(2)}
Total Balance: ₹${customerBills.reduce((sum, bill) => sum + bill.balanceAmount, 0).toFixed(2)}

DETAILED BILLS:
===============
`;

    if (customerBills.length === 0) {
      content += 'No bills found for this customer.\n';
    } else {
      customerBills.forEach((bill, index) => {
        // Calculate previous balance for this bill
        const previousBills = customerBills.filter(b => b.id < bill.id);
        const previousBalance = previousBills.reduce((sum, b) => sum + b.balanceAmount, 0);
        const currentItemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
        const totalBillAmount = previousBalance + currentItemsTotal;
        
        content += `\nBill #${index + 1} - ${bill.billNumber || 'N/A'}
Date: ${formatDate(bill.date)}
Time: ${bill.timestamp.toLocaleTimeString('en-IN')}
----------------------------------------
Items:
`;
        
        bill.items.forEach((item, itemIndex) => {
          content += `${itemIndex + 1}. ${item.item} - ${item.weight}kg @ ₹${item.rate}/kg = ₹${item.amount.toFixed(2)}\n`;
        });
        
        content += `----------------------------------------
Previous Balance: ₹${previousBalance.toFixed(2)}
Current Items: ₹${currentItemsTotal.toFixed(2)}
Total Amount: ₹${totalBillAmount.toFixed(2)}
Paid Amount: ₹${bill.paidAmount.toFixed(2)}
Balance Amount: ₹${bill.balanceAmount.toFixed(2)}
Payment Method: ${bill.paymentMethod.toUpperCase()}`;
        
        if (bill.paymentMethod === 'upi' && bill.upiType) {
          content += ` (${bill.upiType})`;
        } else if (bill.paymentMethod === 'check' && bill.bankName) {
          content += ` (${bill.bankName} - ${bill.checkNumber})`;
        } else if (bill.paymentMethod === 'cash_gpay') {
          content += ` (Cash: ₹${bill.cashAmount?.toFixed(2) || '0.00'} + GPay: ₹${bill.gpayAmount?.toFixed(2) || '0.00'})`;
        }
        
        content += '\n';
      });
    }

    content += `\n================================================
Report End
Generated by Santhosh Chicken Billing System`;

    return content;
  };

  // Download customer data
  const downloadCustomerData = (customerName: string) => {
    const content = generateCustomerData(customerName);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Customer_${customerName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download all customers data
  const downloadAllCustomersData = () => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    let content = `SANTHOSH CHICKEN - ALL CUSTOMERS DATA REPORT
=====================================================
Generated on: ${currentDate} at ${currentTime}
Business: ${businessId === 'santhosh1' ? 'Santhosh Chicken 1' : 'Santhosh Chicken 2'}

SUMMARY:
========
Total Customers: ${customers.length}
Total Bills: ${bills.length}
Total Revenue: ₹${bills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}
Total Collected: ₹${bills.reduce((sum, bill) => sum + bill.paidAmount, 0).toFixed(2)}
Total Outstanding: ₹${bills.reduce((sum, bill) => sum + bill.balanceAmount, 0).toFixed(2)}

CUSTOMER LIST:
==============
`;

    customers.forEach((customer, index) => {
      const customerBills = bills.filter(bill => bill.customer === customer.name);
      const totalBilled = customerBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
      const totalPaid = customerBills.reduce((sum, bill) => sum + bill.paidAmount, 0);
      const totalBalance = customerBills.reduce((sum, bill) => sum + bill.balanceAmount, 0);
      
      content += `${index + 1}. ${customer.name}
   Phone: ${customer.phone}
   Current Balance: ₹${customer.balance.toFixed(2)}
   Total Bills: ${customerBills.length}
   Total Billed: ₹${totalBilled.toFixed(2)}
   Total Paid: ₹${totalPaid.toFixed(2)}
   Total Outstanding: ₹${totalBalance.toFixed(2)}
   Last Bill: ${customerBills.length > 0 ? formatDate(customerBills[0].date) : 'No bills'}

`;
    });

    content += `=====================================================
Report End
Generated by Santhosh Chicken Billing System`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `All_Customers_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-600">
              Santhosh Chicken - Billing System {businessId === 'santhosh2' ? '(Branch 2)' : ''}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-gray-600">
                Logged in as: {userType === 'owner' ? 'Owner' : 'Staff'}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                <LogOut className="inline mr-1 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation - UPDATED to include Load page */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setCurrentView('billing')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${
                currentView === 'billing' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Calculator className="inline mr-1 h-4 w-4" />
              Billing
            </button>
            <button
              onClick={() => setCurrentView('editBill')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${
                currentView === 'editBill' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="inline mr-1 h-4 w-4" />
              Edit Bill
            </button>
            <button
              onClick={() => setCurrentView('load')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${
                currentView === 'load' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Truck className="inline mr-1 h-4 w-4" />
              Load
            </button>
            <button
              onClick={() => setCurrentView('products')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${
                currentView === 'products' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Package className="inline mr-1 h-4 w-4" />
              Products
            </button>
            {userType === 'owner' && (
              <>
                <button
                  onClick={() => setCurrentView('customers')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${
                    currentView === 'customers' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Users className="inline mr-1 h-4 w-4" />
                  Manage Customers
                </button>
                <button
                  onClick={() => setCurrentView('balance')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${
                    currentView === 'balance' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <History className="inline mr-1 h-4 w-4" />
                  Balance & History
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium text-sm ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <BarChart3 className="inline mr-1 h-4 w-4" />
                  Sales Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Billing View */}
        {currentView === 'billing' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-bold mb-3">Create Bill</h2>
            
            {/* Compact form layout for desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-2 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Customer Selection */}
              <div className="lg:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <input
                    ref={customerInputRef}
                    type="text"
                    value={customerInput}
                    onChange={(e) => {
                      setCustomerInput(e.target.value);
                      setShowCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type customer name"
                  />
                  <Search className="absolute right-2 top-2 h-5 w-5 text-gray-400" />
                </div>
                
                {/* Customer Suggestions */}
                {showCustomerSuggestions && customerInput && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredCustomers.map((customer, index) => (
                      <div
                        key={index}
                        onClick={() => handleCustomerSelect(customer.name)}
                        className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.phone}</div>
                          </div>
                          {customer.balance > 0 && (
                            <span className="text-red-600 text-xs font-medium">
                              Balance: ₹{customer.balance.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Customer Display with Balance and History - UPDATED with running balance system */}
            {selectedCustomer && (
              <div className="mb-3 space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <div>
                      <strong className="text-blue-800 text-sm">Selected Customer:</strong> 
                      <span className="ml-2 text-blue-900 font-medium text-sm">{selectedCustomer}</span>
                      <div className="text-xs text-gray-600">Phone: {selectedCustomerPhone}</div>
                    </div>
                    {previousBalance > 0 && (
                      <div className="text-left sm:text-right">
                        <span className="text-red-600 font-bold text-lg">
                          Previous Balance: ₹{previousBalance.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Transaction History */}
                {getCustomerTransactionHistory(selectedCustomer).length > 0 && (
                  <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Recent Transactions:</h4>
                    <div className="max-h-20 overflow-y-auto">
                      {getCustomerTransactionHistory(selectedCustomer).slice(-3).map((bill, index) => (
                        <div key={index} className="text-xs text-yellow-700 border-b border-yellow-200 pb-1 mb-1 last:border-b-0">
                          <strong>{bill.date}:</strong> Total: ₹{bill.totalAmount.toFixed(2)}, 
                          Paid: ₹{bill.paidAmount.toFixed(2)}, 
                          Balance: ₹{bill.balanceAmount.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bill Items Table - Compact */}
            <div className="overflow-x-auto mb-3">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-1.5 text-left text-sm">No</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Item</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Weight (kg)</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Rate (₹/kg)</th>
                    <th className="border border-gray-300 p-1.5 text-left text-sm">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={item.no}>
                      <td className="border border-gray-300 p-1 text-center text-sm">
                        {item.no}
                      </td>
                      <td className="border border-gray-300 p-1">
                        <select
                          value={item.item}
                          onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Select Item</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.name}>{product.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          step="0.1"
                          value={item.weight}
                          onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0.0"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="border border-gray-300 p-1 text-right font-medium text-sm">
                        ₹{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Updated Total and Payment Section - UPDATED with running balance system */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <div className="text-sm">Items Total: ₹{totalAmount.toFixed(2)}</div>
                {selectedCustomer && previousBalance > 0 && (
                  <div className="text-sm text-red-600">Previous Balance: ₹{previousBalance.toFixed(2)}</div>
                )}
                <div className="text-xl font-bold border-t pt-1">
                  Total Bill Amount: ₹{(previousBalance + totalAmount).toFixed(2)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount paid"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="text-lg font-bold">
                  New Balance: ₹{((totalAmount + previousBalance) - (parseFloat(paymentAmount) || 0)).toFixed(2)}
                </div>
                <button
                  onClick={updateCustomerBalanceManually}
                  className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  Update Customer Balance
                </button>
              </div>
            </div>

            {/* Updated Confirmation section */}
            <div className="border-t pt-3">
              <div className="flex justify-center">
                <button
                  onClick={handleShowConfirmDialog}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Check className="inline mr-2 h-4 w-4" />
                  Confirm Bill
                </button>
              </div>
            </div>

            {/* Payment Method Confirmation Dialog - UPDATED with Cash+GPay option */}
            {showConfirmDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                  
                  {/* Payment Method Selection */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cash"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="cash" className="text-sm font-medium">Cash</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="upi"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'upi')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="upi" className="text-sm font-medium">UPI</label>
                    </div>
                    
                    {paymentMethod === 'upi' && (
                      <div className="ml-6">
                        <input
                          type="text"
                          value={upiType}
                          onChange={(e) => setUpiType(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="GPay, PhonePe, Paytm, etc."
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="check"
                        name="paymentMethod"
                        value="check"
                        checked={paymentMethod === 'check'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'check')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="check" className="text-sm font-medium">Check/DD</label>
                    </div>
                    
                    {paymentMethod === 'check' && (
                      <div className="ml-6 space-y-2">
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Bank Name"
                        />
                        <input
                          type="text"
                          value={checkNumber}
                          onChange={(e) => setCheckNumber(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Check/DD Number"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cash_gpay"
                        name="paymentMethod"
                        value="cash_gpay"
                        checked={paymentMethod === 'cash_gpay'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash_gpay')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="cash_gpay" className="text-sm font-medium">Cash + GPay</label>
                    </div>
                    
                    {paymentMethod === 'cash_gpay' && (
                      <div className="ml-6 space-y-2">
                        <input
                          type="number"
                          step="0.01"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Cash Amount"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={gpayAmount}
                          onChange={(e) => setGpayAmount(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="GPay Amount"
                        />
                        <div className="text-sm text-gray-600">
                          Total: ₹{((parseFloat(cashAmount) || 0) + (parseFloat(gpayAmount) || 0)).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Confirmation Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleConfirmBill}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Yes - Confirm
                    </button>
                    <button
                      onClick={handleCancelConfirm}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      No - Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Updated Bill Actions - Show after bill is confirmed for both cases */}
            {showBillActions && confirmedBill && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Bill Created Successfully!
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  Note: Customer balance has NOT been updated automatically. Use "Update Customer Balance" button above to update the balance.
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={() => printBill(confirmedBill)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <Printer className="inline mr-2 h-4 w-4" />
                    Print Bill
                  </button>
                  <button
                    onClick={() => saveAsDocument(confirmedBill)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <FileText className="inline mr-2 h-4 w-4" />
                    Save as Document
                  </button>
                  <button
                    onClick={() => sendToWhatsApp(confirmedBill)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                  >
                    <MessageCircle className="inline mr-2 h-4 w-4" />
                    Send to WhatsApp
                  </button>
                </div>
                <div className="text-center">
                  <button
                    onClick={handleNextCustomer}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-lg"
                  >
                    Bill for Next Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Load View - NEW */}
        {currentView === 'load' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <LoadManager businessId={businessId} />
          </div>
        )}

        {/* Edit Bill View */}
        {currentView === 'editBill' && (
          <EditBillPage 
            bills={bills}
            customers={customers}
            products={products}
            onUpdateBill={updateBill}
            onDeleteBill={deleteBill}
          />
        )}

        {/* Products View */}
        {currentView === 'products' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Manage Products</h2>
            <Products 
              products={products}
              onAddProduct={addProduct}
              onUpdateProduct={updateProduct}
              onDeleteProduct={deleteProduct}
            />
          </div>
        )}

        {/* Customer Management View */}
        {currentView === 'customers' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Manage Customers & Suppliers</h2>
            
            <div className="grid grid-cols-1 gap-8">
              {/* Customer Management */}
              <CustomerManager 
                customers={customers}
                onAddCustomer={addCustomer}
                onUpdateCustomer={updateCustomer}
                onDeleteCustomer={deleteCustomer}
                onDownloadCustomerData={downloadCustomerData}
                onDownloadAllCustomersData={downloadAllCustomersData}
              />

              {/* Add Supplier */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Add New Supplier</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter supplier name"
                  />
                  <button
                    onClick={addSupplier}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <h4 className="font-medium mb-2">Current Suppliers ({suppliers.length})</h4>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {suppliers.map((supplier, index) => (
                    <div key={index} className="py-1 border-b border-gray-100 last:border-b-0">
                      {supplier}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance & History View - UPDATED table format with bill numbers and bigger balance font */}
        {currentView === 'balance' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-2xl font-bold mb-3">Customer Balance & History</h2>
            
            {/* Customer Selection and Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Customer
                </label>
                <select
                  value={balanceCustomer}
                  onChange={(e) => setBalanceCustomer(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose Customer</option>
                  {customers.map((customer, index) => (
                    <option key={index} value={customer.name}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={getCustomerHistory}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Get History
                </button>
              </div>
            </div>

            {/* Current Balance - UPDATED with bigger font and last billed date */}
            {balanceCustomer && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <h3 className="text-lg font-semibold">
                  {balanceCustomer} - Current Balance: 
                  <span className="text-red-600 ml-2 text-2xl font-bold">
                    ₹{getCustomerBalance(balanceCustomer).toFixed(2)}
                  </span>
                </h3>
                {getLastBilledDate(balanceCustomer) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Last Billed: {formatDate(getLastBilledDate(balanceCustomer))}
                  </p>
                )}
              </div>
            )}

            {/* Customer History - UPDATED table format with formatted dates and action buttons */}
            {customerHistory.length > 0 && (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={printHistory}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                  >
                    <Printer className="mr-1 h-4 w-4" />
                    Print History
                  </button>
                  <button
                    onClick={sendHistoryToWhatsApp}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={downloadHistory}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center"
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    Download
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Date</th>
                        <th className="border border-gray-300 p-2 text-left">Bill No</th>
                        <th className="border border-gray-300 p-2 text-left">Items</th>
                        <th className="border border-gray-300 p-2 text-left">Rate</th>
                        <th className="border border-gray-300 p-2 text-right">Amount</th>
                        <th className="border border-gray-300 p-2 text-right">Balance</th>
                        <th className="border border-gray-300 p-2 text-right">Total Balance</th>
                        <th className="border border-gray-300 p-2 text-left">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHistory.map((bill, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">{formatDate(bill.date)}</td>
                          <td className="border border-gray-300 p-2 font-mono">{bill.billNumber || 'N/A'}</td>
                          <td className="border border-gray-300 p-2">
                            {bill.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.item} - {item.weight}kg
                              </div>
                            ))}
                          </td>
                          <td className="border border-gray-300 p-2">
                            {bill.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                ₹{item.rate}/kg
                              </div>
                            ))}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">₹{bill.totalAmount.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-right text-lg font-bold text-red-600">₹{bill.balanceAmount.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-right text-lg font-bold">₹{bill.balanceAmount.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2">
                            {bill.paymentMethod === 'cash' ? 'Cash' : 
                             bill.paymentMethod === 'upi' ? `UPI - ${bill.upiType}` :
                             bill.paymentMethod === 'cash_gpay' ? `Cash + GPay` :
                             `Check/DD - ${bill.bankName}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Dashboard View */}
        {currentView === 'dashboard' && userType === 'owner' && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <SalesDashboard 
              bills={bills}
              customers={customers}
              businessId={businessId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
