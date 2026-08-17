"use client";

import { Sparkles, Clock3, ClipboardCheck, ShieldCheck, ArrowRightLeft, CheckCircle2, Mic, BellRing, X, PackagePlus, ArrowUpDown, PackageMinus, AlertTriangle } from "lucide-react";
import { MetricCard } from "../shared/MetricCard";
import { WarehouseHero } from "../shared/WarehouseHero";
import type { InventorySnapshot } from "../api/inventory-api";

export type ExecutiveVoiceWorkflow =
  | "RECEIVE"
  | "SHIP_USE"
  | "TRANSFER"
  | "CYCLE_COUNT"
  | "DAMAGE_LOSS";

interface ExecutiveHomeProps {
  workerName: string;
  workerGreeting: string;
  clockNow: Date;
  snapshot: InventorySnapshot | null;
  todayTransactions: Array<{ id: string; action: string; product: { name: string; unit: string }; quantity: number; status: string; createdAt: string }>;
  cycleCountsToday: number;
  postedToday: number;
  workerTasks: Array<{ id: string; title: string; type: string; detail: string; note: string; urgent: boolean; status: string; dueAt: string | null }>;
  onNavigate: (page: string) => void;
  onStartVoiceWorkflow: (workflow: ExecutiveVoiceWorkflow) => void;
  newTaskAlert: string;
  setNewTaskAlert: (alert: string) => void;
}

export function ExecutiveHome({
  workerName, workerGreeting, clockNow, snapshot, todayTransactions,
  cycleCountsToday, postedToday, workerTasks,
  onNavigate, onStartVoiceWorkflow, newTaskAlert, setNewTaskAlert,
}: ExecutiveHomeProps) {
  return (
    <div className="space-y-6">
      <section className="hero-3d executive-hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#6ea5ff]/30 blur-3xl" />
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
                  ? `${workerTasks.length} open task${workerTasks.length === 1 ? "" : "s"} · ${postedToday} update${postedToday === 1 ? "" : "s"} posted today`
                  : "Your workspace is ready — record voice updates, complete tasks and track your activity."
                : "Live inventory data is loading from the warehouse service."}
            </p>
          </div>
          <div className="executive-hero-visual flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="warehouse-hero-frame hidden h-32 w-48 shrink-0 lg:block">
              <WarehouseHero variant="executive" className="h-full w-full" />
              <span className="warehouse-hero-status"><span /> Voice ready</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <Clock3 size={18} className="text-[#a9c6ff]" />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Current time</p>
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
        </div>
      </section>

      <div className="worker-mobile-metrics grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="My transactions" value={String(todayTransactions.length)} detail="Created today" icon={ArrowRightLeft} onClick={() => { onNavigate("History"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        <MetricCard label="Cycle counts" value={String(cycleCountsToday)} detail="Submitted today" icon={ClipboardCheck} tone="violet" onClick={() => { onNavigate("History"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        <MetricCard label="Open tasks" value={String(workerTasks.length)} detail={workerTasks.some((t) => t.urgent) ? "Recount action required" : "No urgent recounts"} icon={Clock3} tone="amber" onClick={() => { onNavigate("Task queue"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        <MetricCard label="Posted today" value={String(postedToday)} detail="Validated inventory updates" icon={ShieldCheck} tone="green" onClick={() => { onNavigate("History"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      </div>

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
          <button type="button" onClick={() => setNewTaskAlert("")} aria-label="Dismiss" className="rounded-lg p-2 text-[#6f84a3] transition hover:bg-white"><X size={17} /></button>
        </div>
      )}

      <section className="rounded-[24px] border border-[#d8e5f7] bg-white p-5 shadow-[0_18px_45px_rgba(16,42,86,0.1)]">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]">Quick actions</p>
          <h2 className="text-lg font-extrabold text-[#102a56]">Start a voice update</h2>
          <p className="text-xs font-semibold text-[#8294ac]">Select the action you performed, then speak the details.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          <QuickActionButton
            icon={PackagePlus}
            label="Receive"
            gradient="from-[#155eef] to-[#4a7df0]"
            onClick={() => onStartVoiceWorkflow("RECEIVE")}
          />
          <QuickActionButton
            icon={PackageMinus}
            label="Ship / Use"
            gradient="from-[#d47b08] to-[#f0a13a]"
            onClick={() => onStartVoiceWorkflow("SHIP_USE")}
          />
          <QuickActionButton
            icon={ArrowUpDown}
            label="Transfer"
            gradient="from-[#7257d6] to-[#9678f2]"
            onClick={() => onStartVoiceWorkflow("TRANSFER")}
          />
          <QuickActionButton
            icon={CheckCircle2}
            label="Cycle count"
            gradient="from-[#0e7490] to-[#38bdf8]"
            onClick={() => onStartVoiceWorkflow("CYCLE_COUNT")}
          />
          <QuickActionButton
            icon={AlertTriangle}
            label="Damage / Loss"
            gradient="from-[#be185d] to-[#ec4899]"
            onClick={() => onStartVoiceWorkflow("DAMAGE_LOSS")}
          />
        </div>
      </section>
    </div>
  );
}

function QuickActionButton({
  icon: Icon, label, gradient, onClick,
}: {
  icon: typeof Mic;
  label: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Start voice update for ${label}`}
      className="group relative flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-3 text-left transition hover:-translate-y-1 hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] transition group-hover:scale-110`}>
        <Icon size={18} />
      </span>
      <span className="mt-2 text-xs font-extrabold text-[#24466f]">{label}</span>
    </button>
  );
}
