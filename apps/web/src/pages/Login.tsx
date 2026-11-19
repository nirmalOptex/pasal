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
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { api, getTenantSlug } from '../api/client';
import { useAuthStore } from '../store/auth.store';

interface BranchStaff {
  id: string;
  name: string;
  role: string;
  branchName: string;
  hasPin: boolean;
}

export interface LoginProps {
  initialTab?: 'pin' | 'email' | 'register';
  onBackToLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({ initialTab = 'pin', onBackToLanding }) => {
  const { setAuth } = useAuthStore();

  // Admin restaurant registration visibility (hidden from normal staff/users by default)
  const [showAdminRegister, setShowAdminRegister] = useState(() => {
    if (initialTab === 'register') return true;
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === '1' || params.get('admin') === 'setup' || params.get('register') === 'admin';
  });
  const [adminSecret, setAdminSecret] = useState('');

  const [activeTab, setActiveTab] = useState<'pin' | 'email' | 'register'>(initialTab);

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
    slug: '',
    branchName: 'Main Branch',
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const tenantSlug = getTenantSlug();

  useEffect(() => {
    if (!tenantSlug) return;
    api.get(`/auth/tenant/${tenantSlug}`)
      .then((res) => setTenantName(res.data?.data?.name || ''))
      .catch(() => setTenantName(''));
  }, [tenantSlug]);

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

  // ── Register New Cafe / Restaurant Handler (Admin Only) ──
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regData.businessName.trim() || !regData.name.trim() || !regData.email.trim() || !regData.password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!adminSecret.trim()) {
      setError('Admin Secret Key is required to create a new restaurant.');
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
        slug: regData.slug.trim() || undefined,
        branchName: regData.branchName.trim() || 'Main Branch',
        name: regData.name.trim(),
        email: regData.email.trim(),
        password: regData.password,
        phone: regData.phone.trim() || undefined,
        currency: 'NPR',
        adminSecret: adminSecret.trim(),
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please verify your Admin Secret Key.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-[#c99132]/15 text-[#7b672f] border-[#c99132]/25';
      case 'BRANCH_MANAGER':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'CASHIER':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'KITCHEN_STAFF':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'WAITER':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default:
        return 'bg-[#ecefe3] text-[#596153] border-[#20251f]/10';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(184,199,170,.28),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(201,145,50,.12),transparent_30%),#f7f4eb] flex flex-col items-center justify-center p-4 text-[#20251f]">
      {onBackToLanding && (
        <div className="w-full max-w-lg mb-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[#596153] hover:text-[#20251f] border border-[#20251f]/10 text-xs font-medium transition-all cursor-pointer backdrop-blur-md shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#b77f27]" />
            <span>← Back to ChiyaPasal Home</span>
          </button>
          <span className="text-[11px] text-[#7d8376] font-medium">Terminal Portal</span>
        </div>
      )}
      <div className="reveal-up w-full max-w-lg bg-[#fffdf8]/95 border border-[#20251f]/10 backdrop-blur-2xl rounded-2xl shadow-[0_24px_70px_rgba(23,35,31,.14)] overflow-hidden text-[#20251f] transition-all">
        {/* Brand Banner */}
        <div className="pt-8 pb-6 px-8 flex flex-col items-center border-b border-[#20251f]/10 text-center bg-white/30">
          <div className="w-14 h-14 rounded-2xl bg-[#c99132] flex items-center justify-center shadow-[0_12px_28px_rgba(201,145,50,.18)] mb-3 ring-1 ring-[#20251f]/10">
            <Coffee className="w-8 h-8 text-[#20251f]" />
          </div>
          <h1 className="text-2xl font-bold text-[#20251f] tracking-tight">{tenantName || 'ChiyaPasal POS'}</h1>
          <p className="text-xs text-[#6d7467] mt-1">Hospitality Management & Billing System</p>
        </div>

        {/* Mode Selector Tabs - Only 2 tabs for normal users; 3rd tab visible only when admin onboarding is activated */}
        <div className={`grid ${showAdminRegister ? 'grid-cols-3' : 'grid-cols-2'} bg-[#ecefe3] p-1.5 border-b border-[#20251f]/10 text-xs font-semibold text-[#596153]`}>
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

          {showAdminRegister && (
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
              <span>Admin Onboard</span>
            </button>
          )}
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
              <p className="text-xs text-[#7d8376] font-medium">
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
                  className="text-[11px] text-[#b77f27] hover:text-[#8f681e] transition-colors cursor-pointer"
                >
                  Clear profile
                </button>
              )}
            </div>

            {/* Staff Horizontal Carousel / Grid */}
            {staffLoading ? (
              <div className="flex items-center justify-center py-4 mb-4 text-xs text-[#7d8376] gap-2 bg-[#ecefe3] rounded-xl border border-[#20251f]/10">
                <div className="w-4 h-4 border-2 border-[#c99132] border-t-transparent rounded-full animate-spin" />
                <span>Loading active staff…</span>
              </div>
            ) : connectionError ? (
              <div className="mb-4 p-3 rounded-xl bg-[#f1ead7] border border-[#c99132]/25 text-[#7b672f] text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#b77f27] shrink-0" />
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
                          ? 'bg-[#ecefe3] border-[#c99132] text-[#20251f] shadow-[0_8px_18px_rgba(201,145,50,.12)] ring-1 ring-[#c99132]/30'
                          : 'bg-white border-[#20251f]/10 text-[#596153] hover:bg-[#f7f4eb] hover:border-[#596153]/30'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#c99132]/15 mx-auto mb-1.5 flex items-center justify-center text-xs font-bold text-[#7b672f] border border-[#c99132]/20">
                        {staff.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold truncate text-[#20251f]">{staff.name.split(' ')[0]}</p>
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
              <div className="flex items-center gap-3 py-2.5 px-6 rounded-2xl bg-[#ecefe3] border border-[#20251f]/10 shadow-inner">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-[#c99132] shadow-[0_4px_10px_rgba(201,145,50,.28)] scale-110'
                          : 'bg-white border border-[#20251f]/15'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] text-[#7d8376] mt-1.5 font-medium">Use on-screen keypad or keyboard numpad</p>
            </div>

            {/* 3x4 Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-13 rounded-2xl bg-white hover:bg-[#ecefe3] active:scale-95 text-xl font-bold text-[#20251f] border border-[#20251f]/10 shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-13 rounded-2xl bg-[#ecefe3] hover:bg-[#dfe4d2] text-xs font-bold text-[#596153] active:scale-95 border border-[#20251f]/10 transition-all flex items-center justify-center uppercase tracking-wider cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                  className="h-13 rounded-2xl bg-white hover:bg-[#ecefe3] active:scale-95 text-xl font-bold text-[#20251f] border border-[#20251f]/10 shadow-sm transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-13 rounded-2xl bg-[#ecefe3] hover:bg-[#dfe4d2] text-[#596153] active:scale-95 border border-[#20251f]/10 transition-all flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {pin.length >= 4 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => submitPinLogin()}
                className="w-full mt-5 bg-[#c99132] hover:bg-[#b77f27] text-[#20251f] font-bold py-3 px-4 rounded-xl shadow-[0_12px_28px_rgba(201,145,50,.18)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
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
              <label className="block text-xs font-semibold text-[#596153] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7d8376] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#20251f]/15 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#20251f] focus:outline-none focus:border-[#c99132] focus:ring-2 focus:ring-[#c99132]/15 transition-colors placeholder:text-[#989e91]"
                  placeholder="manager@cafe.np"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#596153] uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotHelp(!showForgotHelp)}
                  className="text-xs text-[#b77f27] hover:text-[#8f681e] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7d8376] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#20251f]/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#20251f] focus:outline-none focus:border-[#c99132] focus:ring-2 focus:ring-[#c99132]/15 transition-colors placeholder:text-[#989e91]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#7d8376] hover:text-[#20251f] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password guidance */}
            {showForgotHelp && (
              <div className="p-3 rounded-xl bg-[#ecefe3] border border-[#20251f]/10 text-xs text-[#596153] animate-in fade-in duration-150">
                <p className="font-semibold text-[#b77f27] mb-0.5">Password Reset Information</p>
                <p className="text-[#7d8376] text-[11px]">
                  Staff and branch managers should contact the business owner to reset their credentials. System owners
                  can reset credentials via the database seed script or contact technical support.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#7d8376] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#20251f]/20 bg-white text-[#c99132] focus:ring-amber-500/30"
                />
                <span>Remember my email</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#c99132] hover:bg-[#b77f27] text-[#20251f] font-bold py-3 px-4 rounded-xl shadow-[0_12px_28px_rgba(201,145,50,.18)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In as Manager / Owner'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── TAB 3: REGISTER NEW CAFE / RESTAURANT (Authorized Platform Admin Only) ─── */}
        {activeTab === 'register' && showAdminRegister && (
          <form onSubmit={handleRegisterSubmit} className="p-8 space-y-3.5">
            <div className="p-3 rounded-xl bg-[#eef0df] border border-[#c99132]/25 text-[#596153] text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#b77f27]" />
              <span>Admin Mode: Enter the system administrator key to create a new restaurant.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Admin Secret Key <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-[#7d8376] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="System Administrator Secret Key"
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Cafe / Restaurant Name <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Coffee className="w-4 h-4 text-[#7d8376] absolute left-3.5 top-3 pointer-events-none" />
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

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Tenant Subdomain Slug</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#7d8376] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={regData.slug}
                  onChange={(e) => setRegData({ ...regData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="himalayan-brew"
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
                  <User className="w-4 h-4 text-[#7d8376] absolute left-3 top-3 pointer-events-none" />
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
                  <Phone className="w-4 h-4 text-[#7d8376] absolute left-3 top-3 pointer-events-none" />
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
                <Mail className="w-4 h-4 text-[#7d8376] absolute left-3.5 top-3.5 pointer-events-none" />
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
                <Lock className="w-4 h-4 text-[#7d8376] absolute left-3.5 top-3.5 pointer-events-none" />
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
            className="w-full mt-5 bg-[#c99132] hover:bg-[#b77f27] text-[#20251f] font-bold py-3 px-4 rounded-xl shadow-[0_12px_28px_rgba(201,145,50,.18)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? 'Setting up Cafe...' : 'Authorize & Register Restaurant'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── PROFESSIONAL SYSTEM FOOTER ─── */}
        <div className="border-t border-[#20251f]/10 bg-[#ecefe3] px-6 py-3 flex items-center justify-between text-[11px] text-[#7d8376]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ChiyaPasal POS Cloud System</span>
          </div>
          <div className="flex items-center gap-2">
            <span>v1.0 • Multi-tenant</span>
            <button
              type="button"
              onClick={() => {
                const next = !showAdminRegister;
                setShowAdminRegister(next);
                if (next) {
                  setActiveTab('register');
                } else if (activeTab === 'register') {
                  setActiveTab('pin');
                }
              }}
              title="Platform Administrator Restaurant Setup"
              className="text-[#596153] hover:text-[#20251f] transition-colors p-1 rounded hover:bg-[#ecefe3]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
