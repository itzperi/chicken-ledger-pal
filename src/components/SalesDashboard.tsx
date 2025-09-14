
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, Wallet, CreditCard, Smartphone, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SalesDashboardProps {
  bills: any[];
  customers: any[];
  businessId: string;
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ bills, customers, businessId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    cashAmount: 0,
    upiAmount: 0,
    checkAmount: 0
  });

  useEffect(() => {
    calculateSalesData();
    fetchRemainingQuantity();
  }, [bills, selectedDate]);

  const fetchRemainingQuantity = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('chicken_stock_kg')
        .eq('business_id', businessId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setRemainingQuantity((data as any)?.chicken_stock_kg || 0);
    } catch (error) {
      console.error('Error fetching remaining quantity:', error);
    }
  };

  const calculateSalesData = () => {
    const todayBills = bills.filter(bill => bill.date === selectedDate);
    
    // Calculate product-wise sales
    const productMap = new Map();
    todayBills.forEach(bill => {
      bill.items.forEach((item: any) => {
        if (productMap.has(item.item)) {
          const existing = productMap.get(item.item);
          productMap.set(item.item, {
            name: item.item,
            sales: existing.sales + item.amount,
            quantity: existing.quantity + parseFloat(item.weight || '0')
          });
        } else {
          productMap.set(item.item, {
            name: item.item,
            sales: item.amount,
            quantity: parseFloat(item.weight || '0')
          });
        }
      });
    });
    setProductSales(Array.from(productMap.values()));

    // Calculate customer-wise sales
    const customerMap = new Map();
    todayBills.forEach(bill => {
      if (customerMap.has(bill.customer)) {
        customerMap.set(bill.customer, customerMap.get(bill.customer) + bill.totalAmount);
      } else {
        customerMap.set(bill.customer, bill.totalAmount);
      }
    });
    const customerSalesData = Array.from(customerMap.entries()).map(([name, amount]) => ({
      name,
      amount: amount as number
    }));
    setCustomerSales(customerSalesData);

    // Calculate payment method totals
    let cash = 0, upi = 0, check = 0;
    todayBills.forEach(bill => {
      if (bill.paymentMethod === 'cash') {
        cash += bill.paidAmount;
      } else if (bill.paymentMethod === 'upi') {
        upi += bill.paidAmount;
      } else if (bill.paymentMethod === 'check') {
        check += bill.paidAmount;
      }
    });

    setTodayStats({
      totalSales: todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      cashAmount: cash,
      upiAmount: upi,
      checkAmount: check
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Sales Dashboard</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Today's Stats Cards - UPDATED to include remaining quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Sales</p>
              <p className="text-2xl font-bold">₹{todayStats.totalSales.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Cash</p>
              <p className="text-2xl font-bold">₹{todayStats.cashAmount.toFixed(2)}</p>
            </div>
            <Wallet className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">UPI</p>
              <p className="text-2xl font-bold">₹{todayStats.upiAmount.toFixed(2)}</p>
            </div>
            <Smartphone className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Check/DD</p>
              <p className="text-2xl font-bold">₹{todayStats.checkAmount.toFixed(2)}</p>
            </div>
            <CreditCard className="h-8 w-8 text-orange-200" />
          </div>
        </div>
        
        {/* NEW - Remaining Quantity Card */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Stock Remaining</p>
              <p className="text-2xl font-bold">{remainingQuantity.toFixed(2)} kg</p>
            </div>
            <Package className="h-8 w-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Product-wise Sales</h3>
          {productSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productSales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No product sales data for selected date
            </div>
          )}
        </div>

        {/* Customer Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Customer-wise Sales</h3>
          {customerSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerSales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {customerSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No customer sales data for selected date
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
