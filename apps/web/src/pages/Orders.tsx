import React, { useState, useEffect } from 'react';
import { Receipt, Search, Filter, Eye, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { OrderStatus } from '@chhiyapasal/shared-types';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/orders', { params });
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const map: Record<string, string> = {
      [OrderStatus.PENDING]: 'bg-stone-100 text-stone-700 border-stone-300',
      [OrderStatus.CONFIRMED]: 'bg-amber-100 text-amber-800 border-amber-300',
      [OrderStatus.PREPARING]: 'bg-blue-100 text-blue-800 border-blue-300',
      [OrderStatus.READY]: 'bg-purple-100 text-purple-800 border-purple-300',
      [OrderStatus.SERVED]: 'bg-teal-100 text-teal-800 border-teal-300',
      [OrderStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-300',
    };
    return map[status] || 'bg-stone-100 text-stone-800 border-stone-200';
  };

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-6 bg-white border-b border-stone-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Live Orders & Receipts</h2>
          <p className="text-xs text-stone-500">Track and review all dining and takeaway tickets</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            {['ALL', OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                    statusFilter === st ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Customer / Table</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total (Rs.)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-4 font-bold text-stone-900">
                    {order.order_number}
                    {order.token_number && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        #{order.token_number}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-600">{order.order_type}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-stone-800">
                      {order.customer_name || order.customer?.name || 'Walk-in'}
                    </span>
                    {order.table && (
                      <span className="block text-[11px] text-stone-400">{order.table.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {order.items?.length || 0} items
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    Rs. {Number(order.total_amount).toFixed(0)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-400">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-600 hover:text-white text-stone-600 transition"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-lg text-stone-900">{selectedOrder.order_number}</h3>
                <p className="text-xs text-stone-500">
                  {selectedOrder.order_type} • Token #{selectedOrder.token_number}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status}
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 text-xs">
              {selectedOrder.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-1 border-b border-stone-100">
                  <div>
                    <span className="font-semibold text-stone-800">{item.product_name}</span>
                    <span className="text-stone-400 ml-2">× {item.quantity}</span>
                  </div>
                  <span className="font-bold text-stone-900">
                    Rs. {Number(item.total_price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 p-3 rounded-xl space-y-1.5 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal:</span>
                <span className="font-semibold text-stone-800">Rs. {Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tax:</span>
                <span className="font-semibold text-stone-800">Rs. {Number(selectedOrder.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-200">
                <span>Total:</span>
                <span className="text-amber-700">Rs. {Number(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
