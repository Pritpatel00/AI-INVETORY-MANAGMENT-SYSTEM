import { Sparkles, Clock3, ClipboardCheck, ShieldCheck, ArrowRightLeft, Boxes, CheckCircle2, Mic, Settings, LayoutDashboard, FileClock, BellRing, X, ChevronDown, type LucideIcon } from "lucide-react";
import { MetricCard } from "../shared/MetricCard";
import { type InventorySnapshot } from "../api/inventory-api";

interface ExecutiveOverviewProps {
  page: string;
  onNavigate: (page: string) => void;
  workerName: string;
  workerGreeting: string;
  clockNow: Date;
  snapshot: InventorySnapshot | null;
  todayTransactions: Array<{ id: string; action: string; product: { name: string; unit: string }; quantity: number; status: string; createdAt: string; sourceLocation?: { name: string } | null; destinationLocation?: { name: string } | null }>;
  cycleCountsToday: number;
  postedToday: number;
  workerTasks: Array<{ id: string; title: string; type: string; detail: string; note: string; urgent: boolean; status: string; dueAt: string | null; automatic: boolean }>;
  metricPageTransactions: Array<{ id: string; action: string; product: { name: string; unit: string }; quantity: number; status: string; createdAt: string; sourceLocation?: { name: string } | null; destinationLocation?: { name: string } | null }>;
  metricPageTitle: string;
  cancellingTransactionId: string | null;
  onCancelTransaction: (id: string) => void;
  newTaskAlert: string;
  setNewTaskAlert: (alert: string) => void;
  formatAction: (action: string) => string;
}

