"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Flag, Search, X } from "lucide-react";
import type { ApiTransaction } from "../api/inventory-api";

function isStockAdjustment(transaction: ApiTransaction) {
  return transaction.referenceNumber?.startsWith("ADJUSTMENT-") === true ||
    transaction.notes?.startsWith("Administrator correction") === true;
}

function statusTone(status: string) {
  if (status === "POSTED") return "bg-[#eaf8f1] text-[#16865b]";
  if (status === "REJECTED") return "bg-[#fff0f0] text-[#b83b3b]";
  if (status === "CANCELLED") return "bg-[#eef2f7] text-[#7b8fa9]";
  return "bg-[#fff5df] text-[#a8670d]";
}

export function AdministratorAuditTransactions({
  transactions,
  loading,
}: {
  transactions: ApiTransaction[];
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<ApiTransaction | null>(null);

  const visibleTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const searchable = [
        transaction.id,
        transaction.product.name,
        transaction.product.sku,
        transaction.referenceNumber,
        transaction.createdBy?.displayName,
        transaction.approvedBy?.displayName,
        transaction.sourceLocation?.name,
        transaction.destinationLocation?.name,
      ].filter(Boolean).join(" ").toLowerCase();
      return (action === "ALL" || transaction.action === action) &&
        (status === "ALL" || transaction.status === status) &&
        (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [action, query, status, transactions]);

  function exportCsv() {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Transaction ID", "Date", "Action", "Product", "SKU", "Quantity", "From", "To", "Status", "Created by", "Reviewed by", "Reference", "Notes", "Transcript"],
      ...visibleTransactions.map((transaction) => [
        transaction.id,
        transaction.createdAt,
        transaction.action,
        transaction.product.name,
        transaction.product.sku,
        transaction.quantity,
        transaction.sourceLocation?.name ?? "",
        transaction.destinationLocation?.name ?? "",
        transaction.status,
        transaction.createdBy?.displayName ?? "",
        transaction.approvedBy?.displayName ?? "",
        transaction.referenceNumber ?? "",
        transaction.notes ?? "",
        transaction.transcript ?? "",
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `administrator-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const adjustmentReason = selected?.notes?.includes("Reason:")
    ? selected.notes.split("Reason:").slice(1).join("Reason:").trim()
    : selected?.notes ?? "No reason recorded.";

  return (
    <section id="admin-audit-transactions" className="overflow-hidden rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#e9eef5] p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Administrator audit</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">Inventory transaction ledger</h2>
          <p className="mt-1 text-sm text-[#7489a6]">Review every stock movement, correction, user, reference and audit note. This page is read-only.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex h-10 min-w-[220px] items-center gap-2 rounded-xl border border-[#d5e1f0] bg-white px-3">
            <Search size={15} className="text-[#8294ac]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transaction, item or user" className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#29466f] outline-none" />
          </label>
          <select aria-label="Filter administrator audit action" value={action} onChange={(event) => setAction(event.target.value)} className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]">
            <option value="ALL">All actions</option>
            {["RECEIVE", "SHIP", "TRANSFER", "CYCLE_COUNT", "DAMAGE"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
          </select>
          <select aria-label="Filter administrator audit status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]">
            <option value="ALL">All statuses</option>
            {["PENDING", "RECOUNT_REQUESTED", "APPROVED", "REJECTED", "POSTED", "CANCELLED"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
          </select>
          <button type="button" onClick={exportCsv} disabled={!visibleTransactions.length} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white disabled:opacity-50"><Download size={15} /> Export CSV</button>
        </div>
      </div>

      {selected && (
        <div className={`m-5 rounded-2xl border p-5 ${isStockAdjustment(selected) ? "border-[#efc36f] bg-[#fff9ec]" : "border-[#cfe0f7] bg-[#f7faff]"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-[#102a56]">Complete transaction record</h3>
                {isStockAdjustment(selected) && <span className="inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2.5 py-1 text-[10px] font-extrabold text-white"><Flag size={12} /> Stock adjustment</span>}
              </div>
              <p className="mt-1 text-xs text-[#6c829f]">TX-{selected.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Close administrator transaction details" className="rounded-lg border border-[#d5e1f0] bg-white p-2 text-[#66809f] hover:text-[#155eef]"><X size={16} /></button>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Date and time", new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.createdAt))],
              ["Action", selected.action.replaceAll("_", " ")],
              ["Status", selected.status.replaceAll("_", " ")],
              ["Item", `${selected.product.name} (${selected.product.sku})`],
              ["Quantity", `${selected.quantity} ${selected.product.unit}`],
              ["From", selected.sourceLocation?.name ?? "Not applicable"],
              ["To", selected.destinationLocation?.name ?? "Not applicable"],
              ["Reference", selected.referenceNumber ?? "Not provided"],
              ["Created by", selected.createdBy?.displayName ?? "System"],
              ["Reviewed by", selected.approvedBy?.displayName ?? "Not reviewed"],
              ["Previous system quantity", selected.systemQuantityBefore ?? "Not recorded"],
              ["Difference", selected.discrepancyDifference ?? "Not applicable"],
            ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/80 bg-white/80 p-3"><dt className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]">{label}</dt><dd className="mt-1 break-words text-xs font-bold text-[#24466f]">{value}</dd></div>)}
          </dl>
          {isStockAdjustment(selected) && <div className="mt-4 rounded-xl border border-[#efc36f] bg-white p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#a8670d]">Adjustment reason</p><p className="mt-1 text-sm font-bold text-[#704a12]">{adjustmentReason}</p></div>}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#e1e8f1] bg-white p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]">Audit notes</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]">{selected.notes ?? "No audit notes recorded."}</p></div>
            <div className="rounded-xl border border-[#e1e8f1] bg-white p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]">Voice transcript</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]">{selected.transcript ?? "No voice transcript attached."}</p></div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]"><tr>{["Date", "Transaction", "Action", "Item", "Quantity", "Location", "Created by", "Status", "Details"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-extrabold">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#edf1f6] text-xs">
            {visibleTransactions.map((transaction) => {
              const adjustment = isStockAdjustment(transaction);
              return <tr key={transaction.id} tabIndex={0} role="button" onClick={() => setSelected(transaction)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(transaction); } }} className={`cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#155eef] ${adjustment ? "bg-[#fff8e9] hover:bg-[#fff1d2]" : "hover:bg-[#f7faff]"}`}>
                <td className={`whitespace-nowrap px-5 py-4 text-[#6c829f] ${adjustment ? "border-l-4 border-[#e49a20]" : ""}`}>{new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(transaction.createdAt))}</td>
                <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">TX-{transaction.id.slice(0, 8).toUpperCase()}</td>
                <td className="whitespace-nowrap px-5 py-4 font-bold text-[#496482]"><div className="flex flex-col items-start gap-1"><span>{transaction.action.replaceAll("_", " ")}</span>{adjustment && <span className="inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2 py-0.5 text-[9px] font-extrabold text-white"><Flag size={10} /> Adjusted stock</span>}</div></td>
                <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">{transaction.product.name}</td>
                <td className="whitespace-nowrap px-5 py-4 font-bold text-[#29466f]">{transaction.quantity} {transaction.product.unit}</td>
                <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-5 py-4 text-[#496482]">{transaction.createdBy?.displayName ?? "System"}</td>
                <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusTone(transaction.status)}`}>{transaction.status.replaceAll("_", " ")}</span></td>
                <td className="whitespace-nowrap px-5 py-4"><span className="inline-flex items-center gap-1 font-extrabold text-[#155eef]"><Eye size={14} /> View</span></td>
              </tr>;
            })}
            {!loading && !visibleTransactions.length && <tr><td colSpan={9} className="px-6 py-12 text-center text-sm font-semibold text-[#7f92aa]">No audit transactions match the selected filters.</td></tr>}
            {loading && <tr><td colSpan={9} className="px-6 py-12 text-center text-sm font-semibold text-[#7f92aa]">Loading audit transactions…</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
