import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Download, Coffee } from 'lucide-react';
import { api } from '../api/client';

export const Reports: React.FC = () => {
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'products'>('daily');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [salesRes, prodRes] = await Promise.all([
        api.get('/reports/sales'),
        api.get('/reports/products'),
      ]);
      setDailySales(salesRes.data.data || []);
      setProductSales(prodRes.data.data || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    }
  };

  const totalPeriodRevenue = dailySales.reduce((sum, d) => sum + Number(d.totalSales || 0), 0);
  const totalPeriodOrders = dailySales.reduce((sum, d) => sum + Number(d.orderCount || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 bg-white border-b border-stone-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Sales & Revenue Analytics
          </h2>
          <p className="text-xs text-stone-500">
            Performance statements, daily revenue, and dish popularity
          </p>
        </div>

        <div className="flex gap-2">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Period Sales</span>
            <span className="text-base font-black text-amber-950">Rs. {totalPeriodRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 bg-white border-b border-stone-200 flex gap-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'daily'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Daily Sales Breakdown
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'products'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Product Performance
        </button>
      </div>

      {/* Report Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {activeTab === 'daily' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Orders Count</th>
                  <th className="py-3 px-4">Discounts Given</th>
                  <th className="py-3 px-4">Tax Collected</th>
                  <th className="py-3 px-4 text-right">Total Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {dailySales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-stone-400">
                      No sales recorded in the selected period
                    </td>
                  </tr>
                ) : (
                  dailySales.map((d, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4 font-bold text-stone-900">{d.date}</td>
                      <td className="py-3 px-4 text-stone-700">{d.orderCount} orders</td>
                      <td className="py-3 px-4 text-stone-500">Rs. {Number(d.totalDiscounts || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-stone-500">Rs. {Number(d.totalTax || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-800">
                        Rs. {Number(d.totalSales || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Gross Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {productSales.map((p, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-bold text-stone-900">{p.name}</td>
                    <td className="py-3 px-4 font-semibold text-stone-700">{p.quantity} units</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-800">
                      Rs. {Number(p.revenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