export function ExecutiveOverview({
  page, onNavigate, workerName, workerGreeting, clockNow, snapshot,
  todayTransactions, cycleCountsToday, postedToday, workerTasks,
  metricPageTransactions, metricPageTitle, cancellingTransactionId,
  onCancelTransaction, newTaskAlert, setNewTaskAlert, formatAction,
}: ExecutiveOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] border border-[#d9e6f8] bg-gradient-to-br from-[#0b2a58] via-[#12468f] to-[#2f6fe8] p-6 text-white shadow-[0_22px_55px_rgba(16,42,86,0.22)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#6ea5ff]/30 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur">
              <Sparkles size={13} />
              {new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(clockNow)}
            </div>
            <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]">{workerGreeting}, {workerName}</h1>
            <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]">
              {snapshot
                ? workerTasks.length > 0 || postedToday > 0
                  ? `${workerTasks.length} open task${workerTasks.length === 1 ? "" : "s"} and ${postedToday} update${postedToday === 1 ? "" : "s"} posted today \u2014 pick a tool below to continue.`
                  : "Your workspace is ready \u2014 record voice updates, complete tasks and track your activity from the toolbar below."
                : "Live inventory data is loading from the warehouse service."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <Clock3 size={18} className="text-[#a9c6ff]" />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Live clock</p>
                <p className="text-sm font-extrabold tabular-nums">{new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: true }).format(clockNow)}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <ClipboardCheck size={18} className="text-[#ffd08a]" />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Open tasks</p>
                <p className="text-sm font-extrabold">{workerTasks.length} waiting</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck size={18} className="text-[#9dffce]" />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Posted today</p>
                <p className="text-sm font-extrabold">{postedToday} updates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="My transactions" value={String(todayTransactions.length)} detail="Created today" icon={ArrowRightLeft} onClick={() => { onNavigate("My transactions"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        <MetricCard label="Cycle counts" value={String(cycleCountsToday)} detail="Submitted today" icon={ClipboardCheck} tone="violet" onClick={() => { onNavigate("Cycle counts"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        <MetricCard label="Open tasks" value={String(workerTasks.length)} detail={workerTasks.some((t) => t.urgent) ? "Recount action required" : "No urgent recounts"} icon={Clock3} tone="amber" onClick={() => { onNavigate("Task queue"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        <MetricCard label="Posted today" value={String(postedToday)} detail="Validated inventory updates" icon={ShieldCheck} tone="green" onClick={() => { onNavigate("Posted today"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      </div>

      <section className="rounded-[24px] border border-[#d8e5f7] bg-white p-5 shadow-[0_18px_45px_rgba(16,42,86,0.1)]">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]">Quick toolbar</p>
          <h2 className="text-lg font-extrabold text-[#102a56]">Jump to any tool in one tap</h2>
          <p className="text-xs font-semibold text-[#8294ac]">Your most-used warehouse tools, right here \u2014 no menus required.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
          {([
            ["Voice entry", "Voice entry", Mic, "from-[#155eef] to-[#4a7df0]", undefined],
            ["Task queue", "Task queue", ClipboardCheck, "from-[#7257d6] to-[#9678f2]", workerTasks.length],
            ["Active items", "Active items", Boxes, "from-[#16865b] to-[#2fa97c]", snapshot?.products.length ?? 0],
            ["My history", "My history", FileClock, "from-[#be185d] to-[#ec4899]", undefined],
            ["My transactions", "My transactions", ArrowRightLeft, "from-[#d47b08] to-[#f0a13a]", todayTransactions.length],
            ["Cycle counts", "Cycle counts", CheckCircle2, "from-[#0e7490] to-[#38bdf8]", cycleCountsToday],
            ["Posted today", "Posted today", ShieldCheck, "from-[#16865b] to-[#22aa78]", postedToday],
            ["Settings", "Settings", Settings, "from-[#455b78] to-[#6e86a5]", undefined],
            ["Overview", "Home", LayoutDashboard, "from-[#4338ca] to-[#6366f1]", undefined],
          ] as Array<[string, string, LucideIcon, string, number | undefined]>).map(([pageName, label, ToolIcon, tone, count]) => (
            <button
              key={pageName}
              type="button"
              onClick={() => { onNavigate(pageName); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="group relative flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-3 text-left transition hover:-translate-y-1 hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] transition group-hover:scale-110`}>
                <ToolIcon size={18} />
              </span>
              <span className="mt-2 text-xs font-extrabold text-[#24466f]">{label}</span>
              {count !== undefined && count > 0 && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-[#fff4df] px-2 py-0.5 text-[9px] font-extrabold text-[#b36d0c]">{count}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {["My transactions", "Cycle counts", "Posted today"].includes(page) && (
        <section className="overflow-hidden rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Detailed page</p>
              <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">{metricPageTitle}</h2>
              <p className="mt-1 text-xs font-semibold text-[#7b8fa9]">Every record below is included in the number shown on the Overview card.</p>
            </div>
            <button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-xs font-extrabold text-[#155eef]">
              <ChevronDown size={16} className="rotate-90" /> Back to Overview
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-wider text-[#8295af]"><th className="px-5 py-3">Transaction</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Item</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Cancel</th></tr></thead>
              <tbody>{metricPageTransactions.map((t) => (
                <tr key={t.id} className="border-b border-[#eef2f7] last:border-0">
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">TX-{t.id.slice(0, 8).toUpperCase()}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#496482]">{formatAction(t.action)}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">{t.product.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#29466f]">{t.quantity} {t.product.unit}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{t.sourceLocation?.name ?? t.destinationLocation?.name ?? "\u2014"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(t.createdAt))}</td>
                  <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${t.status === "POSTED" ? "bg-[#eaf8f1] text-[#16865b]" : t.status === "REJECTED" ? "bg-[#fff0f0] text-[#b83b3b]" : t.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`}>{t.status.replaceAll("_", " ")}</span></td>
                  <td className="whitespace-nowrap px-5 py-4">{"PENDING" === t.status || "RECOUNT_REQUESTED" === t.status ? (
                    <button type="button" disabled={cancellingTransactionId === t.id} onClick={() => onCancelTransaction(t.id)} className="rounded-lg border border-[#efb5b5] px-3 py-1.5 text-[11px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{cancellingTransactionId === t.id ? "Cancelling\u2026" : "Cancel"}</button>
                  ) : <span className="text-[#d3dbe6]">\u2014</span>}</td>
                </tr>
              ))}{metricPageTransactions.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm font-semibold text-[#7b8fa9]">No matching records were found for today.</td></tr>}</tbody>
            </table>
          </div>
        </section>
      )}

      {newTaskAlert && (
        <div role="status" aria-live="polite" className="flex items-start justify-between gap-4 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f7faff] p-4 shadow-[0_12px_30px_rgba(21,94,239,0.09)]">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#155eef] text-white"><BellRing size={19} /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#155eef]">New assignment</p>
              <p className="mt-1 text-sm font-extrabold text-[#17345f]">{newTaskAlert}</p>
              <p className="mt-1 text-xs font-semibold text-[#7186a3]">Open the task queue below to review and start the work.</p>
            </div>
          </div>
          <button type="button" onClick={() => setNewTaskAlert("")} aria-label="Dismiss new task alert" className="rounded-lg p-2 text-[#6f84a3] transition hover:bg-white"><X size={17} /></button>
        </div>
      )}
    </div>
  );
}
