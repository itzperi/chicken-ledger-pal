import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: number;
  name: string;
}

interface Customer {
  name: string;
  phone: string;
  balance: number;
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

interface BillItem {
  no: number;
  item: string;
  weight: string;
  rate: string;
  amount: number;
}

export const useSupabaseData = (businessId: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh customers data function - BULLETPROOF BALANCE SYNC
  const refreshCustomersData = async () => {
    try {
      console.log('[BALANCE SYNC] Fetching latest customer data from database...');
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('name');
      
      if (error) {
        console.error('[BALANCE SYNC] Database query failed:', error);
        throw error;
      }
      
      if (!customersData) {
        console.warn('[BALANCE SYNC] No customer data received from database');
        return;
      }
      
      const mappedCustomers = customersData.map(c => ({
        name: c.name,
        phone: c.phone,
        balance: parseFloat(c.balance?.toString() || '0')
      }));
      
      console.log('[BALANCE SYNC] Successfully updated customer balances:', 
        mappedCustomers.map(c => `${c.name}: ₹${c.balance}`));
      
      setCustomers(mappedCustomers);
    } catch (error) {
      console.error('[BALANCE SYNC] Critical error refreshing customers:', error);
      // Still continue operation even if refresh fails
    }
  };

  // Get real-time customer balance by name - DEDICATED BALANCE FETCHER
  const getRealTimeBalance = async (customerName: string): Promise<number> => {
    try {
      console.log(`[BALANCE FETCH] Getting real-time balance for: ${customerName}`);
      
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('balance')
        .eq('name', customerName)
        .eq('business_id', businessId)
        .single();
      
      if (error) {
        console.error(`[BALANCE FETCH] Database error for ${customerName}:`, error);
        return 0;
      }
      
      const balance = customerData?.balance ? parseFloat(customerData.balance.toString()) : 0;
      console.log(`[BALANCE FETCH] Retrieved balance for ${customerName}: ₹${balance}`);
      
      return balance;
    } catch (error) {
      console.error(`[BALANCE FETCH] Critical error fetching balance for ${customerName}:`, error);
      return 0;
    }
  };

  // Get real-time customer balance by phone - DEDICATED BALANCE FETCHER
  const getRealTimeBalanceByPhone = async (phone: string): Promise<{balance: number, name?: string}> => {
    try {
      console.log(`[BALANCE FETCH] Getting real-time balance for phone: ${phone}`);
      
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('name, balance')
        .eq('phone', phone)
        .eq('business_id', businessId)
        .single();
      
      if (error) {
        console.error(`[BALANCE FETCH] Database error for phone ${phone}:`, error);
        return { balance: 0 };
      }
      
      const balance = customerData?.balance ? parseFloat(customerData.balance.toString()) : 0;
      console.log(`[BALANCE FETCH] Retrieved balance for phone ${phone}: ₹${balance}, Customer: ${customerData?.name}`);
      
      return { 
        balance, 
        name: customerData?.name 
      };
    } catch (error) {
      console.error(`[BALANCE FETCH] Critical error fetching balance for phone ${phone}:`, error);
      return { balance: 0 };
    }
  };

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .order('name');
        
        // Load customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessId)
          .order('name');
        
        // Load bills
        const { data: billsData } = await supabase
          .from('bills')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        setProducts(productsData || []);
        setCustomers((customersData || []).map(c => ({
          name: c.name,
          phone: c.phone,
          balance: parseFloat(c.balance?.toString() || '0')
        })));
        
        setBills((billsData || []).map(b => ({
          id: b.id,
          billNumber: (b as any).bill_number || undefined,
          customer: b.customer_name,
          customerPhone: b.customer_phone,
          date: (b as any).bill_date,
          items: (b.items as unknown as BillItem[]) || [],
          totalAmount: parseFloat(b.total_amount.toString()),
          paidAmount: parseFloat((b as any).paid_amount?.toString() || '0'),
          balanceAmount: parseFloat((b as any).balance_amount?.toString() || '0'),
          paymentMethod: b.payment_method as 'cash' | 'upi' | 'check' | 'cash_gpay',
          upiType: (b as any).upi_type || undefined,
          bankName: (b as any).bank_name || undefined,
          checkNumber: (b as any).check_number || undefined,
          cashAmount: (b as any).cash_amount ? parseFloat((b as any).cash_amount.toString()) : undefined,
          gpayAmount: (b as any).gpay_amount ? parseFloat((b as any).gpay_amount.toString()) : undefined,
          timestamp: new Date(b.created_at || '')
        })));
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadData();
    }
  }, [businessId]);

  // Add product
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ name: product.name, business_id: businessId }])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: number, name: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ name })
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Add customer
  const addCustomer = async (customer: Customer) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customer.name,
          phone: customer.phone,
          balance: customer.balance,
          business_id: businessId
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCustomers(prev => [...prev, {
        name: data.name,
        phone: data.phone,
        balance: parseFloat(data.balance?.toString() || '0')
      }]);
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (index: number, customer: Customer) => {
    try {
      const existingCustomer = customers[index];
      
      // Update in database using the original customer's name as identifier
      const { error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          phone: customer.phone,
          balance: customer.balance
        })
        .eq('name', existingCustomer.name)
        .eq('phone', existingCustomer.phone)
        .eq('business_id', businessId);

      if (error) throw error;
      
      // Update local state
      setCustomers(prev => prev.map((c, i) => i === index ? customer : c));
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const updateCustomerBalance = async (customerName: string, newBalance: number) => {
    try {
      console.log(`[BALANCE UPDATE] Updating ${customerName} balance to ₹${newBalance}`);
      
      const { error } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('name', customerName)
        .eq('business_id', businessId);

      if (error) {
        console.error(`[BALANCE UPDATE] Database update failed for ${customerName}:`, error);
        throw error;
      }
      
      console.log(`[BALANCE UPDATE] Successfully updated ${customerName} balance in database`);
      
      // Update local state immediately for instant UI feedback
      setCustomers(prev => prev.map(c => 
        c.name === customerName ? { ...c, balance: newBalance } : c
      ));
      
      // Critical: Refresh all customer data to ensure 100% synchronization across all views
      await refreshCustomersData();
      
      console.log(`[BALANCE UPDATE] Balance synchronization complete for ${customerName}`);
    } catch (error) {
      console.error(`[BALANCE UPDATE] Critical error updating balance for ${customerName}:`, error);
      throw error;
    }
  };

  const deleteCustomer = async (customerName: string) => {
    try {
      // First, check if customer has any bills
      const { data: customerBills } = await supabase
        .from('bills')
        .select('id')
        .eq('customer_name', customerName)
        .eq('business_id', businessId);

      if (customerBills && customerBills.length > 0) {
        throw new Error('Cannot delete customer with existing bills. Please delete all bills first.');
      }

      // Delete customer from database
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('name', customerName)
        .eq('business_id', businessId);

      if (error) throw error;
      
      setCustomers(prev => prev.filter(c => c.name !== customerName));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  // Add bill with automatic bill number generation - updated with new payment method and auto balance update
  const addBill = async (bill: Omit<Bill, 'id' | 'timestamp'>) => {
    try {
      // Create the insert object without bill_number since it will be auto-generated
      const insertData = {
        customer_name: bill.customer,
        customer_phone: bill.customerPhone,
        bill_date: bill.date,
        items: bill.items as any,
        total_amount: bill.totalAmount,
        paid_amount: bill.paidAmount,
        balance_amount: bill.balanceAmount,
        payment_method: bill.paymentMethod,
        upi_type: bill.upiType || null,
        bank_name: bill.bankName || null,
        check_number: bill.checkNumber || null,
        cash_amount: bill.cashAmount || null,
        gpay_amount: bill.gpayAmount || null,
        business_id: businessId
        // Note: bill_number will be auto-generated by the database trigger
      };

      const { data, error } = await supabase
        .from('bills')
        .insert(insertData as any) // Type assertion to bypass TypeScript check
        .select()
        .single();

      if (error) throw error;
      
      const newBill: Bill = {
        id: data.id,
        billNumber: (data as any).bill_number,
        customer: data.customer_name,
        customerPhone: data.customer_phone,
        date: (data as any).bill_date,
        items: (data.items as unknown as BillItem[]) || [],
        totalAmount: parseFloat(data.total_amount.toString()),
        paidAmount: parseFloat((data as any).paid_amount?.toString() || '0'),
        balanceAmount: parseFloat((data as any).balance_amount?.toString() || '0'),
        paymentMethod: data.payment_method as 'cash' | 'upi' | 'check' | 'cash_gpay',
        upiType: (data as any).upi_type || undefined,
        bankName: (data as any).bank_name || undefined,
        checkNumber: (data as any).check_number || undefined,
        cashAmount: (data as any).cash_amount ? parseFloat((data as any).cash_amount.toString()) : undefined,
        gpayAmount: (data as any).gpay_amount ? parseFloat((data as any).gpay_amount.toString()) : undefined,
        timestamp: new Date(data.created_at || '')
      };
      
      // Automatically update customer balance in database
      await updateCustomerBalance(bill.customer, bill.balanceAmount);
      
      setBills(prev => [newBill, ...prev]);
      return newBill;
    } catch (error) {
      console.error('Error adding bill:', error);
      return null;
    }
  };

  // Update bill with balance recalculation
  const updateBill = async (bill: Bill) => {
    try {
      // First, get the original bill to calculate balance difference
      const originalBill = bills.find(b => b.id === bill.id);
      if (!originalBill) throw new Error('Original bill not found');

      // Update the bill in database
      const { error } = await supabase
        .from('bills')
        .update({
          bill_number: bill.billNumber,
          customer_name: bill.customer,
          customer_phone: bill.customerPhone,
          bill_date: bill.date,
          items: bill.items as any,
          total_amount: bill.totalAmount,
          paid_amount: bill.paidAmount,
          balance_amount: bill.balanceAmount,
          payment_method: bill.paymentMethod,
          upi_type: bill.upiType,
          bank_name: bill.bankName,
          check_number: bill.checkNumber,
          cash_amount: bill.cashAmount,
          gpay_amount: bill.gpayAmount
        })
        .eq('id', bill.id)
        .eq('business_id', businessId);

      if (error) throw error;

      // Calculate the difference in balance and update customer balance
      const balanceDifference = bill.balanceAmount - originalBill.balanceAmount;
      if (balanceDifference !== 0) {
        const customer = customers.find(c => c.name === bill.customer);
        if (customer) {
          const newCustomerBalance = customer.balance + balanceDifference;
          await updateCustomerBalance(bill.customer, newCustomerBalance);
        }
      }
      
      setBills(prev => prev.map(b => b.id === bill.id ? bill : b));
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  };

  // Delete bill with balance adjustment
  const deleteBill = async (id: number) => {
    try {
      // Get the bill to be deleted
      const billToDelete = bills.find(b => b.id === id);
      if (!billToDelete) throw new Error('Bill not found');

      // Delete from database
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;

      // Adjust customer balance (subtract the deleted bill's balance)
      const customer = customers.find(c => c.name === billToDelete.customer);
      if (customer) {
        const newCustomerBalance = customer.balance - billToDelete.balanceAmount;
        await updateCustomerBalance(billToDelete.customer, newCustomerBalance);
      }
      
      setBills(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  };

  // Get latest balance for a customer by phone number
  const getLatestBalanceByPhone = (customerPhone: string): number => {
    const customerBills = bills.filter(bill => bill.customerPhone === customerPhone);
    if (customerBills.length > 0) {
      // Sort by date descending and get the latest bill
      const latestBill = customerBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return latestBill.balanceAmount || 0;
    }
    return 0; // First bill for this customer
  };

  return {
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
    getLatestBalanceByPhone,
    refreshCustomersData,
    getRealTimeBalance,
    getRealTimeBalanceByPhone
  };
};
