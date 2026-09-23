"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Mic,
} from "lucide-react";

interface TodayTask {
  id: string;
  title: string;
  type: string;
  detail: string;
  urgent: boolean;
  priority?: string;
  status: string;
  dueAt: string | null;
  automatic: boolean;
}

interface TodayTaskSheetProps {
  tasks: TodayTask[];
  onOpenTask: (taskId: string) => void;
  onViewAll: () => void;
}

function dueLabel(value: string | null) {
  if (!value) return "No due time";
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return "Due time unavailable";
  return `Due ${new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(due)}`;
}

function statusLabel(status: string) {
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "COMPLETED") return "Completed";
  if (status === "WAITING") return "Needs attention";
  return "Open";
}

export function TodayTaskSheet({ tasks, onOpenTask, onViewAll }: TodayTaskSheetProps) {
  const visibleTasks = [...tasks]
    .sort((left, right) => {
      if (left.urgent !== right.urgent) return left.urgent ? -1 : 1;
      if (left.status !== right.status) return left.status === "IN_PROGRESS" ? -1 : 1;
      return (left.dueAt ?? "9999").localeCompare(right.dueAt ?? "9999");
    })
    .slice(0, 4);
  const urgentCount = tasks.filter((task) => task.urgent).length;

  return (
    <section className="today-task-sheet rounded-[24px] border border-[#d9e6f8] bg-white p-5 shadow-[0_14px_42px_rgba(16,45,82,0.065)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-eyebrow">Today’s task sheet</p>
          <h2 className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-[#102a56]">
            Your next warehouse actions
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#7186a3]">
            Start assigned work directly in the protected voice workflow.
          </p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf4ff] text-[#155eef]">
          <ClipboardList size={21} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-extrabold">
        <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[#155eef]">
          {tasks.length} open task{tasks.length === 1 ? "" : "s"}
        </span>
        {urgentCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1e3] px-3 py-1.5 text-[#b35f08]">
            <AlertTriangle size={12} />
            {urgentCount} urgent
          </span>
        )}
        <span className="rounded-full bg-[#eaf8f1] px-3 py-1.5 text-[#16865b]">
          Voice protected
        </span>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#c9d8ee] bg-[#f8fbff] px-4 py-7 text-center">
          <CheckCircle2 className="mx-auto text-[#20a875]" size={26} />
          <p className="mt-2 text-sm font-extrabold text-[#17345f]">You’re clear for now</p>
          <p className="mt-1 text-xs font-semibold text-[#7186a3]">New assignments will appear here automatically.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {visibleTasks.map((task) => (
            <article key={task.id} className="rounded-2xl border border-[#e2eaf5] bg-[#fbfdff] p-3.5 transition hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_8px_20px_rgba(21,94,239,0.08)]">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${task.urgent ? "bg-[#fff1e3] text-[#c56c08]" : "bg-[#edf4ff] text-[#155eef]"}`}>
                  {task.urgent ? <AlertTriangle size={16} /> : <ClipboardList size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-xs font-extrabold leading-5 text-[#17345f]">{task.title}</p>
                    <span className="shrink-0 rounded-full bg-[#f2f6fb] px-2 py-1 text-[9px] font-extrabold text-[#58708f]">
                      {statusLabel(task.status)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-[#7186a3]">{task.detail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-extrabold text-[#8295af]">
                    <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {dueLabel(task.dueAt)}</span>
                    {task.priority && <span>{task.priority} priority</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (task.automatic ? onOpenTask(task.id) : onViewAll())}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] px-3 py-2 text-[11px] font-extrabold text-white shadow-[0_7px_16px_rgba(21,94,239,0.2)] transition hover:bg-[#0d4fd6]"
              >
                <Mic size={14} />
                {task.automatic ? "Open with voice" : "Open task queue"}
                <ArrowUpRight size={14} />
              </button>
            </article>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 py-2.5 text-xs font-extrabold text-[#155eef] transition hover:bg-[#f5f8ff]"
      >
        View full task queue <ArrowUpRight size={14} />
      </button>
    </section>
  );
}
