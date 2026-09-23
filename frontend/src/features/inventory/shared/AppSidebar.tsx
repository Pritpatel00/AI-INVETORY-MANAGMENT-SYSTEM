import {
  LayoutDashboard,
  ClipboardCheck,
  Boxes,
  FileClock,
  Settings,
  ArrowRightLeft,
  Truck,
  PackageCheck,
  Warehouse,
  UsersRound,
  Activity,
  X,
  UserRound,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "../types";
import { Brand } from "./Brand";
import { roleLabel } from "./helpers";

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

type NavItem = { icon: LucideIcon; label: string; hint: string };
type NavGroup = { heading: string; items: NavItem[] };

export function AppSidebar({
  role,
  displayName,
  activePage,
  onNavigate,
  mobileOpen,
  close,
  pendingApprovals = 0,
  pendingWorkerTasks = 0,
}: AppSidebarProps) {
  const workerItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Overview", hint: "Today's work and stock activity" },
    { icon: ClipboardCheck, label: "Task queue", hint: "Assigned warehouse tasks" },
    { icon: Boxes, label: "Active items", hint: "Read-only live stock catalogue" },
    { icon: FileClock, label: "History", hint: "Your submitted inventory updates" },
    { icon: Settings, label: "Settings", hint: "Microphone and access checks" },
  ];
  const managerItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Overview", hint: "Approvals, accuracy and alerts" },
    { icon: ArrowRightLeft, label: "Transactions", hint: "Review and post stock changes" },
    { icon: SearchCheck, label: "Discrepancies", hint: "Count differences and recounts" },
    { icon: Truck, label: "Purchase Items", hint: "Below safety level and reorder" },
    { icon: ClipboardCheck, label: "Task planning", hint: "Assign and schedule daily work" },
    { icon: PackageCheck, label: "Catalog", hint: "Products, units and reorder rules" },
    { icon: Warehouse, label: "Locations", hint: "Warehouses, zones, shelves and bins" },
  ];
  const administratorItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Overview", hint: "Items, users and service health" },
    { icon: Boxes, label: "Items", hint: "Search and edit every item" },
    { icon: FileClock, label: "Audit transactions", hint: "Read-only ledger and evidence" },
    { icon: UsersRound, label: "User access", hint: "Accounts, roles and permissions" },
    { icon: Activity, label: "System health", hint: "Database, identity, AI and speech" },
  ];

  const navGroups: NavGroup[] =
    role === "worker"
      ? [{ heading: "Warehouse executive", items: workerItems }]
      : role === "manager"
        ? [{ heading: "Management", items: managerItems }]
        : [{ heading: "Administration", items: administratorItems }];

  const badges: Record<string, number> =
    role === "manager" ? { Transactions: pendingApprovals } : role === "worker" ? { "Task queue": pendingWorkerTasks } : {};

  /** Words that open a screen are clickable; hints ride along as tooltips. */
  function navigateTo(label: string) {
    close();
    onNavigate(label);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const initials = (displayName || role)
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {mobileOpen && (
        <button aria-label="Close navigation" onClick={close} className="fixed inset-0 z-30 bg-[#101828]/55 lg:hidden" />
      )}
      <aside
        aria-label="Primary navigation"
        className={`sidebar-shell fixed inset-y-0 left-0 z-40 flex w-[254px] flex-col px-3 py-5 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Brand />
          <button
            onClick={close}
            aria-label="Close navigation"
            className="rounded-[10px] p-2 text-[#98a2b3] hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-workspace mt-6 rounded-[12px] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]">Active workspace</p>
          <p className="mt-0.5 text-[13px] font-bold">Central Warehouse</p>
        </div>

        <nav className="sidebar-scroll mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.heading}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">{group.heading}</p>
              <div className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, hint }) => {
                  const active = activePage === label;
                  const badge = badges[label] ?? 0;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => navigateTo(label)}
                      title={hint}
                      aria-current={active ? "page" : undefined}
                      className={`sidebar-nav-item flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-bold ${
                        active ? "sidebar-nav-active" : "sidebar-nav-idle"
                      }`}
                    >
                      <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {badge > 0 && (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                            active ? "bg-white/20 text-white" : "bg-[#fffaeb] text-[#b54708]"
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
            </div>
          ))}
        </nav>

        <div className="sidebar-profile mt-4 shrink-0 rounded-[12px] p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[11px] font-bold">
              {initials || <UserRound size={16} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold">{displayName}</p>
              <p className="truncate text-[10px] font-semibold">{roleLabel(role)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
