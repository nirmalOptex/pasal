import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, CheckCircle2, History, X, User } from 'lucide-react';
import { api } from '../api/client';

export const Khata: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleNotes, setSettleNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/credit/accounts');
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load Khata accounts', err);
    }
  };

  const openHistory = async (acc: any) => {
    setSelectedAccount(acc);
    try {
      const res = await api.get(`/credit/transactions/${acc.id}`);
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load transactions', err);
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || settleAmount <= 0) return;
    setIsProcessing(true);

    try {
      await api.post('/credit/settle', {
        customerId: selectedAccount.customer_id,
        amount: settleAmount,
        notes: settleNotes || 'Khata debt settlement',
      });
      setShowSettleModal(false);
      setSettleAmount(0);
      setSettleNotes('');
      fetchAccounts();
      if (selectedAccount) openHistory(selectedAccount);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Settlement failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) =>
    acc.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    acc.customer?.phone?.includes(search)
  );

  const totalOutstanding = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-hidden">
      {/* Khata Top Banner */}
      <div className="p-6 bg-white border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Customer Khata (Credit Ledger)
          </h2>
          <p className="text-xs text-stone-500">
            Track customer debit transactions, balances, and cash settlements
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl text-right">
          <span className="text-[11px] font-semibold text-purple-700 block">Total Due Across All Khata:</span>
          <span className="text-lg font-black text-purple-900">Rs. {totalOutstanding.toFixed(2)}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-white border-b border-stone-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search customer by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Accounts List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Outstanding Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAccounts.map((acc) => {
                const bal = Number(acc.balance);
                return (
                  <tr key={acc.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {acc.customer?.name}
                    </td>
                    <td className="py-3 px-4 text-stone-600">{acc.customer?.phone || '—'}</td>
                    <td className="py-3 px-4 text-stone-500">
                      {acc.credit_limit ? `Rs. ${acc.credit_limit}` : 'No Limit'}
                    </td>
                    <td className="py-3 px-4 font-bold text-sm">
                      <span className={bal > 0 ? 'text-purple-700' : 'text-emerald-700'}>
                        Rs. {bal.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openHistory(acc)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-[11px] transition"
                      >
                        Ledger History
                      </button>
                      {bal > 0 && (
                        <button
                          onClick={() => {
                            setSelectedAccount(acc);
                            setSettleAmount(bal);
                            setShowSettleModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm transition"
                        >
                          Settle Debt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Debt Modal */}
      {showSettleModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-stone-900">Settle Khata Debt</h3>
              <button onClick={() => setShowSettleModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettle} className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer:</span>
                  <span className="font-bold text-stone-800">{selectedAccount.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Current Outstanding:</span>
                  <span className="font-bold text-purple-700">Rs. {Number(selectedAccount.balance).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Settlement Amount (Rs.)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={Number(selectedAccount.balance)}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid cash at counter"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-800/20 mt-2"
              >
                {isProcessing ? 'Processing...' : 'Confirm Cash Settlement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Drawer / Modal */}
      {selectedAccount && !showSettleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 mb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  {selectedAccount.customer?.name}'s Khata Ledger
                </h3>
                <p className="text-xs text-stone-500">Detailed credit and debit history</p>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {transactions.length === 0 ? (
                <p className="text-stone-400 py-6 text-center">No transaction records found</p>
              ) : (
                transactions.map((tx) => {
                  const isDebit = tx.type === 'DEBIT'; // Owed more
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl border border-stone-100 bg-stone-50/50 flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isDebit ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-semibold text-stone-800">{tx.notes || 'Transaction'}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-1">
                          {new Date(tx.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold block ${isDebit ? 'text-red-700' : 'text-emerald-700'}`}>
                          {isDebit ? '+' : '-'} Rs. {Number(tx.amount).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-stone-400">Bal: Rs. {Number(tx.balance_after).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setSelectedAccount(null)}
              className="mt-4 w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
