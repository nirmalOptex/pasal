import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  QrCode,
  Banknote,
  BookOpen,
  CreditCard,
  CheckCircle2,
  X,
  User,
  Coffee,
  KeyRound,
  ArrowRightLeft,
} from 'lucide-react';
import { api } from '../api/client';
import { usePosStore, CartItem } from '../store/pos.store';
import { useAuthStore } from '../store/auth.store';
import { OrderType, PaymentMethod } from '@chhiyapasal/shared-types';

export const POS: React.FC = () => {
  const { user, branchId, setAuth } = useAuthStore();
  const {
    orderType,
    setOrderType,
    selectedTableId,
    selectedTableName,
    setTable,
    customerNameInput,
    setCustomerNameInput,
    notes,
    setNotes,
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotalTax,
    getTotal,
  } = usePosStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showTableModal, setShowTableModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  // Switch staff states
  const [showSwitchStaffModal, setShowSwitchStaffModal] = useState(false);
  const [switchPin, setSwitchPin] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);

  const handleSwitchStaff = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!switchPin || switchPin.length < 4) {
      setSwitchError('Please enter your 4-digit PIN');
      return;
    }
    setSwitchLoading(true);
    setSwitchError('');
    try {
      const res = await api.post('/auth/login-pin', { pin: switchPin });
      const { user: newUser, accessToken, refreshToken } = res.data.data;
      setAuth(newUser, accessToken, refreshToken);
      setShowSwitchStaffModal(false);
      setSwitchPin('');
    } catch (err: any) {
      setSwitchError(err.response?.data?.message || 'Incorrect PIN code');
    } finally {
      setSwitchLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [branchId]);

  const fetchInitialData = async () => {
    try {
      const [catRes, prodRes, tableRes, custRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products'),
        api.get('/tables'),
        api.get('/customers'),
      ]);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setTables(tableRes.data.data || []);
      setCustomers(custRes.data.data || []);
    } catch (err) {
      console.error('Failed to load POS data', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const total = getTotal();
  const change = Math.max(0, cashTendered - total);

  // Place Order & Pay Workflow
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Create Order
      const orderPayload = {
        orderType,
        tableId: orderType === OrderType.DINE_IN ? selectedTableId : null,
        customerName: customerNameInput || 'Walk-in Customer',
        notes,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const orderRes = await api.post('/orders', orderPayload);
      const createdOrder = orderRes.data.data;

      // 2. Confirm Order immediately to send KOT
      await api.post(`/orders/${createdOrder.id}/confirm`);

      // 3. Generate Invoice
      const invoiceRes = await api.post(`/invoices/generate/${createdOrder.id}`);
      const invoice = invoiceRes.data.data;

      // 4. Process Payment
      const paymentRes = await api.post('/payments', {
        invoiceId: invoice.id,
        payments: [
          {
            paymentMethod: activePaymentMethod,
            amount: invoice.total_amount,
            notes: `Paid via ${activePaymentMethod}`,
          },
        ],
      });

      setSuccessReceipt({
        orderNumber: createdOrder.order_number,
        tokenNumber: createdOrder.token_number,
        invoiceNumber: invoice.invoice_number,
        total: invoice.total_amount,
        method: activePaymentMethod,
        table: selectedTableName,
        time: new Date().toLocaleTimeString(),
      });

      clearCart();
      setShowPaymentModal(false);
      fetchInitialData(); // Refresh tables
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-stone-100">
      {/* ─── LEFT: Menu & Catalog (Speedy Grid) ─── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-stone-200">
        {/* Top Control Bar: Search & Categories */}
        <div className="p-4 bg-white border-b border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search Chiya, Momo, Khaja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white transition"
              />
            </div>

            {/* Order Type Tabs */}
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setOrderType(OrderType.DINE_IN)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  orderType === OrderType.DINE_IN
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Dine-In
              </button>
              <button
                onClick={() => setOrderType(OrderType.TAKEAWAY)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  orderType === OrderType.TAKEAWAY
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Takeaway
              </button>
              <button
                onClick={() => setOrderType(OrderType.DELIVERY)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  orderType === OrderType.DELIVERY
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Delivery
              </button>
            </div>

            {/* Quick Switch Staff Button */}
            <button
              type="button"
              onClick={() => {
                setSwitchPin('');
                setSwitchError('');
                setShowSwitchStaffModal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs font-semibold text-stone-700 transition"
              title="Click to Switch Staff"
            >
              <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user?.name?.slice(0, 1) || 'U'}
              </div>
              <span className="hidden sm:inline font-bold text-stone-900">{user?.name?.split(' ')[0]}</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                {user?.role}
              </span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.productId === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition group relative bg-white hover:border-amber-500 hover:shadow-md ${
                    inCart ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-200'
                  }`}
                >
                  {inCart && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {inCart.quantity}
                    </span>
                  )}
                  <div>
                    <span className="text-[10px] font-semibold text-amber-600 tracking-wider uppercase">
                      {product.category?.name || 'Item'}
                    </span>
                    <h3 className="font-semibold text-stone-900 text-sm leading-snug group-hover:text-amber-800 transition">
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="text-sm font-bold text-stone-900">
                      Rs. {Number(product.price).toFixed(0)}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Current Order Cart ─── */}
      <div className="w-96 bg-white flex flex-col justify-between shadow-xl">
        {/* Cart Header */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              Current Ticket
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Table / Customer Details Selection */}
          <div className="grid grid-cols-2 gap-2">
            {orderType === OrderType.DINE_IN ? (
              <button
                onClick={() => setShowTableModal(true)}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold text-left transition ${
                  selectedTableId
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-dashed border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className="block text-[10px] text-stone-400 uppercase">Table</span>
                {selectedTableName || 'Assign Table +'}
              </button>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <span className="block text-[10px] text-stone-400 uppercase">Order Type</span>
                <span className="font-semibold text-stone-800">{orderType}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                className="w-full h-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <Coffee className="w-12 h-12 text-stone-300 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs">Select items from menu to begin</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-xs text-stone-900 leading-tight">{item.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">Rs. {item.price} each</p>
                  </div>
                  <span className="font-bold text-xs text-stone-900">
                    Rs. {(item.price * item.quantity).toFixed(0)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:bg-stone-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-stone-800 px-1.5">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:bg-stone-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-stone-400 hover:text-red-500 p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Checkout Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
          <div className="space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-800">Rs. {getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (VAT)</span>
              <span className="font-semibold text-stone-800">Rs. {getTotalTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Grand Total</span>
              <span className="text-amber-700 text-base">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => {
              setCashTendered(Math.ceil(total));
              setShowPaymentModal(true);
            }}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-800/20 flex items-center justify-center gap-2 transition"
          >
            <Banknote className="w-4 h-4" />
            Proceed to Payment (Rs. {total.toFixed(0)})
          </button>
        </div>
      </div>

      {/* ─── MODAL: Table Selection ─── */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-stone-900">Select Dining Table</h3>
              <button onClick={() => setShowTableModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {tables.map((table) => {
                const isOccupied = table.status === 'OCCUPIED';
                return (
                  <button
                    key={table.id}
                    disabled={isOccupied}
                    onClick={() => {
                      setTable(table.id, table.name);
                      setShowTableModal(false);
                    }}
                    className={`p-3 rounded-xl border text-center transition ${
                      isOccupied
                        ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                        : selectedTableId === table.id
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-stone-200 hover:border-amber-500 hover:bg-amber-50/50'
                    }`}
                  >
                    <p className="font-bold text-sm text-stone-900">{table.name}</p>
                    <p className="text-[10px] text-stone-500">{table.area?.name || 'Area'}</p>
                    <span
                      className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isOccupied ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {table.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Payment Checkout ─── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900">Accept Payment</h3>
                <p className="text-xs text-stone-500">Order Total: Rs. {total.toFixed(2)}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { method: PaymentMethod.CASH, label: 'Cash', icon: Banknote },
                { method: PaymentMethod.QR, label: 'QR Pay', icon: QrCode },
                { method: PaymentMethod.CARD, label: 'Card', icon: CreditCard },
                { method: PaymentMethod.CREDIT, label: 'Khata', icon: BookOpen },
              ].map((m) => {
                const Icon = m.icon;
                const isSel = activePaymentMethod === m.method;
                return (
                  <button
                    key={m.method}
                    onClick={() => setActivePaymentMethod(m.method)}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      isSel
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-sm'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSel ? 'text-amber-600' : 'text-stone-400'}`} />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Payment Details */}
            {activePaymentMethod === PaymentMethod.CASH && (
              <div className="space-y-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 mb-5">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                    Cash Tendered
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-base font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  {[500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(amt)}
                      className="px-2.5 py-1 bg-white border border-stone-300 rounded-md text-xs font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      Rs. {amt}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-sm font-bold">
                  <span className="text-stone-600">Change Due:</span>
                  <span className="text-emerald-700 text-base">Rs. {change.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* QR Payment simulated visual */}
            {activePaymentMethod === PaymentMethod.QR && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 mb-5 flex flex-col items-center text-center">
                <div className="w-36 h-36 bg-white p-2 border border-stone-300 rounded-lg shadow-sm flex items-center justify-center mb-2">
                  <QrCode className="w-28 h-28 text-stone-800" />
                </div>
                <p className="text-xs font-bold text-stone-800">Scan via Fonepay / eSewa / Khalti</p>
                <p className="text-[11px] text-stone-500">Pay Exactly: Rs. {total.toFixed(2)}</p>
              </div>
            )}

            {/* Khata / Credit warning */}
            {activePaymentMethod === PaymentMethod.CREDIT && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-xs text-amber-900">
                <p className="font-bold mb-1">Customer Credit Charge</p>
                <p>
                  Rs. {total.toFixed(2)} will be debited to {customerNameInput || 'Customer'}'s Khata account.
                </p>
              </div>
            )}

            <button
              disabled={isProcessing}
              onClick={handleCheckout}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-800/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isProcessing ? 'Completing...' : `Complete Sale & Print KOT`}
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: Success Receipt ─── */}
      {successReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-stone-900">Order Confirmed!</h3>
            <p className="text-xs text-stone-500 mb-4">KOT has been dispatched to kitchen</p>

            <div className="bg-stone-50 p-4 rounded-xl text-left text-xs space-y-1.5 border border-stone-200 mb-4">
              <div className="flex justify-between">
                <span className="text-stone-500">Order #:</span>
                <span className="font-bold text-stone-800">{successReceipt.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Kitchen Token:</span>
                <span className="font-bold text-amber-700 text-sm">#{successReceipt.tokenNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Invoice #:</span>
                <span className="font-semibold text-stone-700">{successReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Method:</span>
                <span className="font-semibold text-stone-700">{successReceipt.method}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-sm">
                <span>Amount Paid:</span>
                <span className="text-emerald-700">Rs. {Number(successReceipt.total).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
            >
              Done & Start Next Order
            </button>
          </div>
        </div>
      )}
      {/* ─── SWITCH STAFF MODAL ─── */}
      {showSwitchStaffModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Switch Staff Member</h3>
                  <p className="text-[10px] text-stone-400">Enter your 4-digit PIN</p>
                </div>
              </div>
              <button
                onClick={() => setShowSwitchStaffModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSwitchStaff} className="p-6 space-y-4">
              {switchError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {switchError}
                </div>
              )}

              <div className="text-center">
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  required
                  value={switchPin}
                  onChange={(e) => setSwitchPin(e.target.value)}
                  placeholder="••••"
                  className="w-full border border-stone-300 rounded-xl py-3 text-3xl tracking-[0.4em] text-center font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                />
                <p className="text-[11px] text-stone-400 mt-2">
                  Demo PINs: Owner: 0000 | Cashier: 1111 | Kitchen: 2222
                </p>
              </div>

              {/* Quick 10-key numbers */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      if (switchPin.length < 6) {
                        const newP = switchPin + d;
                        setSwitchPin(newP);
                        if (newP.length === 4) {
                          setTimeout(() => {
                            api.post('/auth/login-pin', { pin: newP })
                              .then((res) => {
                                const { user: newUser, accessToken, refreshToken } = res.data.data;
                                setAuth(newUser, accessToken, refreshToken);
                                setShowSwitchStaffModal(false);
                                setSwitchPin('');
                              })
                              .catch((err) => {
                                setSwitchError(err.response?.data?.message || 'Incorrect PIN');
                              });
                          }, 100);
                        }
                      }
                    }}
                    className="h-10 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-800 text-base active:scale-95 transition"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSwitchPin('')}
                  className="h-10 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-500 text-xs uppercase"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setSwitchPin((p) => p + '0')}
                  className="h-10 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-800 text-base active:scale-95 transition"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setSwitchPin((p) => p.slice(0, -1))}
                  className="h-10 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-500 text-xs uppercase"
                >
                  ⌫
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchStaffModal(false)}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={switchLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow disabled:opacity-50"
                >
                  {switchLoading ? 'Switching...' : 'Switch Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
