import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, Edit2, Save, X, PrinterIcon } from "lucide-react";
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useToast } from "@/hooks/use-toast";
import CustomerManager from '@/components/CustomerManager';
import Products from '@/components/Products';
import LoadManager from '@/components/LoadManager';
import EditableBillHistory from '@/components/EditableBillHistory';
import SalesDashboard from '@/components/SalesDashboard';
import Login from '@/components/Login';

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

interface Product {
  id: number;
  name: string;
}

interface Customer {
  name: string;
  phone: string;
  balance: number;
}

interface LoadEntry {
  id: number;
  entry_date: string;
  no_of_boxes: number;
  quantity_with_box: number;
  no_of_boxes_after: number;
  quantity_after_box: number;
}

const Index = () => {
  const [businessId, setBusinessId] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newBillItem, setNewBillItem] = useState({ no: 1, item: '', weight: '', rate: '', amount: 0 });
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'check' | 'cash_gpay'>('cash');
  const [upiType, setUpiType] = useState<string | undefined>(undefined);
  const [bankName, setBankName] = useState<string | undefined>(undefined);
  const [checkNumber, setCheckNumber] = useState<string | undefined>(undefined);
  const [cashAmount, setCashAmount] = useState<number | undefined>(undefined);
  const [gpayAmount, setGpayAmount] = useState<number | undefined>(undefined);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [isEditingBill, setIsEditingBill] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { toast } = useToast();
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
    deleteBill
  } = useSupabaseData(businessId);

  useEffect(() => {
    const storedBusinessId = localStorage.getItem('businessId');
    if (storedBusinessId) {
      setBusinessId(storedBusinessId);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    // Recalculate total amount whenever bill items change
    const newTotal = billItems.reduce((acc, item) => acc + item.amount, 0);
    setTotalAmount(newTotal);
    setBalanceAmount(newTotal - paidAmount); // Also update balance amount
  }, [billItems, paidAmount]);

  useEffect(() => {
    // Update balance amount whenever totalAmount or paidAmount changes
    setBalanceAmount(totalAmount - paidAmount);
  }, [totalAmount, paidAmount]);

  const handleLogin = (userType: 'owner' | 'staff', id: 'santhosh1' | 'santhosh2') => {
    setBusinessId(id);
    setIsLoggedIn(true);
    localStorage.setItem('businessId', id);
  };

  const handleLogout = () => {
    setBusinessId('');
    setIsLoggedIn(false);
    localStorage.removeItem('businessId');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewBillItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (newBillItem.item && newBillItem.weight && newBillItem.rate) {
      const amount = parseFloat(newBillItem.weight) * parseFloat(newBillItem.rate);
      const newItem = { ...newBillItem, amount };
      setBillItems(prev => [...prev, newItem]);
      setNewBillItem({ no: billItems.length + 2, item: '', weight: '', rate: '', amount: 0 }); // Increment 'no'
    }
  };

  const handleRemoveItem = (index: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number) => {
    const itemToEdit = billItems[index];
    setNewBillItem({ ...itemToEdit, no: index + 1 });
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearBillForm = () => {
    setBillItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setBillDate(new Date().toISOString().slice(0, 10));
    setTotalAmount(0);
    setPaidAmount(0);
    setBalanceAmount(0);
    setPaymentMethod('cash');
    setUpiType(undefined);
    setBankName(undefined);
    setCheckNumber(undefined);
    setCashAmount(undefined);
    setGpayAmount(undefined);
    setNewBillItem({ no: 1, item: '', weight: '', rate: '', amount: 0 });
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) {
      toast({
        title: "Error",
        description: "Customer name and phone are required.",
      });
      return;
    }

    if (billItems.length === 0) {
      toast({
        title: "Error",
        description: "Bill must have at least one item.",
      });
      return;
    }

    if (paymentMethod === 'upi' && !upiType) {
      toast({
        title: "Error",
        description: "UPI type is required for UPI payments.",
      });
      return;
    }

    if (paymentMethod === 'check' && !bankName && !checkNumber) {
      toast({
        title: "Error",
        description: "Bank name and check number are required for check payments.",
      });
      return;
    }

    if (paymentMethod === 'cash_gpay' && (cashAmount === undefined || gpayAmount === undefined)) {
      toast({
        title: "Error",
        description: "Cash and GPay amounts are required for Cash & GPay payments.",
      });
      return;
    }

    const newBill = {
      customer: customerName,
      customerPhone: customerPhone,
      date: billDate,
      items: billItems,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      balanceAmount: balanceAmount,
      paymentMethod: paymentMethod,
      upiType: upiType,
      bankName: bankName,
      checkNumber: checkNumber,
      cashAmount: cashAmount,
      gpayAmount: gpayAmount
    };

    try {
      const addedBill = await addBill(newBill);
      if (addedBill) {
        toast({
          title: "Success",
          description: "Bill added successfully.",
        });
        clearBillForm();
      } else {
        toast({
          title: "Error",
          description: "Failed to add bill.",
        });
      }
    } catch (error) {
      console.error("Error adding bill:", error);
      toast({
        title: "Error",
        description: "Failed to add bill.",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedBillId) {
      toast({
        title: "Error",
        description: "No bill selected for update.",
      });
      return;
    }

    if (!customerName || !customerPhone) {
      toast({
        title: "Error",
        description: "Customer name and phone are required.",
      });
      return;
    }

    if (billItems.length === 0) {
      toast({
        title: "Error",
        description: "Bill must have at least one item.",
      });
      return;
    }

    if (paymentMethod === 'upi' && !upiType) {
      toast({
        title: "Error",
        description: "UPI type is required for UPI payments.",
      });
      return;
    }

    if (paymentMethod === 'check' && !bankName && !checkNumber) {
      toast({
        title: "Error",
        description: "Bank name and check number are required for check payments.",
      });
      return;
    }

    if (paymentMethod === 'cash_gpay' && (cashAmount === undefined || gpayAmount === undefined)) {
      toast({
        title: "Error",
        description: "Cash and GPay amounts are required for Cash & GPay payments.",
      });
      return;
    }

    const updatedBill = {
      id: selectedBillId,
      customer: customerName,
      customerPhone: customerPhone,
      date: billDate,
      items: billItems,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      balanceAmount: balanceAmount,
      paymentMethod: paymentMethod,
      upiType: upiType,
      bankName: bankName,
      checkNumber: checkNumber,
      cashAmount: cashAmount,
      gpayAmount: gpayAmount,
      timestamp: new Date()
    };

    try {
      await updateBill(updatedBill);
      toast({
        title: "Success",
        description: "Bill updated successfully.",
      });
      clearBillForm();
      setIsEditingBill(false);
      setSelectedBillId(null);
    } catch (error) {
      console.error("Error updating bill:", error);
      toast({
        title: "Error",
        description: "Failed to update bill.",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedBillId) {
      toast({
        title: "Error",
        description: "No bill selected for deletion.",
      });
      return;
    }

    try {
      await deleteBill(selectedBillId);
      toast({
        title: "Success",
        description: "Bill deleted successfully.",
      });
      clearBillForm();
      setIsEditingBill(false);
      setSelectedBillId(null);
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({
        title: "Error",
        description: "Failed to delete bill.",
      });
    }
  };

  const handleEditBill = (bill: Bill) => {
    setSelectedBillId(bill.id);
    setCustomerName(bill.customer);
    setCustomerPhone(bill.customerPhone);
    setBillDate(bill.date);
    setBillItems(bill.items);
    setTotalAmount(bill.totalAmount);
    setPaidAmount(bill.paidAmount);
    setBalanceAmount(bill.balanceAmount);
    setPaymentMethod(bill.paymentMethod);
    setUpiType(bill.upiType);
    setBankName(bill.bankName);
    setCheckNumber(bill.checkNumber);
    setCashAmount(bill.cashAmount);
    setGpayAmount(bill.gpayAmount);
    setIsEditingBill(true);
  };

  const handleCancelEdit = () => {
    clearBillForm();
    setIsEditingBill(false);
    setSelectedBillId(null);
  };

  const handlePrintBill = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  // Create a wrapper function for EditableBillHistory
  const handleUpdateBillFromHistory = async (billId: number, updatedBill: Partial<Bill>) => {
    const existingBill = bills.find(b => b.id === billId);
    if (!existingBill) {
      toast({
        title: "Error",
        description: "Bill not found.",
      });
      return;
    }

    const fullUpdatedBill: Bill = {
      ...existingBill,
      ...updatedBill,
      id: billId
    };

    try {
      await updateBill(fullUpdatedBill);
      toast({
        title: "Success",
        description: "Bill updated successfully.",
      });
    } catch (error) {
      console.error("Error updating bill:", error);
      toast({
        title: "Error",
        description: "Failed to update bill.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold text-center mb-8">Business Management System</h1>
          
          <Tabs defaultValue="billing" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="balance">Balance & History</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="load">Load Management</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Billing</CardTitle>
                  <CardDescription>Create and manage bills.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        type="text"
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Customer Phone</Label>
                      <Input
                        type="text"
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billDate">Bill Date</Label>
                    <Input
                      type="date"
                      id="billDate"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                    />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-5 gap-2">
                    <Label htmlFor="item">Item</Label>
                    <Label htmlFor="weight">Weight</Label>
                    <Label htmlFor="rate">Rate</Label>
                    <Label htmlFor="amount">Amount</Label>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <Input
                      type="text"
                      name="item"
                      placeholder="Item"
                      value={newBillItem.item}
                      onChange={handleInputChange}
                    />
                    <Input
                      type="text"
                      name="weight"
                      placeholder="Weight"
                      value={newBillItem.weight}
                      onChange={handleInputChange}
                    />
                    <Input
                      type="text"
                      name="rate"
                      placeholder="Rate"
                      value={newBillItem.rate}
                      onChange={handleInputChange}
                    />
                    <Input
                      type="text"
                      name="amount"
                      placeholder="Amount"
                      value={(parseFloat(newBillItem.weight) * parseFloat(newBillItem.rate)).toFixed(2)}
                      readOnly
                    />
                    <Button type="button" size="sm" onClick={handleAddItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <Separator />
                  {billItems.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Bill Items</h3>
                      <div className="grid grid-cols-6 gap-2 font-semibold">
                        <div>No.</div>
                        <div>Item</div>
                        <div>Weight</div>
                        <div>Rate</div>
                        <div>Amount</div>
                        <div>Actions</div>
                      </div>
                      {billItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-6 gap-2">
                          <div>{index + 1}</div>
                          <div>{item.item}</div>
                          <div>{item.weight}</div>
                          <div>{item.rate}</div>
                          <div>{item.amount.toFixed(2)}</div>
                          <div className="flex space-x-2">
                            <Button type="button" size="sm" onClick={() => handleEditItem(index)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveItem(index)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right font-bold">
                        Total: ₹{totalAmount.toFixed(2)}
                      </div>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paidAmount">Paid Amount</Label>
                      <Input
                        type="number"
                        id="paidAmount"
                        value={paidAmount.toString()}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="balanceAmount">Balance Amount</Label>
                      <Input
                        type="number"
                        id="balanceAmount"
                        value={balanceAmount.toFixed(2)}
                        readOnly
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'upi' | 'check' | 'cash_gpay')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="cash_gpay">Cash & GPay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {paymentMethod === 'upi' && (
                    <div>
                      <Label htmlFor="upiType">UPI Type</Label>
                      <Input
                        type="text"
                        id="upiType"
                        placeholder="Enter UPI type (e.g., PhonePe, Google Pay)"
                        value={upiType || ''}
                        onChange={(e) => setUpiType(e.target.value)}
                      />
                    </div>
                  )}
                  {paymentMethod === 'check' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          type="text"
                          id="bankName"
                          placeholder="Enter bank name"
                          value={bankName || ''}
                          onChange={(e) => setBankName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkNumber">Check Number</Label>
                        <Input
                          type="text"
                          id="checkNumber"
                          placeholder="Enter check number"
                          value={checkNumber || ''}
                          onChange={(e) => setCheckNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {paymentMethod === 'cash_gpay' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cashAmount">Cash Amount</Label>
                        <Input
                          type="number"
                          id="cashAmount"
                          placeholder="Enter cash amount"
                          value={cashAmount !== undefined ? cashAmount.toString() : ''}
                          onChange={(e) => setCashAmount(parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gpayAmount">GPay Amount</Label>
                        <Input
                          type="number"
                          id="gpayAmount"
                          placeholder="Enter GPay amount"
                          value={gpayAmount !== undefined ? gpayAmount.toString() : ''}
                          onChange={(e) => setGpayAmount(parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    {isEditingBill ? (
                      <div className="flex space-x-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                        <Button type="button" onClick={handleUpdate}>
                          <Save className="mr-2 h-4 w-4" />
                          Update Bill
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" onClick={handleSubmit}>
                        Submit Bill
                      </Button>
                    )}
                    <Button type="button" variant="outline" onClick={handlePrintBill} disabled={isPrinting}>
                      {isPrinting ? "Printing..." : <><PrinterIcon className="mr-2 h-4 w-4" /> Print</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance">
              <Card>
                <CardHeader>
                  <CardTitle>Balance & History</CardTitle>
                  <CardDescription>View customer balances and bill history.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditableBillHistory customerHistory={bills} customerName={customerName} onUpdateBill={handleUpdateBillFromHistory} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>Manage customer information.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomerManager customers={customers} onAddCustomer={addCustomer} onUpdateCustomer={updateCustomer} onDeleteCustomer={deleteCustomer} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage product inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Products products={products} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="load">
              <Card>
                <CardHeader>
                  <CardTitle>Load Management</CardTitle>
                  <CardDescription>Manage chicken load entries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LoadManager businessId={businessId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Dashboard</CardTitle>
                  <CardDescription>View sales statistics and analytics.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SalesDashboard bills={bills} customers={customers} businessId={businessId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Index;
