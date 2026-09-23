"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Clock, CloudOff, Trash2 } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { Badge, ConfirmDialog } from "../shared/ui";

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

function statusTone(status: string) {
  if (status === "Posted") return "success" as const;
  if (status === "Rejected") return "danger" as const;
  if (status === "Cancelled") return "neutral" as const;
  return "warning" as const;
}

export function ExecutiveHistory({
  pendingTransactions, completedTransactions, offlineQueueCount,
  deletingTransactionId, actionMessage, onDeletePending, onBack,
}: ExecutiveHistoryProps) {
  const [view, setView] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [deleteTarget, setDeleteTarget] = useState<HistoryItem | null>(null);

  const displayed = view === "PENDING" ? pendingTransactions : completedTransactions;

  return (
    <section className="worker-history-screen overflow-hidden rounded-[12px] border border-[#e4e7ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex flex-col gap-4 border-b border-[#e4e7ec] bg-[#f9fafb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="ui-eyebrow">Transaction history</p>
          <h2 className="mt-1 text-[18px] font-bold text-[#101828]">Your inventory updates</h2>
          <p className="mt-1 text-[12px] font-medium text-[#475467]">
            {view === "PENDING"
              ? "Cycle counts and damage updates waiting for review, plus offline updates waiting to sync."
              : "Posted, approved and completed updates."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-[10px] border border-[#e4e7ec] bg-white p-1" role="group" aria-label="Filter transactions">
            <button
              type="button"
              aria-pressed={view === "PENDING"}
              onClick={() => setView("PENDING")}
              className={`rounded-[8px] px-3 py-1.5 text-[11px] font-bold ${view === "PENDING" ? "bg-[#155eef] text-white" : "text-[#475467] hover:bg-[#f9fafb]"}`}
            >
              Pending ({pendingTransactions.length + offlineQueueCount})
            </button>
            <button
              type="button"
              aria-pressed={view === "COMPLETED"}
              onClick={() => setView("COMPLETED")}
              className={`rounded-[8px] px-3 py-1.5 text-[11px] font-bold ${view === "COMPLETED" ? "bg-[#155eef] text-white" : "text-[#475467] hover:bg-[#f9fafb]"}`}
            >
              Completed ({completedTransactions.length})
            </button>
          </div>
          <button type="button" onClick={onBack} className="ui-btn ui-btn-sm ui-btn-secondary">
            <ChevronDown size={14} className="rotate-90" aria-hidden="true" />
            Home
          </button>
        </div>
      </div>

      {view === "PENDING" && offlineQueueCount > 0 && (
        <div className="mx-5 mt-4 flex items-start gap-3 rounded-[12px] border border-[#f0ce8e] bg-[#fffaeb] px-4 py-3 text-[13px] font-semibold text-[#b54708]">
          <CloudOff size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            {offlineQueueCount} update{offlineQueueCount === 1 ? " is" : "s are"} saved on this device and waiting to synchronize.
          </p>
        </div>
      )}

      {actionMessage && (
        <div role="status" aria-live="polite" className="mx-5 mt-4 rounded-[12px] border border-[#b9d0f8] bg-[#eff4ff] px-4 py-3 text-[12px] font-bold text-[#175cd3]">
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
        <div className="divide-y divide-[#e4e7ec]">
          {displayed.map((item) => (
            <article key={item.id} className="p-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[13px] font-bold text-[#101828]">
                      {item.type} · {item.item}
                    </p>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-[#475467] tabular-nums">
                    {item.quantity} · {item.location ?? "—"} · {item.time}
                  </p>
                </div>
                {view === "PENDING" && (
                  <button
                    type="button"
                    disabled={deletingTransactionId === item.id}
                    onClick={() => setDeleteTarget(item)}
                    className="worker-delete-pending ui-btn ui-btn-sm ui-btn-danger inline-flex min-h-11 shrink-0"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    {deletingTransactionId === item.id ? "Deleting…" : "Delete pending"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        destructive
        title="Delete this pending update?"
        description={
          deleteTarget
            ? `${deleteTarget.type} · ${deleteTarget.item} (${deleteTarget.quantity}) will be removed from the pending queue. Posted inventory and the audit ledger are not affected, and this cannot be undone here.`
            : ""
        }
        confirmLabel="Delete permanently"
        cancelLabel="Keep it"
        busy={deleteTarget !== null && deletingTransactionId === deleteTarget.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeletePending(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}
