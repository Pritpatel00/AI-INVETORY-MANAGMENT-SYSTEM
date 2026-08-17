import { LayoutDashboard, ClipboardCheck, Boxes, FileClock, Settings, ArrowRightLeft, Truck, PackageCheck, Warehouse, UsersRound, Activity, X, UserRound, SearchCheck, LockKeyhole, type LucideIcon } from "lucide-react";
import type { Role } from "../types";
import { Brand } from "./Brand";
import { roleLabel } from "./helpers";
import { stockReservationsEnabled } from "../reservations/feature";

interface AppSidebarProps {
  role: Role;
  displayName: string;
  activePage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  close: () => void;
  pendingApprovals?: number;
  pendingWorkerTasks?: number;
}

export function AppSidebar({ role, displayName, activePage, onNavigate, mobileOpen, close, pendingApprovals = 0, pendingWorkerTasks = 0 }: AppSidebarProps) {
  const workerItems: Array<[LucideIcon, string]> = [
    [LayoutDashboard, "Home"],
    [ClipboardCheck, "Task queue"],
    [FileClock, "History"],
    [Settings, "Settings"],
  ];
  const managerItems: Array<[LucideIcon, string]> = [
    [LayoutDashboard, "Overview"],
    [ArrowRightLeft, "Transactions"],
    [SearchCheck, "Discrepancies"],
    ...(stockReservationsEnabled ? [[LockKeyhole, "Reservations"] as [LucideIcon, string]] : []),
    [Truck, "Purchase Items"],
    [ClipboardCheck, "Task planning"],
    [PackageCheck, "Catalog"],
    [Warehouse, "Locations"],
  ];
  const managerBadges: Record<string, number> = { Transactions: pendingApprovals };
  const workerBadges: Record<string, number> = { "Task queue": pendingWorkerTasks };
  const administratorItems: Array<[LucideIcon, string]> = [
    [LayoutDashboard, "Overview"],
    [Boxes, "Items"],
    [FileClock, "Audit transactions"],
    [UsersRound, "User access"],
    [Activity, "System health"],
  ];
  type NavGroup = { heading: string; items: Array<[LucideIcon, string]> };
  const navGroups: NavGroup[] =
    role === "worker"
      ? [{ heading: "Executive tools", items: workerItems }]
      : role === "manager"
        ? [{ heading: "Management", items: managerItems }]
        : [{ heading: "Administration", items: administratorItems }];

  function navigateTo(label: string) {
    close();
    onNavigate(label);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      {mobileOpen && <button aria-label="Close navigation" onClick={close} className="fixed inset-0 z-30 bg-[#0b2343]/40 lg:hidden" />}
      <aside
        className={`sidebar-shell fixed inset-y-0 left-0 z-40 flex w-[254px] flex-col px-5 py-6 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button onClick={close} aria-label="Close navigation" className="rounded-lg p-2 text-[#7890b0] lg:hidden">
            <X size={19} />
          </button>
        </div>
        <div className="sidebar-workspace mt-9 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#7892b8]">Active workspace</p>
          <p className="mt-1 text-sm font-extrabold text-[#17345f]">Central Warehouse</p>
        </div>
        <nav className="sidebar-scroll mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <div key={group.heading} className="mb-5">
              <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9aabc1]">{group.heading}</p>
              {group.items.map(([Icon, label]) => {
                const badge = group.heading === "Management" ? managerBadges[label] ?? 0 : group.heading === "Executive tools" ? workerBadges[label] ?? 0 : 0;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigateTo(label)}
                    aria-current={activePage === label ? "page" : undefined}
                    className={`sidebar-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                      activePage === label ? "sidebar-nav-active text-white" : "sidebar-nav-idle text-[#627998]"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2} />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {badge > 0 && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold leading-none ${
                          activePage === label ? "bg-white/25 text-white" : "bg-[#fff4df] text-[#b36d0c]"
                        }`}
                        title={`${badge} transaction${badge === 1 ? "" : "s"} waiting for review`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-profile mt-5 shrink-0 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8effb] text-[#244a7e]">
              <UserRound size={18} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#17345f]">{displayName}</p>
              <p className="text-[10px] font-semibold text-[#8295af]">{roleLabel(role)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
