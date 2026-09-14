import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Building2,
  Phone,
  User,
  Delete,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Crown,
  Receipt,
  ChefHat,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';

interface BranchStaff {
  id: string;
  name: string;
  role: string;
  branchName: string;
  hasPin: boolean;
}

export const Login: React.FC = () => {
  const { setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pin' | 'email' | 'register'>('pin');

  // Staff PIN states
  const [staffList, setStaffList] = useState<BranchStaff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<BranchStaff | null>(null);
  const [pin, setPin] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  // Email login states
  const [email, setEmail] = useState('admin@chhiyapasal.np');
  const [password, setPassword] = useState('admin123');

  // Registration states
  const [regData, setRegData] = useState({
    businessName: '',
    branchName: 'Main Branch',
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  useEffect(() => {
    loadBranchStaff();
  }, []);

  const loadBranchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get('/auth/branch-staff');
      const staff: BranchStaff[] = res.data.data || [];
      setStaffList(staff);
      if (staff.length > 0) {
        // default select the cashier or first staff member
        const cashier = staff.find((s) => s.role === 'CASHIER') || staff[0];
        setSelectedStaff(cashier);
      }
    } catch (err) {
      console.error('Failed to load branch staff list', err);
    } finally {
      setStaffLoading(false);
    }
  };

  // ── PIN Keypad Handlers ──
  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      // Auto-submit when 4 digits reached if a staff member is selected
      if (newPin.length === 4 && selectedStaff) {
        submitPinLogin(newPin, selectedStaff.id);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPin('');
  };

  const submitPinLogin = async (pinToSubmit?: string, employeeId?: string) => {
    const finalPin = pinToSubmit || pin;
    if (!finalPin || finalPin.length < 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login-pin', {
        pin: finalPin,
        employeeId: employeeId || selectedStaff?.id,
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect PIN code');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // ── Email Login Handler ──
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register New Cafe Handler ──
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regData.businessName.trim() || !regData.name.trim() || !regData.email.trim() || !regData.password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (regData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        businessName: regData.businessName.trim(),
        branchName: regData.branchName.trim() || 'Main Branch',
        name: regData.name.trim(),
        email: regData.email.trim(),
        password: regData.password,
        phone: regData.phone.trim() || undefined,
        currency: 'NPR',
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Quick Demo helper ──
  const quickEmailLogin = (e: string, p: string) => {
    setActiveTab('email');
    setEmail(e);
    setPassword(p);
    setError('');
  };

  const quickPinLogin = (empRole: string, demoPin: string) => {
    setActiveTab('pin');
    const target = staffList.find((s) => s.role === empRole);
    if (target) {
      setSelectedStaff(target);
    }
    setPin(demoPin);
    submitPinLogin(demoPin, target?.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-stone-900/90 border border-stone-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden text-stone-200">
        {/* Brand Banner */}
        <div className="pt-8 pb-6 px-8 flex flex-col items-center border-b border-stone-800/80 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 mb-3">
            <Coffee className="w-8 h-8 text-amber-100" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ChiyaPasal POS</h1>
          <p className="text-xs text-stone-400 mt-1">Smart Restaurant & Tea Shop Management System</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 bg-stone-950/60 p-1.5 border-b border-stone-800 text-xs font-semibold text-stone-400">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pin');
              setError('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pin'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Staff PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setError('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'email'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'register'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>New Cafe</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-8 mt-5 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── TAB 1: STAFF PIN LOGIN (Touch-friendly Keypad) ─── */}
        {activeTab === 'pin' && (
          <div className="p-8 pt-6">
            <p className="text-xs text-stone-400 font-medium text-center mb-3">
              Select your profile or punch your 4-digit staff PIN:
            </p>

            {/* Staff Horizontal Carousel / Grid */}
            {staffList.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-5">
                {staffList.map((staff) => {
                  const isSelected = selectedStaff?.id === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setSelectedStaff(staff);
                        setPin('');
                        setError('');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm shadow-amber-900/30'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:bg-stone-800/50 hover:border-stone-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-800 mx-auto mb-1 flex items-center justify-center text-xs font-bold text-amber-400">
                        {staff.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-xs font-bold truncate">{staff.name.split(' ')[0]}</p>
                      <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-stone-800 text-stone-400 mt-0.5">
                        {staff.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* PIN Mask Display */}
            <div className="flex flex-col items-center mb-5">
              <div className="flex items-center gap-3 py-2 px-6 rounded-2xl bg-stone-950 border border-stone-800/80">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                        filled
                          ? 'bg-amber-500 border-amber-400 shadow-md shadow-amber-500/50 scale-110'
                          : 'border-stone-700 bg-stone-900'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                Logging in as: <span className="text-amber-400 font-semibold">{selectedStaff?.name || 'Staff Member'}</span>
              </p>
            </div>

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-14 rounded-2xl bg-stone-800/80 hover:bg-stone-700 active:scale-95 text-xl font-bold text-white shadow-sm transition-all flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-xs font-bold text-stone-400 hover:text-stone-200 active:scale-95 transition-all flex items-center justify-center uppercase tracking-wider"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-stone-800/80 hover:bg-stone-700 active:scale-95 text-xl font-bold text-white shadow-sm transition-all flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 active:scale-95 transition-all flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {pin.length >= 4 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => submitPinLogin()}
                className="w-full mt-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
              >
                {loading ? 'Verifying PIN...' : 'Confirm Login'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ─── TAB 2: ADMIN EMAIL LOGIN ─── */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="admin@chhiyapasal.np"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In as Manager / Owner'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── TAB 3: REGISTER NEW CAFE ─── */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-8 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Cafe / Restaurant Name <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Coffee className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={regData.businessName}
                  onChange={(e) => setRegData({ ...regData, businessName: e.target.value })}
                  placeholder="e.g. Himalayan Chiya Corner"
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Owner Full Name <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="Suresh Shrestha"
                    className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Owner Email Address <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="owner@mycafe.np"
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Owner Password <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Setting up Cafe...' : 'Register & Start Using POS'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── COLLAPSIBLE DEMO CREDENTIALS DRAWER ─── */}
        <div className="border-t border-stone-800/80 bg-stone-950/50">
          <button
            type="button"
            onClick={() => setShowDemoDrawer(!showDemoDrawer)}
            className="w-full px-6 py-3 flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Quick Fill Demo Accounts (Testing Only)
            </span>
            {showDemoDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDemoDrawer && (
            <div className="p-6 pt-1 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => quickPinLogin('OWNER', '0000')}
                className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-left transition border border-stone-700/60"
              >
                <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                  <Crown className="w-3 h-3" />
                  <span>Owner</span>
                </div>
                <p className="text-[10px] text-stone-300 mt-0.5">PIN: 0000</p>
              </button>

              <button
                type="button"
                onClick={() => quickPinLogin('CASHIER', '1111')}
                className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-left transition border border-stone-700/60"
              >
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <Receipt className="w-3 h-3" />
                  <span>Cashier</span>
                </div>
                <p className="text-[10px] text-stone-300 mt-0.5">PIN: 1111</p>
              </button>

              <button
                type="button"
                onClick={() => quickPinLogin('KITCHEN_STAFF', '2222')}
                className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-left transition border border-stone-700/60"
              >
                <div className="flex items-center gap-1 text-orange-400 font-bold text-[11px]">
                  <ChefHat className="w-3 h-3" />
                  <span>Kitchen</span>
                </div>
                <p className="text-[10px] text-stone-300 mt-0.5">PIN: 2222</p>
              </button>

              <button
                type="button"
                onClick={() => quickEmailLogin('admin@chhiyapasal.np', 'admin123')}
                className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-left transition border border-stone-700/60"
              >
                <div className="flex items-center gap-1 text-indigo-400 font-bold text-[11px]">
                  <Mail className="w-3 h-3" />
                  <span>Password</span>
                </div>
                <p className="text-[10px] text-stone-300 mt-0.5">admin123</p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
