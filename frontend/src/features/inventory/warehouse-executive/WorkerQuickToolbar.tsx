"use client";

/**
 * Worker quick toolbar.
 *
 * Rendered on the live worker overview (ExecutiveHome). Every target below is
 * a page value the worker dashboard actually renders — "Active items" resolves
 * to the read-only inventory catalogue and "History" to the worker history
 * screen. Keep this list in sync with the early returns in
 * `ExecutiveDashboard.tsx`; an unknown value would fall back to the overview.
 */

import {
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  LayoutDashboard,
  Mic,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface WorkerQuickToolbarProps {
  activeItemsCount: number;
  openTasksCount: number;
  todayTransactionsCount: number;
  cycleCountsToday: number;
  postedToday: number;
  onNavigate: (page: string) => void;
}

type ToolTone = "info" | "warning" | "success" | "violet" | "neutral";

type ToolDefinition = {
  /** Page value passed to `onNavigate`. */
  page: string;
  label: string;
  icon: typeof Mic;
  tone: ToolTone;
  count?: number;
  /** Spoken/written description of the count for screen readers. */
  countLabel?: string;
};

const toneClasses: Record<ToolTone, string> = {
  info: "bg-[#eff4ff] text-[#175cd3]",
  warning: "bg-[#fffaeb] text-[#b54708]",
  success: "bg-[#ecfdf3] text-[#027a48]",
  violet: "bg-[#f4f3ff] text-[#5925dc]",
  neutral: "bg-[#f2f4f7] text-[#475467]",
};

export function WorkerQuickToolbar({
  activeItemsCount,
  openTasksCount,
  todayTransactionsCount,
  cycleCountsToday,
  postedToday,
  onNavigate,
}: WorkerQuickToolbarProps) {
  const tools: ToolDefinition[] = [
    { page: "Voice entry", label: "Voice entry", icon: Mic, tone: "info" },
    {
      page: "Task queue",
      label: "Task queue",
      icon: ClipboardCheck,
      tone: "warning",
      count: openTasksCount,
      countLabel: "open tasks",
    },
    {
      page: "Active items",
      label: "Active items",
      icon: Boxes,
      tone: "success",
      count: activeItemsCount,
      countLabel: "active items",
    },
    { page: "History", label: "History", icon: FileClock, tone: "neutral" },
    {
      page: "My transactions",
      label: "My transactions",
      icon: ArrowRightLeft,
      tone: "info",
      count: todayTransactionsCount,
      countLabel: "created today",
    },
    {
      page: "Cycle counts",
      label: "Cycle counts",
      icon: CheckCircle2,
      tone: "violet",
      count: cycleCountsToday,
      countLabel: "submitted today",
    },
    {
      page: "Posted today",
      label: "Posted today",
      icon: ShieldCheck,
      tone: "success",
      count: postedToday,
      countLabel: "posted today",
    },
    { page: "Settings", label: "Settings", icon: Settings, tone: "neutral" },
    { page: "Overview", label: "Overview", icon: LayoutDashboard, tone: "neutral" },
  ];

  return (
    <section
      id="worker-overview-command"
      aria-labelledby="worker-quick-toolbar-title"
      className="rounded-[16px] border border-[#e4e7ec] bg-white p-4 sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#667085]">Quick toolbar</p>
        <h2 id="worker-quick-toolbar-title" className="text-[15px] font-bold text-[#101828]">
          Jump to any tool in one tap
        </h2>
        <p className="text-[12px] leading-5 text-[#475467]">
          Your most-used warehouse tools — no menus required.
        </p>
      </div>

      <ul className="mt-3.5 grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const hasCount = typeof tool.count === "number" && tool.count > 0;
          return (
            <li key={tool.page}>
              <button
                type="button"
                onClick={() => {
                  onNavigate(tool.page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                aria-label={
                  hasCount && tool.countLabel
                    ? `${tool.label} — ${tool.count} ${tool.countLabel}`
                    : tool.label
                }
                className="flex min-h-[46px] w-full items-center gap-2.5 rounded-[10px] border border-[#e4e7ec] bg-white px-3 py-2.5 text-left transition hover:border-[#b2c8ff] hover:bg-[#f9fafb]"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-[8px] ${toneClasses[tool.tone]}`}
                >
                  <Icon size={16} strokeWidth={2.1} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#101828]">
                  {tool.label}
                </span>
                {hasCount ? (
                  <span
                    aria-hidden="true"
                    className="shrink-0 rounded-full bg-[#f2f4f7] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#475467]"
                  >
                    {tool.count}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
