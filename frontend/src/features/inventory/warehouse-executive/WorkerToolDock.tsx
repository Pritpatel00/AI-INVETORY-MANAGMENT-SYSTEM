import { LayoutDashboard, ClipboardCheck, FileClock, Settings } from "lucide-react";

interface WorkerToolDockProps {
  activePage: string;
  onNavigate: (page: string) => void;
  pendingTaskCount?: number;
}

export function WorkerToolDock({ activePage, onNavigate, pendingTaskCount = 0 }: WorkerToolDockProps) {
  const tools = [
    [LayoutDashboard, "Home", "Home"],
    [ClipboardCheck, "Task queue", "Tasks"],
    [FileClock, "History", "History"],
    [Settings, "Settings", "Settings"],
  ] as const;

  return (
    <nav aria-label="Warehouse Executive tools" className="worker-tool-dock fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 lg:hidden">
      {tools.map(([Icon, target, label]) => {
        const active = activePage === target || (target === "Home" && ["Overview", "My transactions", "Cycle counts", "Posted today"].includes(activePage));
        return (
          <button
            key={target}
            type="button"
            onClick={() => { onNavigate(target); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`worker-tool-button relative ${active ? "is-active" : ""}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
            {target === "Task queue" && pendingTaskCount > 0 && (
              <span
                aria-label={`${pendingTaskCount} pending tasks`}
                className="absolute right-[22%] top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#e53935] px-1 text-[10px] font-black leading-none text-white shadow-[0_4px_10px_rgba(229,57,53,.35)]"
              >
                {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
