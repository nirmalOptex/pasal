import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { KotStatus } from '@chhiyapasal/shared-types';

export const Kitchen: React.FC = () => {
  const [kots, setKots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchKots = async () => {
    try {
      const res = await api.get('/kot');
      setKots(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch KOTs', err);
    }
  };

  const updateStatus = async (kotId: string, status: KotStatus) => {
    try {
      await api.patch(`/kot/${kotId}/status`, { status });
      fetchKots();
    } catch (err) {
      console.error('Failed to update KOT status', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-stone-900 text-stone-100 overflow-hidden">
      {/* KOT Top Bar */}
      <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-500 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Kitchen Display System (KDS)</h2>
            <p className="text-xs text-stone-400">Live Kitchen Order Tickets (KOT)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Active Orders: {kots.length}
          </span>
          <button
            onClick={fetchKots}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="Refresh KOTs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {kots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-500">
            <ChefHat className="w-16 h-16 text-stone-700 mb-3" />
            <p className="text-base font-semibold text-stone-400">Kitchen is all caught up!</p>
            <p className="text-xs text-stone-600">New confirmed orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kots.map((kot) => {
              const isNew = kot.status === KotStatus.NEW;
              const isPreparing = kot.status === KotStatus.PREPARING;
              const isReady = kot.status === KotStatus.READY;

              return (
                <div
                  key={kot.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-stone-950 p-4 transition shadow-lg ${
                    isNew
                      ? 'border-amber-500 shadow-amber-500/10'
                      : isPreparing
                      ? 'border-blue-500 shadow-blue-500/10'
                      : 'border-emerald-500 shadow-emerald-500/10'
                  }`}
                >
                  <div>
                    {/* Ticket Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-stone-800">
                      <div>
                        <span className="text-xl font-black text-amber-400 tracking-tight">
                          Token #{kot.order?.token_number || '00'}
                        </span>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {kot.kot_number} • {kot.order?.table?.name || 'Takeaway'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isNew
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isPreparing
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {kot.status}
                      </span>
                    </div>

                    {/* Ticket Items */}
                    <div className="py-3 space-y-2">
                      {kot.items?.map((item: any) => (
                        <div key={item.id} className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-stone-800 text-amber-400 font-bold text-xs flex items-center justify-center">
                              {item.quantity}×
                            </span>
                            <span className="font-semibold text-sm text-stone-200">
                              {item.product_name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-stone-800 mt-2">
                    {isNew && (
                      <button
                        onClick={() => updateStatus(kot.id, KotStatus.PREPARING)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-4 h-4" /> Start Preparing
                      </button>
                    )}
                    {isPreparing && (
                      <button
                        onClick={() => updateStatus(kot.id, KotStatus.READY)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Order Ready
                      </button>
                    )}
                    {isReady && (
                      <button
                        onClick={() => updateStatus(kot.id, KotStatus.SERVED)}
                        className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        Mark as Served
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
