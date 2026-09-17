import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Building2,
  Phone,
  User,
  Delete,
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2,
  XCircle,
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
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Email login states
  const [email, setEmail] = useState(() => localStorage.getItem('cp_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('cp_remembered_email')));
  const [showForgotHelp, setShowForgotHelp] = useState(false);

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

  // Load staff list on initial mount
  useEffect(() => {
    loadBranchStaff();
  }, []);

  // Keyboard shortcut listener for PIN entry (support physical keyboards & POS numpads)
  useEffect(() => {
    if (activeTab !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focused on input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleKeypadClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length >= 4) {
          submitPinLogin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, pin, selectedStaff]);

  const loadBranchStaff = async () => {
    setStaffLoading(true);
    setConnectionError(null);
    try {
      const res = await api.get('/auth/branch-staff');
      // Detect if Vercel SPA rewrite returned index.html due to misconfigured API URL
      if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE')) {
        throw new Error('API returned HTML instead of JSON. Check your API configuration.');
      }
      const staff: BranchStaff[] = res.data?.data || [];
      setStaffList(staff);
      if (staff.length > 0) {
        // Pre-select first cashier or first staff member
        const defaultStaff = staff.find((s) => s.role === 'CASHIER') || staff[0];
        setSelectedStaff(defaultStaff);
      }
    } catch (err: any) {
      console.error('Failed to load branch staff list', err);
      setConnectionError(err.message || 'Unable to connect to branch server');
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
      // Auto-submit when 4 digits reached if staff member is selected
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
      setError('Please enter your 4-digit staff PIN');
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
      setError(err.response?.data?.message || 'Incorrect PIN code. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // ── Email Login Handler ──
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const { user, accessToken, refreshToken } = res.data.data;

      // Remember email preference
      if (rememberMe) {
        localStorage.setItem('cp_remembered_email', email.trim());
      } else {
        localStorage.removeItem('cp_remembered_email');
      }

      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
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
      setError('Password must be at least 6 characters long.');
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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'BRANCH_MANAGER':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'CASHIER':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'KITCHEN_STAFF':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'WAITER':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default:
        return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-stone-900/90 border border-stone-800 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden text-stone-200 transition-all">
        {/* Brand Banner */}
        <div className="pt-8 pb-6 px-8 flex flex-col items-center border-b border-stone-800/80 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 mb-3 ring-1 ring-amber-500/20">
            <Coffee className="w-8 h-8 text-amber-100" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ChiyaPasal POS</h1>
          <p className="text-xs text-stone-400 mt-1">Hospitality Management & Billing System</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 bg-stone-950/60 p-1.5 border-b border-stone-800 text-xs font-semibold text-stone-400">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pin');
              setError('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Manager Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
          <div className="mx-8 mt-5 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── TAB 1: STAFF PIN LOGIN (Touch Keypad) ─── */}
        {activeTab === 'pin' && (
          <div className="p-8 pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-stone-400 font-medium">
                {selectedStaff ? (
                  <span>
                    Logging in as: <strong className="text-white">{selectedStaff.name}</strong>
                  </span>
                ) : (
                  <span>Select profile or enter 4-digit staff PIN:</span>
                )}
              </p>
              {selectedStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaff(null);
                    setPin('');
                    setError('');
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Clear profile
                </button>
              )}
            </div>

            {/* Staff Horizontal Carousel / Grid */}
            {staffLoading ? (
              <div className="flex items-center justify-center py-4 mb-4 text-xs text-stone-400 gap-2 bg-stone-950/30 rounded-xl border border-stone-800/50">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading active staff…</span>
              </div>
            ) : connectionError ? (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Staff Directory Disconnected
                  </span>
                  <button
                    type="button"
                    onClick={loadBranchStaff}
                    className="underline text-amber-200 hover:text-white font-medium cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-stone-400">{connectionError}</p>
              </div>
            ) : staffList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
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
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-950/50 border-amber-500 text-white shadow-sm shadow-amber-900/40 ring-1 ring-amber-500/40'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:bg-stone-850 hover:border-stone-700'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-stone-800 mx-auto mb-1.5 flex items-center justify-center text-xs font-bold text-amber-300 border border-stone-700/50">
                        {staff.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold truncate text-stone-100">{staff.name.split(' ')[0]}</p>
                      <span
                        className={`inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border mt-1 ${getRoleBadgeStyle(
                          staff.role
                        )}`}
                      >
                        {staff.role.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* PIN Mask Display */}
            <div className="flex flex-col items-center mb-5">
              <div className="flex items-center gap-3 py-2.5 px-6 rounded-2xl bg-stone-950 border border-stone-800 shadow-inner">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-amber-500 shadow-sm shadow-amber-500/50 scale-110'
                          : 'bg-stone-800 border border-stone-700'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5 font-medium">Use on-screen keypad or keyboard numpad</p>
            </div>

            {/* 3x4 Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-13 rounded-2xl bg-stone-950/70 hover:bg-stone-800 active:scale-95 text-xl font-bold text-white border border-stone-800/80 shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-13 rounded-2xl bg-stone-950/40 hover:bg-stone-800 text-xs font-bold text-stone-400 hover:text-stone-200 active:scale-95 border border-stone-800/60 transition-all flex items-center justify-center uppercase tracking-wider cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-13 rounded-2xl bg-stone-950/70 hover:bg-stone-800 active:scale-95 text-xl font-bold text-white border border-stone-800/80 shadow-sm transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-13 rounded-2xl bg-stone-950/40 hover:bg-stone-800 text-stone-400 hover:text-stone-200 active:scale-95 border border-stone-800/60 transition-all flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {pin.length >= 4 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => submitPinLogin()}
                className="w-full mt-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
              >
                {loading ? 'Verifying PIN...' : 'Confirm Login'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ─── TAB 2: MANAGER / ADMIN EMAIL LOGIN ─── */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-stone-600"
                  placeholder="manager@cafe.np"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotHelp(!showForgotHelp)}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-stone-600"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password guidance */}
            {showForgotHelp && (
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300 animate-in fade-in duration-150">
                <p className="font-semibold text-amber-400 mb-0.5">Password Reset Information</p>
                <p className="text-stone-400 text-[11px]">
                  Staff and branch managers should contact the business owner to reset their credentials. System owners
                  can reset credentials via the database seed script or contact technical support.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-950 text-amber-600 focus:ring-amber-500/30"
                />
                <span>Remember my email</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
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
                <Coffee className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={regData.businessName}
                  onChange={(e) => setRegData({ ...regData, businessName: e.target.value })}
                  placeholder="e.g. Himalayan Chiya Corner"
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Owner Full Name <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="Suresh Shrestha"
                    className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Owner Email Address <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="owner@mycafe.np"
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Password <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? 'Setting up Cafe...' : 'Register & Start Using POS'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── PROFESSIONAL SYSTEM FOOTER (Replaces Demo Drawer) ─── */}
        <div className="border-t border-stone-800/80 bg-stone-950/70 px-6 py-3 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ChiyaPasal POS Cloud System</span>
          </div>
          <span>v1.0 • Multi-tenant</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
