import React, { useState } from 'react';
import {
  Coffee,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BookOpen,
  ChefHat,
  Receipt,
  QrCode,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  Smartphone,
  ChevronDown,
  Building2,
  Users,
  Store,
  Compass,
  DollarSign,
  UtensilsCrossed,
  ArrowUpRight,
  Flame,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: (tab?: 'pin' | 'email' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [activeDemoTab, setActiveDemoTab] = useState<'pos' | 'kds' | 'khata' | 'inventory'>('pos');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Simulated interactive POS state in preview
  const [demoCart, setDemoCart] = useState([
    { name: 'Ilam Special Masala Chiya', qty: 3, price: 40 },
    { name: 'Steam Chicken Momo', qty: 2, price: 180 },
    { name: 'Butter Croissant', qty: 1, price: 150 },
  ]);

  const [kdsItems, setKdsItems] = useState([
    { id: 1, name: 'Steam Chicken Momo (x2)', status: 'PREPARING', table: 'T-04 (Rooftop)', time: '3 min ago', priority: 'high' },
    { id: 2, name: 'Ilam Masala Chiya (x3)', status: 'READY', table: 'T-04 (Rooftop)', time: '1 min ago', priority: 'normal' },
    { id: 3, name: 'Chiya & Bun Maska (x1)', status: 'PENDING', table: 'T-01 (Indoor)', time: 'Just now', priority: 'normal' },
  ]);

  const subtotal = demoCart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const vat = Math.round(subtotal * 0.13);
  const grandTotal = subtotal + vat;

  const toggleKdsStatus = (id: number) => {
    setKdsItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const nextStatus = item.status === 'PENDING' ? 'PREPARING' : item.status === 'PREPARING' ? 'READY' : 'PENDING';
        return { ...item, status: nextStatus };
      })
    );
  };

  const faqs = [
    {
      q: 'Does ChiyaPasal support floor staff switching via quick PIN numbers?',
      a: 'Yes! Floor cashiers and waiters do not need to enter complex email passwords. They can instantly tap their staff avatar and enter their 4-digit PIN on any touch tablet, terminal, or phone to place orders and dispatch KOTs in seconds.',
    },
    {
      q: 'How does the digital Customer Khata (Udharo) system work?',
      a: 'ChiyaPasal has an integrated Udharo credit ledger built specifically for Nepalese community dining. You can set customer credit limits, track every unpaid meal ticket, record partial cash/Fonepay payments, and generate WhatsApp settlement reminders with zero ledger leaks.',
    },
    {
      q: 'Can it track raw ingredients like milk, tea leaves, and sugar automatically?',
      a: 'Absolutely. Using Recipe Bill of Materials (BOM), each menu item is linked to exact ingredient quantities (e.g. 1 cup Chiya = 120ml milk + 4g tea + 8g sugar). When a customer orders, raw inventory items are deducted automatically in real time.',
    },
    {
      q: 'Can customers settle bills via Fonepay QR or split payment?',
      a: 'Yes. ChiyaPasal supports instant Fonepay QR codes, direct cash, card, and split settlements (e.g., half cash and half Fonepay QR, or split equally across multiple diners).',
    },
    {
      q: 'Can I manage multiple branches or multiple floor areas?',
      a: 'Yes! You can configure custom floor areas (Indoor, Garden, Rooftop, Terrace, Takeaway) and manage multiple branches under a single owner account with unified sales analytics.',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-600 selection:text-white">
      {/* ─── TOP NOTIFICATION BANNER ─── */}
      <div className="bg-gradient-to-r from-amber-900/80 via-amber-800 to-amber-900/80 border-b border-amber-700/40 text-amber-200 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          🇳🇵 Nepal's First
        </span>
        <span>Dedicated Cafe, Tea House & Restaurant Operating System with Fonepay QR & Digital Khata</span>
        <button
          onClick={() => onLoginClick('register')}
          className="underline hover:text-white transition-colors ml-1 font-semibold hidden sm:inline"
        >
          Register Your Cafe →
        </button>
      </div>

      {/* ─── STICKY NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-stone-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 ring-1 ring-amber-400/30">
                <Coffee className="w-6 h-6 text-amber-100" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">ChiyaPasal</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  POS OS
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Hospitality & Business Operating System</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-amber-400 transition-colors">
              Interactive POS
            </a>
            <a href="#kds" className="hover:text-amber-400 transition-colors">
              Kitchen KDS
            </a>
            <a href="#khata" className="hover:text-amber-400 transition-colors">
              Khata Ledger
            </a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Quick Staff Floor PIN Login */}
            <button
              onClick={() => onLoginClick('pin')}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/80 transition-all cursor-pointer shadow-sm"
              title="Quick access for floor staff with 4-digit PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Staff PIN</span>
            </button>

            {/* Manager Sign In */}
            <button
              onClick={() => onLoginClick('email')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 transition-all cursor-pointer"
            >
              <span>Sign In</span>
            </button>

            {/* Primary Get Started */}
            <button
              onClick={() => onLoginClick('register')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Launch POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-amber-700/20 to-amber-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute -top-24 right-0 w-[450px] h-[450px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/90 border border-amber-600/30 text-amber-300 text-xs font-medium mb-8 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Built for Modern Cafes, Bakeries & Tea Lounges in Nepal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
            Fast Billing, Real-Time KDS &{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              Digital Udharo Khata
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-stone-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Eliminate lost kitchen tickets, untracked ingredient consumption, and manual ledger headaches.
            ChiyaPasal brings high-speed table POS, kitchen screens, recipe BOM inventory, and Fonepay settlements into one seamless platform.
          </p>

          {/* CTA Button Group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => onLoginClick('email')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-xl shadow-amber-900/40 hover:shadow-amber-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onLoginClick('pin')}
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-semibold bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700/80 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Floor Staff PIN Login</span>
            </button>
          </div>

          {/* Trust Value Badges */}
          <div className="mt-14 pt-8 border-t border-stone-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">&lt;1.5s Dispatch</p>
                <p className="text-xs text-stone-400">Order-to-Kitchen KOT</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Recipe BOM</p>
                <p className="text-xs text-stone-400">Auto Milk & Tea Grams</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Digital Khata</p>
                <p className="text-xs text-stone-400">Zero Unpaid Leaks</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Fonepay & Split</p>
                <p className="text-xs text-stone-400">Multi-Payment Settlement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE PRODUCT SHOWCASE SECTION ─── */}
      <section id="preview" className="py-20 bg-stone-950 border-y border-stone-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Live Product Experience</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Everything Your Floor & Kitchen Need to Run Flawlessly
            </p>
            <p className="text-stone-400 text-sm mt-3">
              Switch through the live interactive previews below to see how ChiyaPasal unifies your cafe workflow.
            </p>

            {/* Interactive Tab Switcher */}
            <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-stone-900 border border-stone-800 gap-1.5 shadow-xl">
              <button
                onClick={() => setActiveDemoTab('pos')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeDemoTab === 'pos'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>POS & Billing</span>
              </button>

              <button
                onClick={() => setActiveDemoTab('kds')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeDemoTab === 'kds'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                <span>Kitchen Display (KDS)</span>
              </button>

              <button
                onClick={() => setActiveDemoTab('khata')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeDemoTab === 'khata'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Khata / Udharo Ledger</span>
              </button>

              <button
                onClick={() => setActiveDemoTab('inventory')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeDemoTab === 'inventory'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Recipe BOM & Stock</span>
              </button>
            </div>
          </div>

          {/* Interactive Frame Container */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all">
            {/* Window title bar mockup */}
            <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-3 font-semibold text-stone-300">
                  {activeDemoTab === 'pos' && 'ChiyaPasal POS — Live Floor Terminal (Table T-04 Rooftop)'}
                  {activeDemoTab === 'kds' && 'ChiyaPasal Kitchen Display System — Live KOT Queue'}
                  {activeDemoTab === 'khata' && 'ChiyaPasal Customer Khata — Udharo Ledger & Credit Control'}
                  {activeDemoTab === 'inventory' && 'ChiyaPasal Inventory — Recipe BOM Ingredient Consumption'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Simulator
                </span>
              </div>
            </div>

            {/* TAB 1: POS & BILLING SIMULATOR */}
            {activeDemoTab === 'pos' && (
              <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side: Menu categories & quick items */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                        Chiya & Beverages
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-stone-800 text-stone-400 text-xs font-medium">
                        Bakery & Bites
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-stone-800 text-stone-400 text-xs font-medium">
                        Momo & Khaja
                      </span>
                    </div>
                    <span className="text-xs text-stone-400">Section: <strong>Rooftop Deck</strong></span>
                  </div>

                  {/* Grid of Menu Items */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Ilam Masala Chiya', price: 40, cat: 'Chiya', icon: '☕' },
                      { name: 'Matka Chiya', price: 60, cat: 'Chiya', icon: '🏺' },
                      { name: 'Steam Chicken Momo', price: 180, cat: 'Momo', icon: '🥟' },
                      { name: 'C-Momo Spicy', price: 210, cat: 'Momo', icon: '🌶️' },
                      { name: 'Butter Croissant', price: 150, cat: 'Bakery', icon: '🥐' },
                      { name: 'Bun Maska', price: 70, cat: 'Bakery', icon: '🍞' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDemoCart(prev => {
                            const exists = prev.find(p => p.name === item.name);
                            if (exists) {
                              return prev.map(p => (p.name === item.name ? { ...p, qty: p.qty + 1 } : p));
                            }
                            return [...prev, { name: item.name, qty: 1, price: item.price }];
                          });
                        }}
                        className="p-3.5 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-600/50 cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{item.icon}</span>
                          <span className="text-xs font-bold text-amber-400">रु {item.price}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">+ Tap to Add</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 flex items-center justify-between">
                    <span>💡 Tip: Click any menu item above to add it to the live cart.</span>
                    <button
                      onClick={() => setDemoCart([])}
                      className="text-amber-400 underline hover:text-amber-300 font-semibold"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>

                {/* Right side: Live Order Ticket */}
                <div className="lg:col-span-5 bg-stone-950/80 rounded-2xl border border-stone-800 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Order #ORD-108</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">Dine-In</span>
                        </p>
                        <p className="text-[11px] text-stone-400">Table: T-04 (Rooftop)</p>
                      </div>
                      <span className="text-[11px] text-stone-400">Server: Ramesh (PIN: 3333)</span>
                    </div>

                    {/* Cart Items */}
                    <div className="py-4 space-y-2.5 max-h-56 overflow-y-auto">
                      {demoCart.length === 0 ? (
                        <p className="text-xs text-stone-500 text-center py-6">Cart is empty. Tap items to add.</p>
                      ) : (
                        demoCart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-stone-800 text-stone-300 flex items-center justify-center font-bold text-[10px]">
                                {item.qty}x
                              </span>
                              <span className="text-stone-200 font-medium">{item.name}</span>
                            </div>
                            <span className="font-semibold text-white">रु {item.qty * item.price}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bill Summary & Actions */}
                  <div className="pt-4 border-t border-stone-800 space-y-2">
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>Subtotal</span>
                      <span>रु {subtotal}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>13% VAT</span>
                      <span>रु {vat}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-stone-800">
                      <span>Grand Total</span>
                      <span className="text-amber-400">रु {grandTotal}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <button
                        onClick={() => setActiveDemoTab('kds')}
                        className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                        <span>Send to KDS</span>
                      </button>
                      <button
                        onClick={() => onLoginClick('pin')}
                        className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-900/30"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Fonepay QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KITCHEN DISPLAY SYSTEM */}
            {activeDemoTab === 'kds' && (
              <div className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-amber-400" />
                      Kitchen Display System (KDS)
                    </h3>
                    <p className="text-xs text-stone-400">
                      Dispatched instantly from POS terminal. Click any ticket card to toggle status.
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    3 Active Orders
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kdsItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleKdsStatus(item.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        item.status === 'READY'
                          ? 'bg-emerald-950/30 border-emerald-800/80 shadow-emerald-900/20 shadow-lg'
                          : item.status === 'PREPARING'
                          ? 'bg-amber-950/30 border-amber-700/80 shadow-amber-900/20 shadow-lg'
                          : 'bg-stone-950/70 border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-stone-300">{item.table}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.status === 'READY'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'PREPARING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white mb-4">{item.name}</p>

                      <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-800/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {item.time}
                        </span>
                        <span className="text-[11px] text-amber-400 font-medium">Click to Advance →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOMER KHATA / UDHARO LEDGER */}
            {activeDemoTab === 'khata' && (
              <div className="p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-400" />
                      Digital Khata & Udharo Ledger
                    </h3>
                    <p className="text-xs text-stone-400">
                      Manage regular customer credit accounts, limits, and partial settlements without physical paper books.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl bg-stone-950 text-xs text-stone-300 border border-stone-800 font-semibold">
                      Total Outstanding: <strong className="text-amber-400">रु 8,450</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: 'Ramesh Sharma',
                      phone: '9841******',
                      balance: 3200,
                      limit: 5000,
                      lastBill: 'Order #ORD-101 (रु 450)',
                      status: 'Good Standing',
                    },
                    {
                      name: 'Sunita Rai (Cafe Regular)',
                      phone: '9851******',
                      balance: 5250,
                      limit: 6000,
                      lastBill: 'Order #ORD-98 (रु 890)',
                      status: 'Near Limit',
                    },
                  ].map((cust, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{cust.name}</p>
                          <p className="text-xs text-stone-400">{cust.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300">
                          {cust.status}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-400">Khata Balance</span>
                          <span className="font-bold text-amber-400">रु {cust.balance} / {cust.limit}</span>
                        </div>
                        <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full"
                            style={{ width: `${(cust.balance / cust.limit) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                        <span className="text-stone-400">Last activity: {cust.lastBill}</span>
                        <button
                          onClick={() => onLoginClick('email')}
                          className="text-amber-400 font-semibold hover:underline"
                        >
                          Settle Credit →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: RECIPE BOM & INVENTORY */}
            {activeDemoTab === 'inventory' && (
              <div className="p-6 lg:p-8">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Bill of Materials (BOM) & Auto Ingredient Deductions
                  </h3>
                  <p className="text-xs text-stone-400">
                    Each time an order is punched, raw ingredients are automatically subtracted from inventory.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { item: 'Pure Cow Milk', stock: '22.4 Litres', unitCost: 'रु 85/L', status: 'Healthy', percent: 74 },
                    { item: 'Ilam CTC Tea Leaves', stock: '4.8 Kg', unitCost: 'रु 420/Kg', status: 'Healthy', percent: 62 },
                    { item: 'Refined Sugar', stock: '1.2 Kg', unitCost: 'रु 105/Kg', status: 'Low Stock Alert', percent: 18 },
                  ].map((ing, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{ing.item}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ing.percent < 25
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {ing.status}
                        </span>
                      </div>

                      <div>
                        <p className="text-xl font-extrabold text-white">{ing.stock}</p>
                        <p className="text-xs text-stone-400 mt-0.5">Unit Cost: {ing.unitCost}</p>
                      </div>

                      <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ing.percent < 25 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${ing.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-center justify-between">
                  <span>
                    ☕ <strong>Recipe Example:</strong> 1 Cup Masala Chiya = 120ml Milk + 4g Tea Leaves + 8g Sugar. Cost: रु 12.80 | Price: रु 40.00 (68% Margin)
                  </span>
                  <button
                    onClick={() => onLoginClick('email')}
                    className="text-amber-400 font-bold hover:underline shrink-0 ml-3"
                  >
                    View Recipe Editor →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── CORE FEATURE GRID (BENTO BOX) ─── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Comprehensive Operating Suite</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
            Engineered Specifically for Nepalese Food & Beverage
          </h2>
          <p className="text-stone-400 text-base mt-4">
            From the busiest morning chiya rush in Kathmandu to relaxed evening rooftop diners, ChiyaPasal keeps every department coordinated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-stone-950/80 border border-stone-800/90 hover:border-amber-600/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dual PIN & Web Access</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Waiters and cashiers switch accounts in under 1 second using simple 4-digit PINs, while managers enjoy deep operational dashboards.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-stone-800 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Touch-first POS Keypad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-stone-950/80 border border-stone-800/90 hover:border-amber-600/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Paperless Kitchen Display</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Dispatch orders straight to kitchen screens with color-coded preparation timers. Stop losing paper KOTs during lunch and evening peaks.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-stone-800 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Zero ticket mix-ups</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-stone-950/80 border border-stone-800/90 hover:border-amber-600/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Customer Udharo / Khata</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Maintain trust with regular corporate clients and neighbors without losing a rupee. Track individual balances and set strict credit ceilings.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-stone-800 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Audited credit histories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-stone-950/80 border border-stone-800/90 hover:border-amber-600/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Recipe BOM Inventory</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Map raw ingredients (tea leaves, milk, spices, flour, meat) to finished menu items. Know exact margins and catch stock shrinkages early.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-stone-800 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Gram-level accuracy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-8 rounded-3xl bg-stone-950/80 border border-stone-800/90 hover:border-amber-600/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Fonepay QR & Split Bills</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Display dynamic Fonepay QR codes on guest checks or customer screens. Easily split single checks across cash, QR, and credit.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-stone-800 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Instant payment verification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-8 rounded-3xl bg-stone-950/80 border border-stone-800/90 hover:border-amber-600/40 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Floor & Analytics</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Design custom floor plans (Garden, Indoor, Rooftop) and review end-of-day sales, category breakdowns, and tax summaries with one tap.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-stone-800 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>End-of-day cash reconciliation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TAILORED FOR NEPALESE BUSINESSES ─── */}
      <section className="py-20 bg-stone-950 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">Versatile Deployments</h2>
            <p className="text-3xl font-extrabold text-white mt-2">Perfect For Any Hospitality Format</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
              <span className="text-3xl">☕</span>
              <h3 className="font-bold text-white">Chiya Stalls & Addas</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                High-speed express counter orders, fast-moving morning rush, and quick cash/QR billing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
              <span className="text-3xl">🥐</span>
              <h3 className="font-bold text-white">Bakeries & Cafes</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Track baked goods inventory, coffee bean usage, takeaway boxes, and loyalty points.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
              <span className="text-3xl">🥟</span>
              <h3 className="font-bold text-white">Momo Hubs & Khaja Ghars</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Fast kitchen KDS tickets for steam/fried/C-momo orders with table number mapping.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
              <span className="text-3xl">🍽️</span>
              <h3 className="font-bold text-white">Restro-Bars & Lounges</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Multi-floor table tracking, split checks, bar KOTs, and end-of-day VAT invoices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ACCORDION ─── */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Common Questions</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-5 text-left font-bold text-stone-200 flex items-center justify-between gap-4 cursor-pointer hover:text-white"
              >
                <span className="text-sm sm:text-base">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-stone-400 shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 text-xs sm:text-sm text-stone-400 leading-relaxed border-t border-stone-800/80 pt-4 animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ─── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-t border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-6 shadow-xl">
            <Coffee className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Run a Faster, Smarter Cafe?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-stone-300 max-w-2xl mx-auto">
            Get started today. Log in with your staff PIN or sign up your business in under 2 minutes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onLoginClick('email')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Get Started / Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onLoginClick('pin')}
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Staff PIN Floor Terminal</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-stone-950 border-t border-stone-800/80 py-12 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">ChiyaPasal POS & OS</p>
              <p className="text-[11px] text-stone-500">Nepal's Modern Hospitality Management Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-stone-400">
            <button onClick={() => onLoginClick('pin')} className="hover:text-amber-400 transition-colors">
              Staff PIN
            </button>
            <button onClick={() => onLoginClick('email')} className="hover:text-amber-400 transition-colors">
              Manager Login
            </button>
            <button onClick={() => onLoginClick('register')} className="hover:text-amber-400 transition-colors">
              Onboard Business
            </button>
          </div>

          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>All Systems Operational (Kathmandu, Nepal)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
