import React, { useState, useEffect } from 'react';
import { Coffee, Plus, Search, Check, X, Tag } from 'lucide-react';
import { api } from '../api/client';

export const Menu: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Product form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(pRes.data.data || []);
      setCategories(cRes.data.data || []);
      if (cRes.data.data?.length > 0) {
        setCategoryId(cRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load menu items', err);
    }
  };

  const handleToggleAvailability = async (product: any) => {
    try {
      await api.patch(`/products/${product.id}`, {
        is_available: !product.is_available,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle availability', err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await api.post('/products', {
        name,
        category_id: categoryId,
        price,
        tax_rate: taxRate,
      });
      setShowAddModal(false);
      setName('');
      setPrice(0);
      setTaxRate(0);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 bg-white border-b border-stone-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            Menu Products & Pricing
          </h2>
          <p className="text-xs text-stone-500">
            Configure food and drink menu items, prices, and availability
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-800/20 transition"
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-white border-b border-stone-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (NPR)</th>
                <th className="py-3 px-4">VAT Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-4 font-bold text-stone-900">{p.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200">
                      {p.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    Rs. {Number(p.price).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-stone-500">{Number(p.tax_rate) > 0 ? `${p.tax_rate}%` : '0%'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.is_available ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleAvailability(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        p.is_available
                          ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {p.is_available ? 'Mark Out of Stock' : 'Mark Available'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-stone-900">Add Menu Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardamom Tea"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Price (NPR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  VAT Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-800/20 mt-2"
              >
                {isProcessing ? 'Saving...' : 'Create Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
