"use client";

import { useState } from "react";
import { Clock, CheckCircle2, ChevronDown, CloudOff, Trash2 } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";

interface HistoryItem {
  id: string;
  type: string;
  item: string;
  quantity: string;
  time: string;
  status: string;
  location?: string;
}

interface ExecutiveHistoryProps {
  pendingTransactions: HistoryItem[];
  completedTransactions: HistoryItem[];
  offlineQueueCount: number;
  deletingTransactionId: string | null;
  actionMessage?: string;
  onDeletePending: (transactionId: string) => void;
  onBack: () => void;
}

export function ExecutiveHistory({
  pendingTransactions, completedTransactions, offlineQueueCount,
  deletingTransactionId, actionMessage, onDeletePending, onBack,
}: ExecutiveHistoryProps) {
  const [view, setView] = useState<"PENDING" | "COMPLETED">("PENDING");

  const displayed = view === "PENDING" ? pendingTransactions : completedTransactions;

  return (
    <section className="worker-history-screen rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Transaction history</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">Your inventory updates</h2>
          <p className="mt-1 text-xs font-semibold text-[#7b8fa9]">
            {view === "PENDING" ? "Cycle counts, damage or loss updates waiting for review, plus offline updates waiting to sync." : "Posted, approved, and completed updates."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-[#d5e1f0] bg-[#f4f8ff] p-1">
            <button
              type="button"
              aria-pressed={view === "PENDING"}
              onClick={() => setView("PENDING")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${view === "PENDING" ? "bg-[#155eef] text-white" : "text-[#496482]"}`}
            >
              Pending ({pendingTransactions.length + offlineQueueCount})
            </button>
            <button
              type="button"
              aria-pressed={view === "COMPLETED"}
              onClick={() => setView("COMPLETED")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${view === "COMPLETED" ? "bg-[#155eef] text-white" : "text-[#496482]"}`}
            >
              Completed ({completedTransactions.length})
            </button>
          </div>
          <button type="button" onClick={onBack} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]">
            <ChevronDown size={15} className="rotate-90" /> Home
          </button>
        </div>
      </div>

      {view === "PENDING" && offlineQueueCount > 0 && (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-[#f0ce8e] bg-[#fff8ea] px-4 py-3 text-sm font-semibold text-[#875810]">
          <CloudOff size={18} className="mt-0.5 shrink-0" />
          <p>{offlineQueueCount} update{offlineQueueCount === 1 ? " is" : "s are"} saved on this device and waiting to synchronize.</p>
        </div>
      )}

      {actionMessage && (
        <div role="status" aria-live="polite" className="mx-5 mt-5 rounded-xl border border-[#bfd3f3] bg-[#f2f7ff] px-4 py-3 text-xs font-bold text-[#28548b]">
          {actionMessage}
        </div>
      )}

      {displayed.length === 0 ? (
        <EmptyState
          icon={view === "PENDING" ? Clock : CheckCircle2}
          title={view === "PENDING" ? "No pending transactions" : "No completed transactions"}
          description={view === "PENDING" ? "All your updates have been processed." : "Completed transactions will appear here."}
        />
      ) : (
        <div className="divide-y divide-[#edf1f6]">
          {displayed.map((item) => (
            <article key={item.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-extrabold text-[#17345f]">{item.type} · {item.item}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      item.status === "Posted" ? "bg-[#eaf8f1] text-[#16865b]" :
                      item.status === "Rejected" ? "bg-[#fff0f0] text-[#b83b3b]" :
                      item.status === "Cancelled" ? "bg-[#eef2f7] text-[#7b8fa9]" :
                      "bg-[#fff5df] text-[#a8670d]"
                    }`}>{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#7186a3]">
                    {item.quantity} · {item.location ?? "—"} · {item.time}
                  </p>
                </div>
                {view === "PENDING" && (
                  <button
                    type="button"
                    disabled={deletingTransactionId === item.id}
                    onClick={() => onDeletePending(item.id)}
                    className="worker-delete-pending inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#efb5b5] bg-[#fff7f7] px-4 text-xs font-extrabold text-[#b83f3f] transition hover:bg-[#fff0f0] disabled:cursor-wait disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    {deletingTransactionId === item.id ? "Deleting…" : "Delete pending"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
