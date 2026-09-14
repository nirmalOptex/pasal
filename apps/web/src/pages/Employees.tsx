import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Shield,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Lock,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Coffee,
  ChefHat,
  Receipt,
  Crown,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface Branch {
  id: string;
  name: string;
  address?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  business_id: string;
  branch_id?: string | null;
  branch?: { id: string; name: string } | null;
  role_id: string;
  role?: { id: string; name: string; permissions: string[] } | null;
  is_active: boolean;
  has_pin: boolean;
  last_login_at?: string | null;
  created_at: string;
}

const ROLE_COLORS: Record<string, { badge: string; icon: any; border: string }> = {
  OWNER: { badge: 'bg-amber-100 text-amber-800 border-amber-300', icon: Crown, border: 'border-amber-400' },
  BRANCH_MANAGER: { badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Shield, border: 'border-indigo-400' },
  CASHIER: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Receipt, border: 'border-emerald-400' },
  WAITER: { badge: 'bg-purple-100 text-purple-800 border-purple-300', icon: Coffee, border: 'border-purple-400' },
  KITCHEN_STAFF: { badge: 'bg-orange-100 text-orange-800 border-orange-300', icon: ChefHat, border: 'border-orange-400' },
};

export const Employees: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role_id: '',
    branch_id: '',
    password: '',
    pin: '',
  });

  const [pinData, setPinData] = useState({
    pin: '',
    confirmPin: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, branchesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/branches'),
      ]);
      setEmployees(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
      setBranches(branchesRes.data.data || []);
    } catch (err: any) {
      console.error('Failed to load employee data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role_id: roles.find((r) => r.name === 'CASHIER')?.id || roles[0]?.id || '',
      branch_id: branches[0]?.id || '',
      password: '',
      pin: '',
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Please fill in Name, Email, and Password.');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 6 || !/^\d+$/.test(formData.pin))) {
      setFormError('POS PIN must be 4 to 6 numeric digits.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/users', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        role_id: formData.role_id,
        branch_id: formData.branch_id || undefined,
        password: formData.password,
        pin: formData.pin.trim() || undefined,
      });
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      role_id: emp.role_id,
      branch_id: emp.branch_id || '',
      password: '',
      pin: '',
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setFormError('');

    if (formData.password && formData.password.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }
    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 6 || !/^\d+$/.test(formData.pin))) {
      setFormError('POS PIN must be 4 to 6 numeric digits.');
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        role_id: formData.role_id,
        branch_id: formData.branch_id || null,
      };
      if (formData.password) payload.password = formData.password;
      if (formData.pin !== '') payload.pin = formData.pin;

      await api.patch(`/users/${selectedEmployee.id}`, payload);
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPinModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setPinData({ pin: '', confirmPin: '' });
    setFormError('');
    setIsPinModalOpen(true);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setFormError('');

    if (pinData.pin !== '' && (!/^\d{4,6}$/.test(pinData.pin))) {
      setFormError('PIN must be 4 to 6 digits (numbers only).');
      return;
    }
    if (pinData.pin !== pinData.confirmPin) {
      setFormError('PIN confirmation does not match.');
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/users/${selectedEmployee.id}`, { pin: pinData.pin || null });
      setIsPinModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update PIN');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    if (emp.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    try {
      await api.post(`/users/${emp.id}/toggle-status`);
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, is_active: !e.is_active } : e))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle employee status');
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (emp.id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to remove ${emp.name} from the staff list?`);
    if (!confirmed) return;

    try {
      await api.delete(`/users/${emp.id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  // Filtered list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.phone && emp.phone.includes(search));

    const matchesRole = selectedRole === 'ALL' || emp.role?.name === selectedRole;
    const matchesBranch = selectedBranch === 'ALL' || emp.branch_id === selectedBranch;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' ? emp.is_active : !emp.is_active);

    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  const totalStaff = employees.length;
  const activeStaff = employees.filter((e) => e.is_active).length;
  const pinConfiguredCount = employees.filter((e) => e.has_pin).length;
  const cashierCount = employees.filter((e) => e.role?.name === 'CASHIER').length;

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* Top Header Banner */}
      <header className="p-6 bg-white border-b border-stone-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center shadow-md shadow-amber-900/20 text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 leading-tight">Staff & Employee Management</h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage cafe employees, assign branch roles, and configure fast 4-digit POS PINs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh List"
            className="p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-amber-900/20 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </header>

      {/* Metric Cards Banner */}
      <div className="px-6 py-4 bg-stone-50/70 border-b border-stone-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{totalStaff}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Today</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeStaff}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">POS PIN Ready</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pinConfiguredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Cashiers</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{cashierCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 px-6 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="CASHIER">Cashier</option>
            <option value="WAITER">Waiter</option>
            <option value="KITCHEN_STAFF">Kitchen Staff</option>
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Main Staff Content List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mb-3" />
            <p className="text-sm font-medium">Loading employee roster...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-stone-300 p-8">
            <Users className="w-12 h-12 text-stone-300 mb-3" />
            <h3 className="text-base font-bold text-stone-800">No staff members found</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
              {search || selectedRole !== 'ALL'
                ? 'Try adjusting your search query or role filter.'
                : 'Get started by adding your first cashier, waiter, or kitchen staff member.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow hover:bg-amber-500 transition-colors"
            >
              Add New Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const roleConfig = ROLE_COLORS[emp.role?.name || ''] || {
                badge: 'bg-stone-100 text-stone-700 border-stone-200',
                icon: Users,
                border: 'border-stone-200',
              };
              const RoleIcon = roleConfig.icon;
              const isMe = emp.id === currentUser?.id;

              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-2xl border ${
                    emp.is_active ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50/80'
                  } shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between`}
                >
                  <div>
                    {/* Header: Avatar, Name, Role badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 text-amber-400 flex items-center justify-center font-bold text-base shadow-sm">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-stone-900 text-base leading-tight">{emp.name}</h3>
                            {isMe && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                                You
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border mt-1 ${roleConfig.badge}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {emp.role?.name || 'STAFF'}
                          </span>
                        </div>
                      </div>

                      {/* Status toggle button */}
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        disabled={isMe}
                        title={emp.is_active ? 'Click to deactivate' : 'Click to activate'}
                        className={`text-xs px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                          emp.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        } ${isMe ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* Contact & Branch details */}
                    <div className="space-y-1.5 py-2 border-t border-stone-100 text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-stone-700 font-medium">
                          {emp.branch?.name || 'All Branches (Floating)'}
                        </span>
                      </div>
                    </div>

                    {/* POS PIN Status Badge */}
                    <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            emp.has_pin ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-stone-800">
                            {emp.has_pin ? 'POS 4-Digit PIN Set' : 'No POS PIN'}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {emp.has_pin ? 'Can log in via numeric keypad' : 'Web password only'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenPinModal(emp)}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        {emp.has_pin ? 'Reset PIN' : 'Setup PIN'}
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-stone-500" />
                      <span>Edit</span>
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => handleDeleteEmployee(emp)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ADD EMPLOYEE MODAL ─── */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Add New Staff / Employee</h3>
                  <p className="text-[11px] text-stone-400">Create login credentials and POS permissions</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maya Tamang"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +977-98XXXXXXXX"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="maya@chhiyapasal.np"
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Staff Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Assigned Branch
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Login Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Used for standard web login</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                    <span>POS 4-Digit PIN</span>
                    <span className="text-[10px] text-amber-600 font-bold">Fast POS</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="e.g. 5555"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 tracking-widest text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">For touch screen keypad login</p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-md shadow-amber-900/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT EMPLOYEE MODAL ─── */}
      {isEditOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Edit Employee: {selectedEmployee.name}</h3>
                  <p className="text-[11px] text-stone-400">Update roles, branches, or passwords</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full border border-stone-200 bg-stone-100 rounded-xl px-3.5 py-2 text-sm text-stone-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Role</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Branch</label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Reset POS PIN (Optional)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="4-6 numeric digits"
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 tracking-widest text-center font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-md shadow-amber-900/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── QUICK PIN SETUP MODAL ─── */}
      {isPinModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Set POS PIN</h3>
                  <p className="text-[11px] text-stone-400">{selectedEmployee.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  required
                  value={pinData.pin}
                  onChange={(e) => setPinData({ ...pinData, pin: e.target.value })}
                  placeholder="••••"
                  className="w-full border border-stone-300 rounded-xl py-3 text-2xl tracking-[0.4em] text-center font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pinData.confirmPin}
                  onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value })}
                  placeholder="••••"
                  className="w-full border border-stone-300 rounded-xl py-3 text-2xl tracking-[0.4em] text-center font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {selectedEmployee.has_pin && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Remove PIN for this staff member?')) {
                        await api.patch(`/users/${selectedEmployee.id}`, { pin: '' });
                        setIsPinModalOpen(false);
                        loadData();
                      }
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove PIN
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save PIN'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
