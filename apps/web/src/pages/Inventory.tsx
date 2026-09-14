import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Search, Edit, X } from 'lucide-react';
import { api } from '../api/client';
import { InventoryTransactionType } from '@chhiyapasal/shared-types';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<InventoryTransactionType>(InventoryTransactionType.ADJUSTMENT);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data.data || []);
    } catch (err) {
      console.error('Failed to load inventory', err);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsProcessing(true);

    try {
      await api.post(`/inventory/${selectedItem.id}/adjust`, {
        quantity: adjustQty,
        type: adjustType,
        notes: adjustNotes || 'Manual stock update',
      });
      setSelectedItem(null);
      setAdjustQty(0);
      setAdjustNotes('');
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stock adjustment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 bg-white border-b border-stone-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Raw Ingredients & Inventory Stock
          </h2>
          <p className="text-xs text-stone-500">
            Monitor real-time consumption, reorder levels, and ingredient movements
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-white border-b border-stone-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search milk, tea leaves, sugar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Ingredient / Item</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Threshold</th>
                <th className="py-3 px-4">Cost / Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map((item) => {
                const stock = Number(item.current_stock);
                const threshold = Number(item.low_stock_threshold);
                const isLow = stock <= threshold;

                return (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-bold text-stone-900">{item.name}</td>
                    <td className="py-3 px-4 font-bold text-sm">
                      {stock.toFixed(2)} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {threshold.toFixed(2)} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      {item.cost_per_unit ? `Rs. ${item.cost_per_unit}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setAdjustQty(0);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-600 hover:text-white text-stone-700 font-semibold text-[11px] transition"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-stone-900">Adjust Ingredient Stock</h3>
              <button onClick={() => setSelectedItem(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Ingredient:</span>
                  <span className="font-bold text-stone-800">{selectedItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Current Stock:</span>
                  <span className="font-bold text-stone-900">
                    {Number(selectedItem.current_stock).toFixed(2)} {selectedItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Operation Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                >
                  <option value={InventoryTransactionType.ADJUSTMENT}>Correction / Stock Adjustment (+/-)</option>
                  <option value={InventoryTransactionType.PURCHASE}>Direct Purchase / Addition (+)</option>
                  <option value={InventoryTransactionType.WASTAGE}>Spoilage / Wastage (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Quantity Change ({selectedItem.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. +5 or -2"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spoilage or Physical audit"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-800/20 mt-2"
              >
                {isProcessing ? 'Updating...' : 'Save Stock Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
