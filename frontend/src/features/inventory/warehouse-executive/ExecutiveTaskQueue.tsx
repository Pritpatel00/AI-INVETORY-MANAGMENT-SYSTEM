"use client";

import { Mic, Clock, AlertTriangle, ChevronDown, ClipboardCheck } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { formatCountPeriod, priorityTone } from "../shared/helpers";

interface TaskItem {
  id: string;
  title: string;
  type: string;
  detail: string;
  note: string;
  urgent: boolean;
  priority?: string;
  status: string;
  dueAt: string | null;
  automatic: boolean;
  caseNumber?: string;
  caseExpected?: number;
  caseCounted?: number;
  caseDifference?: number;
  planNumber?: string;
  planTitle?: string;
  planCompleted?: number;
  planTotal?: number;
  blindCount?: boolean;
  /** YYYY-MM count period for Month-End Cycle Count tasks. */
  countPeriod?: string;
  /** True when this task is part of a Month-End Cycle Count plan. */
  monthEndCount?: boolean;
  shipmentReference?: string;
  reservationReference?: string;
}

interface ExecutiveTaskQueueProps {
  workerTasks: TaskItem[];
  taskActionId: string | null;
  lastTaskRefresh: Date | null;
  completedAssignedTasks: number;
  taskLoadError?: boolean;
  message?: string | null;
  onRefreshTasks?: () => void;
  onOpenTask: (taskId: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onOpenRecount: (taskId: string) => void;
  onBack: () => void;
}

export function ExecutiveTaskQueue({
  workerTasks, taskActionId, lastTaskRefresh, completedAssignedTasks,
  taskLoadError = false, message, onRefreshTasks, onOpenTask, onStartTask, onCompleteTask, onOpenRecount, onBack,
}: ExecutiveTaskQueueProps) {
  const actionableTasks = workerTasks.filter(
    (task) => task.automatic || task.urgent,
  );

  return (
    <section className="worker-task-screen rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Task queue</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">Work assigned to you</h2>
          <p className="mt-1 text-xs font-semibold text-[#7b8fa9]">Only actionable tasks are shown. Pending approvals appear in History.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />
            Live{lastTaskRefresh ? ` · ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(lastTaskRefresh)}` : ""}
          </span>
          <span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]">
            {workerTasks.length} open · {completedAssignedTasks} done
          </span>
          <button type="button" onClick={onBack} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]">
            <ChevronDown size={15} className="rotate-90" /> Home
          </button>
        </div>
      </div>

      {taskLoadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3d9a2] bg-[#fff8e8] px-5 py-3 sm:px-6">
          <p className="text-xs font-bold leading-5 text-[#916018]">
            The task service is unavailable, so this queue may be incomplete.
            Completed work is never recreated from history — refresh to
            confirm the current status.
          </p>
          {onRefreshTasks && (
            <button
              type="button"
              onClick={onRefreshTasks}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e3b968] bg-white px-3 text-xs font-extrabold text-[#916018] transition hover:bg-[#fff3d6]"
            >
              Refresh tasks
            </button>
          )}
        </div>
      )}

      {message && (
        <div role="status" className="border-b border-[#cfe0f8] bg-[#f2f7ff] px-5 py-3 sm:px-6">
          <p className="text-xs font-bold leading-5 text-[#28568f]">{message}</p>
        </div>
      )}

      {actionableTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No tasks assigned"
          description="Assigned work appears here when a manager creates tasks for you."
        />
      ) : (
        <div className="divide-y divide-[#edf1f6]">
          {actionableTasks.map((task) => (
            <article key={task.id} className="worker-task-card p-5 transition hover:bg-[#f8faff] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-extrabold text-[#17345f]">{task.title}</p>
                    {task.monthEndCount && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f2efff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#6349c1]">
                        Month-End Cycle Count
                      </span>
                    )}
                    {task.type === "RECOUNT" && task.caseNumber && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f2efff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#6349c1]">
                        Recount required · {task.caseNumber}
                      </span>
                    )}
                    {task.type === "SHIP" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf8f1] px-2.5 py-0.5 text-[10px] font-extrabold text-[#16865b]">
                        Ship reserved stock
                      </span>
                    )}
                    {task.shipmentReference && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3fb] px-2.5 py-0.5 text-[10px] font-extrabold text-[#2f5d9c]">
                        {task.shipmentReference}
                      </span>
                    )}
                    {task.planNumber && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0e7490]">
                        {task.planNumber} · {task.planCompleted ?? 0}/{task.planTotal ?? 0} complete
                      </span>
                    )}
                    {task.urgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1e3] px-2.5 py-0.5 text-[10px] font-extrabold text-[#c56c08]">
                        <AlertTriangle size={12} /> Urgent
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#7186a3]">{task.detail}</p>
                  {task.planTitle && <p className="mt-1 text-[10px] font-bold text-[#0e7490]">{task.planTitle}{task.countPeriod ? ` · Count period ${formatCountPeriod(task.countPeriod)}` : ""}{task.blindCount ? " · Blind count: system quantity is hidden" : ""}</p>}
                  {task.monthEndCount && task.priority && (
                    <span className={`mt-1.5 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold ${priorityTone(task.priority)}`}>
                      {task.priority} priority
                    </span>
                  )}
                  {task.caseExpected !== undefined && task.caseCounted !== undefined && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#e5d9ff] bg-[#faf7ff] px-3 py-2 text-[11px] font-bold text-[#5a4696]">
                      <span>Previous count {task.caseCounted}</span>
                      <span>System expected {task.caseExpected}</span>
                      <span className={task.caseDifference !== undefined && task.caseDifference < 0 ? "text-[#c04343]" : "text-[#0e7490]"}>
                        Difference {task.caseDifference !== undefined && task.caseDifference > 0 ? `+${task.caseDifference}` : task.caseDifference}
                      </span>
                    </p>
                  )}
                  {task.reservationReference && (
                    <p className="mt-1 text-[10px] font-bold text-[#2f5d9c]">Order {task.reservationReference}</p>
                  )}
                  {task.dueAt && (
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#b36d0c]">
                      <Clock size={12} />
                      Due {new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(task.dueAt))}
                    </p>
                  )}
                  {task.note && (
                    <p className="mt-2 rounded-lg bg-[#f4f7fc] px-3 py-2 text-[10px] font-semibold leading-4 text-[#6c829f]">{task.note}</p>
                  )}
                </div>
                <div className="worker-task-action flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {task.automatic ? (
                    <>
                      <button
                        type="button"
                        disabled={taskActionId === task.id}
                        onClick={() => void onOpenTask(task.id)}
                        className="flex items-center gap-2 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] disabled:opacity-60"
                      >
                        <Mic size={15} />
                        Start with voice
                      </button>
                      {task.type === "SHIP" && (
                        <>
                          {onStartTask && (
                            <button
                              type="button"
                              disabled={taskActionId === task.id}
                              onClick={() => void onStartTask(task.id)}
                              className="flex items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 py-2.5 text-xs font-extrabold text-[#155eef] disabled:opacity-60"
                            >
                              Start task
                            </button>
                          )}
                          {onCompleteTask && (
                            <button
                              type="button"
                              disabled={taskActionId === task.id}
                              onClick={() => void onCompleteTask(task.id)}
                              className="flex items-center gap-2 rounded-xl bg-[#16865b] px-3 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.2)] disabled:opacity-60"
                            >
                              Complete task
                            </button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void onOpenRecount(task.id)}
                      className="flex items-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(212,123,8,0.22)]"
                    >
                      <Mic size={15} />
                      Start recount
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
