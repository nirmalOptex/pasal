import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  QrCode,
  Banknote,
  Calendar,
  Coffee,
} from 'lucide-react';
import { api } from '../api/client';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState<string>('today');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [range]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/summary', { params: { range } });
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div className="p-8 text-stone-500">Loading Business Dashboard...</div>;

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-y-auto p-8 space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Business Overview</h2>
          <p className="text-xs text-stone-500">
            Real-time financial performance, payments & inventory indicators
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex bg-white p-1 rounded-xl border border-stone-200 shadow-sm text-xs font-semibold">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === r.id ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-stone-900">Rs. {data.totalSales.toFixed(0)}</h3>
          <p className="text-[11px] text-stone-400 mt-1">Across {data.totalOrders} total orders</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Avg Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-stone-900">Rs. {data.averageOrderValue.toFixed(0)}</h3>
          <p className="text-[11px] text-stone-400 mt-1">Per dining or takeaway receipt</p>
        </div>

        {/* Khata Credit Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Outstanding Khata</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-900">Rs. {data.outstandingCredit.toFixed(0)}</h3>
          <p className="text-[11px] text-stone-400 mt-1">Total customer debt to be collected</p>
        </div>

        {/* Expenses / Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-red-600">{data.lowStockCount} Items</h3>
          <p className="text-[11px] text-stone-400 mt-1">Below safe inventory reorder threshold</p>
        </div>
      </div>

      {/* Two Column Layout: Payment Split & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Collection Channels */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-amber-600" />
            Collections by Payment Method
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Cash Tendered', key: 'CASH', icon: Banknote, color: 'bg-emerald-500' },
              { label: 'QR Payments (Fonepay/eSewa)', key: 'QR', icon: QrCode, color: 'bg-blue-500' },
              { label: 'Customer Khata (Credit)', key: 'CREDIT', icon: BookOpen, color: 'bg-purple-500' },
            ].map((method) => {
              const amount = data.payments[method.key] || 0;
              const pct = data.totalSales > 0 ? (amount / data.totalSales) * 100 : 0;
              const Icon = method.icon;

              return (
                <div key={method.key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-stone-700">
                      <Icon className="w-3.5 h-3.5 text-stone-400" />
                      {method.label}
                    </span>
                    <span className="font-bold text-stone-900">
                      Rs. {amount.toFixed(0)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className={`h-full ${method.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-600" />
            Best-Selling Chiya & Khaja
          </h3>

          <div className="divide-y divide-stone-100 text-xs">
            {data.topProducts?.length === 0 ? (
              <p className="text-stone-400 py-4 text-center">No sales recorded in this period</p>
            ) : (
              data.topProducts?.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-stone-100 font-bold text-stone-600 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-stone-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">{item.totalQuantity} sold</span>
                    <span className="text-stone-400 text-[10px]">Rs. {Number(item.totalRevenue).toFixed(0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
