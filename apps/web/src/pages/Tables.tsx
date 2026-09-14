import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Grid,
  Users,
  UtensilsCrossed,
  CheckCircle2,
  Sparkles,
  BookMarked,
  ArrowRightLeft,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { TableStatus } from '@chhiyapasal/shared-types';
import { usePosStore } from '../store/pos.store';

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
}

interface Area {
  id: string;
  name: string;
  description?: string;
  tables: Table[];
}

interface ContextMenu {
  tableId: string;
  tableName: string;
  tableStatus: TableStatus;
  x: number;
  y: number;
}

interface TransferModal {
  sourceTableId: string;
  sourceTableName: string;
}

interface TablesProps {
  onStartPosWithTable?: () => void;
}

const STATUS_CONFIG: Record<TableStatus, { label: string; dot: string; card: string; badge: string }> = {
  [TableStatus.AVAILABLE]: {
    label: 'Available',
    dot: 'bg-emerald-500',
    card: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  [TableStatus.OCCUPIED]: {
    label: 'Occupied',
    dot: 'bg-red-500',
    card: 'bg-red-50 border-red-300 hover:bg-red-100',
    badge: 'bg-red-100 text-red-700',
  },
  [TableStatus.RESERVED]: {
    label: 'Reserved',
    dot: 'bg-purple-500',
    card: 'bg-purple-50 border-purple-300 hover:bg-purple-100',
    badge: 'bg-purple-100 text-purple-700',
  },
  [TableStatus.CLEANING]: {
    label: 'Cleaning',
    dot: 'bg-amber-500',
    card: 'bg-amber-50 border-amber-300 hover:bg-amber-100',
    badge: 'bg-amber-100 text-amber-700',
  },
};

export const Tables: React.FC<TablesProps> = ({ onStartPosWithTable }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [transferModal, setTransferModal] = useState<TransferModal | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const { setTable } = usePosStore();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const fetchAreas = useCallback(async () => {
    try {
      const res = await api.get('/table-areas');
      setAreas(res.data.data || []);
    } catch (err) {
      console.error('Failed to load table areas', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    const handleClose = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleClose);
    };
  }, []);

  const handleTableClick = (table: Table) => {
    if (table.status === TableStatus.CLEANING) {
      showToast(`Table ${table.name} is being cleaned. Use right-click to change status.`);
      return;
    }
    setTable(table.id, table.name);
    if (onStartPosWithTable) onStartPosWithTable();
  };

  const handleRightClick = (e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 220;
    const menuHeight = 220;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
    setContextMenu({ tableId: table.id, tableName: table.name, tableStatus: table.status, x, y });
  };

  const changeStatus = async (tableId: string, status: TableStatus) => {
    setContextMenu(null);
    try {
      await api.patch(`/tables/${tableId}`, { status });
      await fetchAreas();
      showToast(`Status changed to ${STATUS_CONFIG[status].label}`);
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('Failed to update status');
    }
  };

  const handleTransferConfirm = async (targetTableId: string) => {
    if (!transferModal) return;
    setTransferring(true);
    try {
      await api.post(`/tables/${transferModal.sourceTableId}/transfer-order`, {
        target_table_id: targetTableId,
      });
      await fetchAreas();
      showToast(`Order moved from ${transferModal.sourceTableName} ✓`);
      setTransferModal(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Transfer failed';
      showToast(msg);
    } finally {
      setTransferring(false);
    }
  };

  // All available tables for transfer target
  const availableTables = areas
    .flatMap((a) => a.tables)
    .filter(
      (t) =>
        t.status === TableStatus.AVAILABLE &&
        t.id !== transferModal?.sourceTableId
    );

  return (
    <div className="flex-1 flex flex-col bg-stone-100 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-600" />
            Dining Tables &amp; Floor Plan
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Right-click any table to change status or transfer order
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAreas}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 shadow-sm transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Legend */}
          <div className="flex gap-2.5 text-[11px] font-semibold bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-sm">
            {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                <span className="text-stone-600">{STATUS_CONFIG[s].label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Areas */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
          Loading floor plan…
        </div>
      ) : (
        <div className="space-y-6">
          {areas.map((area) => (
            <div key={area.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-stone-900">{area.name}</h3>
                  <p className="text-xs text-stone-400">{area.description || 'Dining Zone'}</p>
                </div>
                <div className="text-xs text-stone-400 font-medium">
                  {area.tables.filter((t) => t.status === TableStatus.AVAILABLE).length} /{' '}
                  {area.tables.length} available
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {area.tables.map((table) => {
                  const cfg = STATUS_CONFIG[table.status];
                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      onContextMenu={(e) => handleRightClick(e, table)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150 select-none
                        ${cfg.card}
                        ${table.status === TableStatus.CLEANING ? 'cursor-default opacity-80' : 'cursor-pointer active:scale-95 hover:shadow-md'}
                      `}
                    >
                      {/* Status dot */}
                      <span
                        className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${cfg.dot} ${
                          table.status === TableStatus.CLEANING ? 'animate-pulse' : ''
                        }`}
                      />

                      <h4 className="font-black text-base leading-tight mb-1 text-stone-900">
                        {table.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-stone-500 font-semibold">
                        <Users className="w-3 h-3" />
                        {table.capacity} seats
                      </div>

                      <div
                        className={`mt-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}
                      >
                        {table.status === TableStatus.AVAILABLE && (
                          <UtensilsCrossed className="w-2.5 h-2.5" />
                        )}
                        {table.status === TableStatus.CLEANING && (
                          <Sparkles className="w-2.5 h-2.5" />
                        )}
                        {cfg.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {areas.length === 0 && (
            <div className="text-center py-20 text-stone-400 text-sm">
              No table areas found. Add areas and tables from Settings.
            </div>
          )}
        </div>
      )}

      {/* ─── Context Menu ──────────────────────────────── */}
      {contextMenu && (
        <div
          ref={contextRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white border border-stone-200 rounded-xl shadow-2xl py-1.5 w-56 text-sm"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
            {contextMenu.tableName}
          </div>

          {contextMenu.tableStatus !== TableStatus.AVAILABLE && (
            <ContextMenuItem
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              label="Mark Available"
              onClick={() => changeStatus(contextMenu.tableId, TableStatus.AVAILABLE)}
            />
          )}
          {contextMenu.tableStatus !== TableStatus.CLEANING && (
            <ContextMenuItem
              icon={<Sparkles className="w-4 h-4 text-amber-500" />}
              label="Mark Cleaning"
              onClick={() => changeStatus(contextMenu.tableId, TableStatus.CLEANING)}
            />
          )}
          {contextMenu.tableStatus !== TableStatus.RESERVED && (
            <ContextMenuItem
              icon={<BookMarked className="w-4 h-4 text-purple-500" />}
              label="Mark Reserved"
              onClick={() => changeStatus(contextMenu.tableId, TableStatus.RESERVED)}
            />
          )}

          {contextMenu.tableStatus === TableStatus.OCCUPIED && (
            <>
              <div className="border-t border-stone-100 mt-1 mb-1" />
              <ContextMenuItem
                icon={<ArrowRightLeft className="w-4 h-4 text-blue-500" />}
                label="Transfer to Another Table"
                onClick={() => {
                  setTransferModal({
                    sourceTableId: contextMenu.tableId,
                    sourceTableName: contextMenu.tableName,
                  });
                  setContextMenu(null);
                }}
              />
            </>
          )}
        </div>
      )}

      {/* ─── Transfer Modal ────────────────────────────── */}
      {transferModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                  Transfer Order
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Moving order from <strong>{transferModal.sourceTableName}</strong> to:
                </p>
              </div>
              <button
                onClick={() => setTransferModal(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {availableTables.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm">
                No available tables to transfer to.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto">
                {availableTables.map((t) => (
                  <button
                    key={t.id}
                    disabled={transferring}
                    onClick={() => handleTransferConfirm(t.id)}
                    className="p-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-center transition active:scale-95 disabled:opacity-50"
                  >
                    <div className="font-black text-base text-stone-900">{t.name}</div>
                    <div className="text-[10px] text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
                      <Users className="w-3 h-3" /> {t.capacity}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {transferring && (
              <div className="mt-4 text-center text-sm text-stone-500 animate-pulse">
                Transferring order…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Toast ─────────────────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-xl animate-fade-in-up">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

// Small helper component for context menu items
const ContextMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 text-stone-700 transition text-left"
  >
    {icon}
    <span>{label}</span>
  </button>
);
