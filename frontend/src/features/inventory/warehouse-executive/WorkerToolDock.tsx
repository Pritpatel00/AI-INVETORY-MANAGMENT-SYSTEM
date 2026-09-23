import { LayoutDashboard, Mic, ClipboardCheck, FileClock, Settings } from "lucide-react";

interface WorkerToolDockProps {
  activePage: string;
  onNavigate: (page: string) => void;
  pendingTaskCount?: number;
  pendingSyncCount?: number;
}

/**
 * Touch-first navigation for warehouse executives working on phones.
 * Voice entry sits in the middle because it is the primary shop-floor action.
 */
export function WorkerToolDock({ activePage, onNavigate, pendingTaskCount = 0, pendingSyncCount = 0 }: WorkerToolDockProps) {
  const tools = [
    [LayoutDashboard, "Overview", "Overview"],
    [Mic, "Voice entry", "Voice"],
    [ClipboardCheck, "Task queue", "Tasks"],
    [FileClock, "History", "History"],
    [Settings, "Settings", "Settings"],
  ] as const;

  // Legacy "Home" is resolved to "Overview" by the shell, but keep it listed so
  // a stored page value still highlights the dock item.
  const homeTargets = ["Overview", "Home", "My transactions", "Cycle counts", "Posted today"];

  return (
    <nav aria-label="Warehouse Executive tools" className="worker-tool-dock fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 lg:hidden">
      {tools.map(([Icon, target, label]) => {
        const active = activePage === target || (target === "Overview" && homeTargets.includes(activePage));
        return (
          <button
            key={target}
            type="button"
            onClick={() => onNavigate(target)}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`worker-tool-button relative ${active ? "is-active" : ""}`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            <span>{label}</span>
            {target === "Task queue" && pendingTaskCount > 0 && (
              <span
                aria-label={`${pendingTaskCount} pending tasks`}
                className="absolute right-[18%] top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#d92d20] px-1 text-[10px] font-bold leading-none text-white"
              >
                {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
              </span>
            )}
            {target === "Overview" && pendingSyncCount > 0 && (
              <span
                aria-label={`${pendingSyncCount} updates waiting to synchronize`}
                className="absolute right-[16%] top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#b54708] px-1 text-[10px] font-bold leading-none text-white"
              >
                {pendingSyncCount > 99 ? "99+" : pendingSyncCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
