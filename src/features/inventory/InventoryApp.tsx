"use client";

import {
  AlertTriangle,
  Activity,
  ArrowDownToLine,
  ArrowRightLeft,
  BellRing,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CloudUpload,
  Clock3,
  Download,
  FileClock,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  PackageCheck,
  PackageMinus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Trash2,
  UserRound,
  UsersRound,
  Volume2,
  Warehouse,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";

import {
  approveReorderDraft,
  approveInventoryTransaction,
  cancelInventoryTransaction,
  cancelReorderDraft,
  confirmInventoryTransaction,
  createInventoryProduct,
  createInventoryTask,
  createLocation,
  deleteLocation,
  createSupplier,
  createSystemUser,
  createPendingInventoryTransaction,
  deleteInventoryProduct,
  deleteSupplier,
  extractInventoryDetails,
  fetchInventorySnapshot,
  fetchDetailedSystemHealth,
  fetchSystemUsers,
  fetchUserAccessAudit,
  fetchInventoryTasks,
  fetchTaskAssignees,
  fetchSuppliers,
  fetchReorderDrafts,
  mapLowStock,
  mapTransactions,
  rejectInventoryTransaction,
  refreshReorderDrafts,
  requestInventoryRecount,
  resetSystemUserPassword,
  setInventoryAccessToken,
  transcribeAudio,
  startInventoryTask,
  completeInventoryTask,
  updateInventoryProduct,
  updateLocation,
  updateSupplier,
  updateSystemUserStatus,
  updateSystemUser,
  type ApiProduct,
  type ApiLocation,
  type ProductInput,
  type ApiInventoryTask,
  type ApiTaskAssignee,
  type ApiSupplier,
  type ApiTransaction,
  type ApiReorderDraft,
  type ApiSystemHealth,
  type ApiSystemUser,
  type ApiUserAccessAudit,
  type InventoryExtraction,
  type InventorySnapshot,
  type SpeechTranscription,
} from "./api/inventory-api";
import {
  canUseRole,
  getAuthenticatedDisplayName,
  initializeKeycloak,
  keycloak,
} from "./auth/keycloak";
import { lowStock, recentTransactions } from "./data/demo-data";

const STOCK_OUT_ACTIONS = new Set(["SHIP", "USE", "TRANSFER"]);
import {
  countOfflineInventoryUpdates,
  enqueueOfflineInventoryUpdate,
  offlineQueueChangedEvent,
  synchronizeOfflineInventoryUpdates,
} from "./offline/offline-queue";
import type { Role, VoiceState } from "./types";

function formatAction(action: InventoryExtraction["fields"]["action"]) {
  if (!action) return "";
  return action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function taskTypeLabel(type: string) {
  const labels: Record<string, string> = {
    RECOUNT: "Recount",
    CYCLE_COUNT: "Cycle count",
    RECEIVE: "Receive",
    PICK: "Pick",
    SHIP: "Ship",
    USE: "Use",
    TRANSFER: "Transfer",
    STOCK_VERIFY: "Stock verify",
    DAMAGE_INSPECTION: "Damage inspection",
    DAMAGE: "Damage",
    LOSS: "Loss",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

function formatTaskDue(dueAt?: string | null) {
  if (!dueAt) return "";
  const date = new Date(dueAt);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, now)) return `Due today · ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date)}`;
  if (sameDay(date, tomorrow)) return `Due tomorrow · ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date)}`;
  return `Due ${new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(date)}`;
}

function defaultDueDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date;
}
function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function defaultTaskDue() {
  return formatDateTimeLocal(defaultDueDate(0));
}
function dueDateOffset(days: number) {
  return formatDateTimeLocal(defaultDueDate(days));
}
function formatClock(iso?: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function priorityTone(priority: string) {
  if (priority === "URGENT" || priority === "HIGH") return "bg-[#fff1e3] text-[#c56c08]";
  if (priority === "LOW") return "bg-[#eef2f7] text-[#6c829f]";
  return "bg-[#edf4ff] text-[#155eef]";
}
function taskStatusTone(status: string) {
  if (status === "COMPLETED") return "bg-[#eaf8f1] text-[#16865b]";
  if (status === "CANCELLED") return "bg-[#eef2f7] text-[#7b8fa9]";
  if (status === "IN_PROGRESS") return "bg-[#f2efff] text-[#6349c1]";
  return "bg-[#edf4ff] text-[#155eef]";
}
function receivingTaskLabel(status: string) {
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return "Open";
}

function formatRoleLabel(role: Role) {
  if (role === "administrator") return "Administrator";
  if (role === "manager") return "Manager";
  return "Warehouse Executive";
}

const pageDescriptions: Record<Role, Record<string, string>> = {
  worker: {
    Overview: "See today’s work, stock activity and anything that needs your attention.",
    "My transactions": "See every inventory transaction included in today’s total.",
    "Cycle counts": "Review every physical count submitted today and its current status.",
    "Posted today": "See the validated inventory updates successfully posted today.",
    "Voice entry": "Record one clear inventory action and review it before stock changes.",
    "Task queue": "Complete the warehouse work assigned to you by a manager.",
    "My history": "Review your submitted, posted and pending inventory updates.",
    Settings: "Check your microphone, speaker and Warehouse Executive access.",
  },
  manager: {
    Overview: "Monitor approvals, stock accuracy, low-stock risks and daily priorities.",
    Transactions: "Review pending stock changes, then search and export the complete authorized inventory ledger.",
    Reorders: "Review auto-created reorder requests and purchase orders, then approve and send to suppliers.",
    "Task planning": "Assign clear daily warehouse work to available executives.",
    Catalog: "Maintain product units, safety stock and reorder settings.",
    Locations: "Manage warehouses, receiving areas, zones, shelves and bins used in inventory movements.",
    Suppliers: "Maintain supplier contacts, lead times and minimum-order rules.",
  },
  administrator: {
    Overview: "See user access, item availability and the health of essential services.",
    Items: "Search, track, edit and order every item from one clear workspace.",
    "User access": "Create accounts, update roles and control active user access.",
    "System health": "Check the live availability of database, identity, AI and supporting services.",
  },
};

function pageDescription(role: Role, page: string) {
  return pageDescriptions[role][page] ?? pageDescriptions[role].Overview;
}

/**
 * Maps legacy manager page names to the consolidated tabbed pages so any
 * bookmarked / linked in-app navigation still resolves sensibly.
 */
function resolveManagerPage(page: string) {
  if (page === "Approvals" || page === "Audit history") return "Transactions";
  if (page === "Products & rules" || page === "Opening stock" || page === "Audit controls") {
    return "Catalog";
  }
  // Locations is now its own page, so it resolves to itself
  return page;
}

function formatClarificationValue(
  field: string,
  result: InventoryExtraction,
) {
  if (field === "action") return formatAction(result.fields.action);
  if (field === "product" && result.fields.product) {
    return `${result.fields.product.name} (${result.fields.product.sku})`;
  }
  if (field === "quantity" && result.fields.quantity !== null) {
    const unit = result.fields.product?.unit ?? "unit";
    return `${result.fields.quantity} ${unit}${result.fields.quantity === 1 ? "" : "s"}`;
  }
  if (field === "sourceLocation") {
    return result.fields.sourceLocation?.name ?? "";
  }
  if (field === "destinationLocation") {
    return result.fields.destinationLocation?.name ?? "";
  }
  return "";
}

function clarificationRetryHelp(field: string) {
  if (field === "action") {
    return "Please say Receive, Ship, Use, Transfer, Cycle count, Damage, or Loss.";
  }
  if (field === "product") return "Please say the item name or SKU clearly.";
  if (field === "quantity") return "Please say only the number of units.";
  return "Please say the warehouse location clearly.";
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-white shadow-[0_10px_30px_rgba(21,94,239,0.28)]">
        <Warehouse size={23} strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-[15px] font-extrabold tracking-[-0.02em] text-[#102a56]">Inventory Management</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7690b5]">Voice intelligence</p>
      </div>
    </div>
  );
}

function roleLabel(role: Role) {
  return role === "worker"
    ? "Warehouse Executive"
    : role === "manager"
      ? "Inventory Manager"
      : "System Administrator";
}

function currentPageIcon(role: Role, page: string) {
  const pageIcons: Record<string, typeof LayoutDashboard> =
    role === "worker"
      ? {
          Overview: LayoutDashboard,
          "Voice entry": Mic,
          "Task queue": ClipboardCheck,
          "Active items": Boxes,
          "My history": FileClock,
          Settings,
        }
      : role === "manager"
        ? {
            Overview: LayoutDashboard,
            Transactions: ArrowRightLeft,
            Reorders: Truck,
            "Task planning": ClipboardCheck,
            Catalog: PackageCheck,
            Locations: Warehouse,
            Suppliers: Truck,
          }
        : {
            Overview: LayoutDashboard,
            Items: Boxes,
            "User access": UsersRound,
            "System health": Activity,
          };
  return pageIcons[page] ?? LayoutDashboard;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
  onClick,
  selected = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Boxes;
  tone?: "blue" | "green" | "amber" | "violet";
  onClick?: () => void;
  selected?: boolean;
}) {
  const tones = {
    blue: "bg-[#edf4ff] text-[#155eef]",
    green: "bg-[#eaf8f1] text-[#16865b]",
    amber: "bg-[#fff5df] text-[#d47b08]",
    violet: "bg-[#f2efff] text-[#7257d6]",
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#657a99]">{label}</p>
          <p className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#112c57]">{value}</p>
          <p className="mt-1.5 text-xs font-medium text-[#8b9db7]">{detail}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>
      {onClick && <span className="mt-5 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]">View details →</span>}
    </>
  );

  const cardClass = `metric-card w-full rounded-[22px] border bg-white/95 p-6 text-left shadow-[0_10px_32px_rgba(19,50,92,0.055)] backdrop-blur ${selected ? "border-[#78a5ee] ring-4 ring-[#dce9ff]" : "border-[#e3eaf5]"}`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cardClass}>{content}</button>
  ) : (
    <article className={cardClass}>{content}</article>
  );
}

function AuthenticationRoleSelector({
  role,
  setRole,
}: {
  role: Role;
  setRole: (role: Role) => void;
}) {
  return (
    <div className="role-selector grid gap-3 sm:grid-cols-3" aria-label="Select account role">
      <button
        type="button"
        onClick={() => setRole("worker")}
        aria-pressed={role === "worker"}
        className={`role-card rounded-2xl border p-4 text-left transition ${
          role === "worker"
            ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]"
            : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <Warehouse size={18} />
          Warehouse Executive
        </span>
        <span className="mt-1 block text-[11px] font-semibold leading-4 opacity-80">Count and move stock</span>
      </button>
      <button
        type="button"
        onClick={() => setRole("administrator")}
        aria-pressed={role === "administrator"}
        className={`role-card rounded-2xl border p-4 text-left transition ${
          role === "administrator"
            ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]"
            : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <Settings size={18} />
          Administrator
        </span>
        <span className="mt-1 block text-[11px] font-semibold opacity-75">Configure access and system controls</span>
      </button>
      <button
        type="button"
        onClick={() => setRole("manager")}
        aria-pressed={role === "manager"}
        className={`role-card rounded-2xl border p-4 text-left transition ${
          role === "manager"
            ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]"
            : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <ShieldCheck size={18} />
          Manager
        </span>
        <span className="mt-1 block text-[11px] font-semibold leading-4 opacity-80">Review and approve</span>
      </button>
    </div>
  );
}

function Login({
  role,
  setRole,
  onLogin,
  authError,
  isLoading,
}: {
  role: Role;
  setRole: (role: Role) => void;
  onLogin: (employeeId: string) => void;
  authError: string;
  isLoading: boolean;
}) {
  return (
    <main className="login-stage min-h-screen px-5 py-8 text-[#17345f] md:grid md:place-items-center">
      <div className="login-shell mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1120px] overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_30px_80px_rgba(15,45,85,0.14)] md:min-h-[680px] md:grid-cols-[1.05fr_0.95fr]">
        <section className="login-visual relative hidden overflow-hidden bg-[#0d3264] p-12 text-white md:flex md:flex-col md:justify-between">
          <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full border-[55px] border-white/5" />
          <div className="absolute -bottom-32 -left-28 h-96 w-96 rounded-full bg-[#155eef]/25 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#155eef]">
              <Warehouse size={23} />
            </div>
            <span className="text-lg font-extrabold">Inventory Management</span>
          </div>
          <div className="relative max-w-[470px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#bdd3ff]">
              <Sparkles size={14} />
              AI-enabled warehouse operations
            </div>
            <h1 className="text-[42px] font-extrabold leading-[1.08] tracking-[-0.045em]">
              Inventory updates,
              <br />
              spoken naturally.
            </h1>
            <p className="mt-5 max-w-[430px] text-base leading-7 text-[#c6d6ec]">
              Give warehouse teams a faster way to receive, move, count and report stock—with confirmation and complete accountability.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {[
              ["Speak", "Natural voice entry"],
              ["Confirm", "Executive-controlled"],
              ["Audit", "Every action recorded"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <p className="text-sm font-extrabold">{title}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#adc3e0]">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-7 sm:p-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 md:hidden">
              <Brand />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#155eef]">Secure access</p>
            <h2 className="mt-3 text-[32px] font-extrabold tracking-[-0.04em] text-[#102a56]">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-[#7489a7]">Select your role, then sign in to open the correct workspace.</p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                onLogin(String(formData.get("employeeId") ?? ""));
              }}
            >
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-[#29466f]">Continue as</legend>
                <AuthenticationRoleSelector role={role} setRole={setRole} />
              </fieldset>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#29466f]">Employee ID</span>
                <div className="flex items-center gap-3 rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 focus-within:border-[#6f9cff] focus-within:ring-4 focus-within:ring-[#e7efff]">
                  <UserRound size={18} className="text-[#7890b0]" />
                  <input
                    aria-label="Employee ID"
                    name="employeeId"
                    placeholder="worker1, manager1 or admin1"
                    className="h-12 w-full bg-transparent text-sm font-semibold text-[#17345f] outline-none"
                  />
                </div>
              </label>
              {authError && (
                <div className="rounded-xl border border-[#ffd1d1] bg-[#fff2f2] px-4 py-3 text-sm font-semibold text-[#a73737]">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(21,94,239,0.26)] transition hover:bg-[#0f4fd4] disabled:cursor-wait disabled:opacity-65"
              >
                {isLoading
                  ? "Checking secure access…"
                  : `Continue as ${formatRoleLabel(role)}`}
                <ChevronDown size={17} className="-rotate-90" />
              </button>
            </form>
            <div className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#f4f8fd] px-4 py-3 text-center text-xs font-semibold text-[#6c82a2]">
              <ShieldCheck size={16} className="text-[#16865b]" />
              Your password is entered securely in Keycloak and is never stored by this application.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({
  role,
  displayName,
  activePage,
  onNavigate,
  mobileOpen,
  close,
  pendingApprovals = 0,
}: {
  role: Role;
  displayName: string;
  activePage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  close: () => void;
  pendingApprovals?: number;
}) {
  const workerItems = [
    [LayoutDashboard, "Overview"],
    [Mic, "Voice entry"],
    [ClipboardCheck, "Task queue"],
    [Boxes, "Active items"],
    [FileClock, "My history"],
    [Settings, "Settings"],
  ] as const;
  const managerItems = [
    [LayoutDashboard, "Overview"],
    [ArrowRightLeft, "Transactions"],
    [Truck, "Reorders"],
    [ClipboardCheck, "Task planning"],
    [PackageCheck, "Catalog"],
    [Warehouse, "Locations"],
    [Truck, "Suppliers"],
  ] as const;
  const managerBadges: Record<string, number> = {
    Transactions: pendingApprovals,
  };
  const administratorItems = [
    [LayoutDashboard, "Overview"],
    [Boxes, "Items"],
    [UsersRound, "User access"],
    [Activity, "System health"],
  ] as const;
  const navGroups =
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
              <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9aabc1]">
                {group.heading}
              </p>
              {group.items.map(([Icon, label]) => {
                const badge = group.heading === "Management" ? managerBadges[label] ?? 0 : 0;
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
                        activePage === label
                          ? "bg-white/25 text-white"
                          : "bg-[#fff4df] text-[#b36d0c]"
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
              <p className="text-[10px] font-semibold text-[#8295af]">
                {roleLabel(role)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function WorkerToolDock({ activePage, onNavigate }: { activePage: string; onNavigate: (page: string) => void }) {
  const tools = [
    [LayoutDashboard, "Overview", "Home"],
    [ClipboardCheck, "Task queue", "Tasks"],
    [Boxes, "Active items", "Items"],
    [FileClock, "My history", "History"],
    [Settings, "Settings", "Settings"],
  ] as const;

  return (
    <nav aria-label="Warehouse Executive tools" className="worker-tool-dock fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 lg:hidden">
      {tools.map(([Icon, target, label]) => {
        const active = activePage === target || (target === "Overview" && ["My transactions", "Cycle counts", "Posted today"].includes(activePage));
        return (
          <button
            key={target}
            type="button"
            onClick={() => { onNavigate(target); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            aria-current={active ? "page" : undefined}
            className={`worker-tool-button ${active ? "is-active" : ""}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function WorkerDashboard({ page, onNavigate }: { page: string; onNavigate: (page: string) => void }) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<ApiInventoryTask[]>([]);
  const [taskActionId, setTaskActionId] = useState<string | null>(null);
  const [cancellingTransactionId, setCancellingTransactionId] =
    useState<string | null>(null);
  const [activeVoiceTask, setActiveVoiceTask] = useState<{
    id: string;
    title: string;
    type: string;
    description?: string | null;
    product?: ApiProduct | null;
    location?: ApiLocation | null;
    source: "ASSIGNED" | "RECOUNT";
  } | null>(null);
  const [newTaskAlert, setNewTaskAlert] = useState("");
  const [microphoneStatus, setMicrophoneStatus] = useState("Not checked");
  const [speakerStatus, setSpeakerStatus] = useState("");
  const [lastTaskRefresh, setLastTaskRefresh] = useState<Date | null>(null);
  const [clockNow, setClockNow] = useState(() => new Date());
  const [historyRange, setHistoryRange] = useState<"WEEK" | "ALL">("WEEK");
  const [historyView, setHistoryView] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [selectedWorkflow, setSelectedWorkflow] = useState<"RECEIVE" | "SHIP_USE" | "TRANSFER" | "CYCLE_COUNT" | null>(null);
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveTranscriptSupported, setLiveTranscriptSupported] =
    useState(false);
  const [transcription, setTranscription] =
    useState<SpeechTranscription | null>(null);
  const [extraction, setExtraction] =
    useState<InventoryExtraction | null>(null);
  const [clarificationState, setClarificationState] = useState<
    "idle" | "recording" | "transcribing" | "processing"
  >("idle");
  const [clarificationHistory, setClarificationHistory] = useState<
    Array<{
      question: string;
      rawAnswer: string;
      interpretedAnswer: string;
    }>
  >([]);
  const [submissionState, setSubmissionState] = useState<
    "idle" | "creating" | "confirming" | "complete"
  >("idle");
  const [submittedTransaction, setSubmittedTransaction] =
    useState<ApiTransaction | null>(null);
  const [confirmationOutcome, setConfirmationOutcome] = useState<
    "POSTED" | "PENDING_REVIEW" | null
  >(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveRecognitionRef = useRef<SpeechRecognition | null>(null);
  const liveRecognitionActiveRef = useRef(false);
  const liveFinalRef = useRef("");
  const clientRequestIdRef = useRef<string | null>(null);
  const activeClarificationQuestion =
    extraction?.clarificationQuestions[0] ?? "";

  useEffect(() => {
    let active = true;
    let knownTaskIds = new Set<string>();

    Promise.all([fetchInventorySnapshot(), fetchInventoryTasks()])
      .then(([inventory, tasks]) => {
        if (!active) return;
        knownTaskIds = new Set(tasks.map((task) => task.id));
        setSnapshot(inventory);
        setAssignedTasks(tasks);
        setLastTaskRefresh(new Date());
      })
      .catch(() => setSnapshot(null));

    const refreshTasks = async () => {
      if (!active || document.visibilityState === "hidden") return;
      try {
        const [tasks, inventory] = await Promise.all([
          fetchInventoryTasks(),
          fetchInventorySnapshot(),
        ]);
        if (!active) return;
        const newTasks = tasks.filter(
          (task) => task.status === "OPEN" && !knownTaskIds.has(task.id),
        );
        if (newTasks.length === 1) {
          setNewTaskAlert(`New task assigned: ${newTasks[0].title}`);
        } else if (newTasks.length > 1) {
          setNewTaskAlert(`${newTasks.length} new tasks were assigned to you.`);
        }
        knownTaskIds = new Set(tasks.map((task) => task.id));
        setAssignedTasks(tasks);
        setSnapshot(inventory);
        setLastTaskRefresh(new Date());
      } catch {
        // Keep the last valid queue visible while the next automatic refresh retries.
      }
    };

    const refreshTimer = window.setInterval(() => void refreshTasks(), 5_000);
    const refreshOnFocus = () => void refreshTasks();
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshOnFocus);
      stopLiveTranscription();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const workerName = getAuthenticatedDisplayName() || "Warehouse Executive";
  const workerGreeting = (() => {
    const hour = clockNow.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const voiceCopy = useMemo(() => {
    if (voiceState === "recording") return { title: "Listening…", detail: "Simply say what you did, the number, the item name and the shelf." };
    if (voiceState === "transcribing") return { title: "Creating transcript…", detail: "Whisper is processing the recording locally." };
    if (voiceState === "review") return { title: "Transcript ready", detail: "Review or correct the spoken text before continuing." };
    if (voiceState === "extracting") return { title: "Understanding your update…", detail: "AI is checking the item name and shelf name." };
    if (voiceState === "extracted") return { title: "Inventory details ready", detail: "Review the AI suggestion before any transaction is created." };
    if (
      activeVoiceTask &&
      ["RECEIVE", "CYCLE_COUNT", "STOCK_VERIFY", "RECOUNT"].includes(
        activeVoiceTask.type,
      )
    ) {
      return {
        title: "Ready — say only the actual number",
        detail:
          "The task already provides the action, item and location. You do not need to repeat them.",
      };
    }
    const examples = {
      RECEIVE: 'Say: “I received 50 Blue Widgets and put them at Shelf B” or “I received 50 Blue Widgets and added them to Shelf B.”',
      SHIP_USE: 'Say: “I shipped 5 Blue Widgets from Shelf B.”',
      TRANSFER: 'Say: “I moved 10 Blue Widgets from Shelf B to Shelf C.”',
      CYCLE_COUNT: 'Say: “I counted 50 Blue Widgets on Shelf B.”',
    };
    return { title: selectedWorkflow ? "Ready — speak one short sentence" : "Ready for a voice update", detail: selectedWorkflow ? examples[selectedWorkflow] : 'Try: “I received 50 Blue Widgets and put them at Shelf B.”' };
  }, [voiceState, selectedWorkflow, activeVoiceTask]);

  function chooseWorkflow(workflow: "RECEIVE" | "SHIP_USE" | "TRANSFER" | "CYCLE_COUNT") {
    resetVoice();
    setSelectedWorkflow(workflow);
    setMessage("Ready. Tap the microphone and say one short sentence using the sample above.");
    document.getElementById("voice-entry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startLiveTranscription() {
    stopLiveTranscription();
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setLiveTranscriptSupported(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    liveFinalRef.current = "";
    recognition.onresult = (event) => {
      // Final text is accumulated in a ref because the browser restarts the
      // recognizer after pauses, and each session starts with fresh results.
      let interimText = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const spoken = result[0]?.transcript ?? "";
        if (result.isFinal) {
          liveFinalRef.current = `${liveFinalRef.current} ${spoken}`.trim();
        } else {
          interimText += spoken;
        }
      }
      setLiveTranscript(
        `${liveFinalRef.current}${interimText ? ` ${interimText}` : ""}`.trim(),
      );
    };
    recognition.onerror = (event) => {
      // Permanent failures end the live preview; transient ones are retried
      // automatically when the recognizer ends. The final Whisper transcript
      // always remains the authoritative source of truth.
      if (
        [
          "not-allowed",
          "service-not-allowed",
          "language-not-supported",
          "network",
        ].includes(event.error)
      ) {
        liveRecognitionActiveRef.current = false;
        setLiveTranscriptSupported(false);
      }
    };
    recognition.onend = () => {
      if (!liveRecognitionActiveRef.current) return;
      try {
        recognition.start();
      } catch {
        liveRecognitionActiveRef.current = false;
        setLiveTranscriptSupported(false);
      }
    };
    liveRecognitionRef.current = recognition;
    liveRecognitionActiveRef.current = true;
    setLiveTranscriptSupported(true);
    try {
      recognition.start();
    } catch {
      liveRecognitionActiveRef.current = false;
      setLiveTranscriptSupported(false);
    }
  }

  function stopLiveTranscription() {
    liveRecognitionActiveRef.current = false;
    const recognition = liveRecognitionRef.current;
    liveRecognitionRef.current = null;
    if (!recognition) return;
    try {
      recognition.onend = null;
      recognition.stop();
    } catch {
      // The recognizer may already be stopped.
    }
  }

  async function startRecording() {
    setMessage("");
    setTranscript("");
    setLiveTranscript("");
    setLiveTranscriptSupported(false);
    setTranscription(null);
    setExtraction(null);
    setClarificationState("idle");
    setClarificationHistory([]);
    setSubmissionState("idle");
    setSubmittedTransaction(null);
    setConfirmationOutcome(null);
    clientRequestIdRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage("This browser does not support microphone recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => void processRecording(recorder.mimeType);
      recorder.start(250);
      setVoiceState("recording");
      setLiveTranscript("");
      startLiveTranscription();
    } catch {
      setMessage(
        "Microphone access was not available. Check the browser permission and try again.",
      );
    }
  }

  function stopRecording() {
    stopLiveTranscription();
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setVoiceState("transcribing");
    }
  }

  async function processRecording(mimeType: string) {
    const recording = new Blob(chunksRef.current, {
      type: mimeType || "audio/webm",
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setLiveTranscript("");

    try {
      const result = await transcribeAudio(recording);
      setTranscription(result);
      setTranscript(result.text);
      if (!result.text) {
        setVoiceState("review");
        setMessage("No clear speech was detected. Record again in a quieter area.");
        return;
      }
      await runExtraction(result.text.trim(), result.evidenceId);
    } catch {
      setVoiceState("idle");
      setMessage(
        "Transcription was not available. Check the speech service and try again.",
      );
    }
  }

  function resetVoice() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    stopLiveTranscription();
    setLiveTranscript("");
    setLiveTranscriptSupported(false);
    setVoiceState("idle");
    setTranscript("");
    setTranscription(null);
    setExtraction(null);
    setClarificationState("idle");
    setClarificationHistory([]);
    setSubmissionState("idle");
    setSubmittedTransaction(null);
    setConfirmationOutcome(null);
    clientRequestIdRef.current = null;
    setMessage("");
    window.speechSynthesis?.cancel();
  }

  function speakClarificationQuestion(
    question = activeClarificationQuestion,
  ) {
    if (!question || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function applyActiveTaskContext(result: InventoryExtraction) {
    if (!activeVoiceTask) return result;

    const taskAction: NonNullable<InventoryExtraction["fields"]["action"]> =
      activeVoiceTask.type === "RECEIVE"
        ? "RECEIVE"
        : ["PICK", "SHIP"].includes(activeVoiceTask.type)
          ? "SHIP"
          : activeVoiceTask.type === "USE"
            ? "USE"
            : activeVoiceTask.type === "TRANSFER"
              ? "TRANSFER"
              : ["DAMAGE", "DAMAGE_INSPECTION"].includes(activeVoiceTask.type)
                ? "DAMAGE"
                : activeVoiceTask.type === "LOSS"
                  ? "LOSS"
                  : "CYCLE_COUNT";
    const product = activeVoiceTask.product ?? result.fields.product;
    const sourceLocation =
      taskAction === "RECEIVE"
        ? result.fields.sourceLocation
        : activeVoiceTask.location ?? result.fields.sourceLocation;
    const destinationLocation =
      taskAction === "RECEIVE"
        ? activeVoiceTask.location ?? result.fields.destinationLocation
        : result.fields.destinationLocation;
    const trustedFields = new Set<string>(["action"]);
    if (activeVoiceTask.product) trustedFields.add("product");
    if (activeVoiceTask.location) {
      trustedFields.add(taskAction === "RECEIVE" ? "destinationLocation" : "sourceLocation");
    }

    const missingFields: string[] = [];
    if (!product) missingFields.push("product");
    if (result.fields.quantity === null) missingFields.push("quantity");
    if (taskAction === "RECEIVE") {
      if (!destinationLocation) missingFields.push("destinationLocation");
    } else if (taskAction === "TRANSFER") {
      if (!sourceLocation) missingFields.push("sourceLocation");
      if (!destinationLocation) missingFields.push("destinationLocation");
    } else if (!sourceLocation) {
      missingFields.push("sourceLocation");
    }

    const lowConfidenceFields = result.lowConfidenceFields.filter(
      (field) => !trustedFields.has(field) && !missingFields.includes(field),
    );
    const fieldsNeedingClarification = [
      ...new Set([...missingFields, ...lowConfidenceFields]),
    ];
    const questions: Record<string, string> = {
      action: "What inventory action did you perform?",
      product: "Which item does this update apply to?",
      quantity: "What quantity should be recorded?",
      sourceLocation: "Which location did the stock come from?",
      destinationLocation: "Which location should receive the stock?",
    };
    const fieldConfidence = {
      ...result.fieldConfidence,
      action: 1,
      product: activeVoiceTask.product ? 1 : result.fieldConfidence.product,
      sourceLocation:
        activeVoiceTask.location && taskAction !== "RECEIVE"
          ? 1
          : result.fieldConfidence.sourceLocation,
      destinationLocation:
        activeVoiceTask.location && taskAction === "RECEIVE"
          ? 1
          : result.fieldConfidence.destinationLocation,
    };
    const requiredConfidence = [
      fieldConfidence.action,
      fieldConfidence.product,
      fieldConfidence.quantity,
      ...(taskAction === "TRANSFER"
        ? [fieldConfidence.sourceLocation, fieldConfidence.destinationLocation]
        : taskAction === "RECEIVE"
          ? [fieldConfidence.destinationLocation]
          : [fieldConfidence.sourceLocation]),
    ];

    return {
      ...result,
      readyForConfirmation: fieldsNeedingClarification.length === 0,
      requiresManagerReview: ["CYCLE_COUNT", "DAMAGE", "LOSS"].includes(taskAction),
      confidence: Number(
        (
          requiredConfidence.reduce((sum, value) => sum + value, 0) /
          requiredConfidence.length
        ).toFixed(3),
      ),
      missingFields,
      lowConfidenceFields,
      clarificationQuestions: fieldsNeedingClarification.map(
        (field) => questions[field],
      ),
      fields: {
        ...result.fields,
        action: taskAction,
        product,
        sourceLocation,
        destinationLocation,
      },
      fieldConfidence,
    };
  }

  async function runExtraction(
    reviewedTranscript: string,
    evidenceId = transcription?.evidenceId,
  ) {
    setVoiceState("extracting");
    setMessage("");
    try {
      const workflowHints = { RECEIVE: "RECEIVE", SHIP_USE: "SHIP or USE", TRANSFER: "TRANSFER", CYCLE_COUNT: "CYCLE COUNT" };
      const extractedResult = await extractInventoryDetails({
        transcript: selectedWorkflow ? `Selected workflow: ${workflowHints[selectedWorkflow]}. Worker statement: ${reviewedTranscript}` : reviewedTranscript,
        evidenceId,
      });
      const result = applyActiveTaskContext(extractedResult);
      setExtraction(result);
      setVoiceState("extracted");
      if (!result.readyForConfirmation) {
        speakClarificationQuestion(result.clarificationQuestions[0]);
      }
      setMessage(
        result.readyForConfirmation
          ? "Details are complete and ready for Warehouse Executive confirmation. No inventory stock was changed."
          : "The AI needs more information before this can be confirmed.",
      );
    } catch {
      setVoiceState("review");
      setMessage(
        "AI extraction was not available. Check Ollama and try again.",
      );
    }
  }

  async function saveTranscript() {
    if (!transcript.trim()) {
      setMessage("Enter or record a transcript before continuing.");
      return;
    }
    await runExtraction(transcript.trim());
  }

  function speakProposal() {
    if (!extraction?.readyForConfirmation) return;
    const fields = extraction.fields;
    const location =
      fields.sourceLocation?.name ?? fields.destinationLocation?.name ?? "";
    const statement = [
      `Action: ${formatAction(fields.action)}.`,
      fields.product ? `Item: ${fields.product.name}.` : "",
      fields.quantity === null
        ? ""
        : `Quantity: ${fields.quantity} ${fields.product?.unit ?? "units"}.`,
      location ? `Location: ${location}.` : "",
      `Condition: ${fields.condition.toLowerCase()}.`,
      "Please confirm this inventory update.",
    ]
      .filter(Boolean)
      .join(" ");
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(statement));
  }

  async function confirmProposal() {
    if (!extraction?.readyForConfirmation) return;
    if (insufficientStockNotice) {
      setMessage(
        `Insufficient available stock. Requested ${insufficientStockNotice.requested}; available ${insufficientStockNotice.available}. Correct the quantity before confirming.`,
      );
      return;
    }
    setMessage("");
    try {
      let transaction = submittedTransaction;
      if (!transaction) {
        setSubmissionState("creating");
        clientRequestIdRef.current ??= `voice-${crypto.randomUUID()}`;
        transaction = await createPendingInventoryTransaction(
          extraction,
          clientRequestIdRef.current,
        );
        setSubmittedTransaction(transaction);
      }
      setSubmissionState("confirming");
      const result = await confirmInventoryTransaction(transaction.id);
      setSubmittedTransaction(result.transaction);
      setConfirmationOutcome(result.outcome);
      setSubmissionState("complete");
      setSnapshot(await fetchInventorySnapshot());
      let taskCompletionMessage = "";
      if (activeVoiceTask) {
        if (activeVoiceTask.source === "ASSIGNED") {
          try {
            await completeInventoryTask(activeVoiceTask.id);
            setAssignedTasks(await fetchInventoryTasks());
            taskCompletionMessage = ` Task “${activeVoiceTask.title}” is now complete.`;
            setActiveVoiceTask(null);
          } catch {
            taskCompletionMessage = " The inventory update was saved, but the task remains in progress and can be completed after the task service reconnects.";
          }
        } else {
          taskCompletionMessage = " The requested recount was submitted and will remain visible until the manager reviews it.";
          setActiveVoiceTask(null);
        }
      }
      setMessage(`${
        result.outcome === "POSTED"
          ? "Warehouse Executive confirmation complete. The validated stock movement was posted."
          : "Warehouse Executive confirmation complete. No stock changed; this transaction is waiting for manager review."
      }${taskCompletionMessage}`);
    } catch (error) {
      const networkUnavailable =
        !navigator.onLine || error instanceof TypeError;
      if (networkUnavailable) {
        try {
          clientRequestIdRef.current ??= `voice-${crypto.randomUUID()}`;
          await enqueueOfflineInventoryUpdate({
            ownerId: keycloak.subject ?? "local-worker",
            clientRequestId: clientRequestIdRef.current,
            extraction,
          });
          setSubmissionState("complete");
          setConfirmationOutcome(null);
          setMessage(
            "Update saved safely on this device. No stock changed. It will synchronize automatically when the connection returns.",
          );
          return;
        } catch {
          setSubmissionState("idle");
          setMessage(
            "The connection is offline and this device could not save the update. Keep this page open and try again.",
          );
          return;
        }
      }
      setSubmissionState("idle");
      const reason =
        error instanceof Error && error.message
          ? error.message
          : "The transaction could not be confirmed.";
      setMessage(
        `The transaction could not be confirmed. ${reason} Review the details and try again.`,
      );
    }
  }

  async function startClarificationRecording() {
    if (!activeClarificationQuestion) return;
    setMessage("");
    window.speechSynthesis?.cancel();

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage("This browser does not support microphone recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () =>
        void processClarificationRecording(recorder.mimeType);
      recorder.start(250);
      setClarificationState("recording");
      setLiveTranscript("");
      startLiveTranscription();
    } catch {
      setMessage(
        "Microphone access was not available. Check the browser permission and try again.",
      );
    }
  }

  function stopClarificationRecording() {
    stopLiveTranscription();
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setClarificationState("transcribing");
    }
  }

  async function processClarificationRecording(mimeType: string) {
    const recording = new Blob(chunksRef.current, {
      type: mimeType || "audio/webm",
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setLiveTranscript("");
    const question = activeClarificationQuestion;

    try {
      const answer = await transcribeAudio(recording, { language: "en" });
      const spokenAnswer = answer.text.trim();
      if (!spokenAnswer) {
        setClarificationState("idle");
        setMessage("No clear answer was detected. Please answer again.");
        return;
      }

      setClarificationState("processing");
      const targetField =
        extraction?.missingFields[0] ??
        extraction?.lowConfidenceFields[0] ??
        "";
      const contextTranscript = extraction?.transcript ?? transcript;
      const refinedResult = await extractInventoryDetails({
        transcript: `${contextTranscript}\nClarification answer to "${question}": ${spokenAnswer}.`,
        evidenceId: transcription?.evidenceId,
      });
      const refined = applyActiveTaskContext(refinedResult);
      const unresolvedFields = new Set([
        ...refined.missingFields,
        ...refined.lowConfidenceFields,
      ]);
      const interpretedAnswer = formatClarificationValue(
        targetField,
        refined,
      );
      if (
        !targetField ||
        unresolvedFields.has(targetField) ||
        !interpretedAnswer
      ) {
        setClarificationState("idle");
        setMessage(
          `I heard “${spokenAnswer}”, but could not match it confidently. ${clarificationRetryHelp(targetField)}`,
        );
        speakClarificationQuestion(question);
        return;
      }

      setClarificationHistory((history) => [
        ...history,
        {
          question,
          rawAnswer: spokenAnswer,
          interpretedAnswer,
        },
      ]);
      setExtraction(refined);
      setClarificationState("idle");

      if (refined.readyForConfirmation) {
        setMessage(
          "All required details are complete and ready for Warehouse Executive confirmation. No inventory stock was changed.",
        );
      } else {
        setMessage(
          "Your answer was saved. Please answer only the next missing detail.",
        );
        speakClarificationQuestion(refined.clarificationQuestions[0]);
      }
    } catch {
      setClarificationState("idle");
      setMessage(
        "The clarification answer could not be processed. Please try again.",
      );
    }
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekFilteredTransactions = snapshot
    ? snapshot.transactions.filter(
        (transaction) =>
          historyRange === "ALL" ||
          new Date(transaction.createdAt) >= weekStart,
      )
    : [];
  const allWorkerTransactions = snapshot
    ? mapTransactions(
        weekFilteredTransactions,
        historyRange === "ALL" ? 200 : 100,
        historyRange === "ALL",
      )
    : recentTransactions;
  const pendingHistoryStatuses = ["Pending", "Recount requested"];
  const managerReviewHistoryTypes = ["Cycle count", "Damage", "Loss"];
  const displayedTransactions = allWorkerTransactions.filter((transaction) =>
    historyView === "PENDING"
      ? pendingHistoryStatuses.includes(transaction.status) &&
        managerReviewHistoryTypes.includes(transaction.type)
      : !pendingHistoryStatuses.includes(transaction.status),
  );
  const weekPostedCount = weekFilteredTransactions.filter(
    (transaction) => transaction.status === "POSTED",
  ).length;
  const weekPendingCount = weekFilteredTransactions.filter((transaction) =>
    ["PENDING", "RECOUNT_REQUESTED"].includes(transaction.status),
  ).length;
  const completedAssignedTasks = assignedTasks.filter(
    (task) => task.status === "COMPLETED",
  );
  const historySubtitle = snapshot
    ? historyRange === "WEEK"
      ? `${weekFilteredTransactions.length} update${weekFilteredTransactions.length === 1 ? "" : "s"} in the last 7 days · ${weekPostedCount} posted · ${weekPendingCount} waiting for review`
      : "Live data from the inventory database"
    : "Preview data until the inventory API is available";
  const todayKey = new Date().toDateString();
  const todayTransactions = snapshot
    ? snapshot.transactions.filter(
        (transaction) =>
          new Date(transaction.createdAt).toDateString() === todayKey,
      )
    : [];
  const transactionTasks = snapshot
    ? snapshot.transactions
        .filter((transaction) => transaction.status === "RECOUNT_REQUESTED")
        .map((transaction) => ({
          id: transaction.id,
          title:
            transaction.status === "RECOUNT_REQUESTED"
              ? `Recount ${transaction.product.name}`
              : `${formatAction(
                  transaction.action as InventoryExtraction["fields"]["action"],
                )} awaiting review`,
          detail: `${
            transaction.sourceLocation?.name ??
            transaction.destinationLocation?.name ??
            "Location not provided"
          } · ${transaction.quantity} ${transaction.product.unit}`,
          note:
            transaction.reviewNotes ??
            (transaction.status === "RECOUNT_REQUESTED"
              ? "A manager requested a new physical count."
              : "Your confirmed adjustment is waiting for a manager decision."),
          urgent: transaction.status === "RECOUNT_REQUESTED",
          type: "RECOUNT",
          dueAt: null as string | null,
        }))
    : [];
  const automaticTasks = assignedTasks.filter((task) => ["OPEN", "IN_PROGRESS"].includes(task.status)).map((task) => ({
    id: task.id, title: task.title,
    type: task.type,
    dueAt: task.dueAt ?? null,
    detail: `${task.location?.name ?? "Location not provided"}${task.product ? ` · ${task.product.name}` : ""}`,
    note: task.description ?? "Assigned inventory work.",
    urgent: task.priority === "HIGH" || task.priority === "URGENT",
    status: task.status, automatic: true,
  }));
  const workerTasks = [...automaticTasks, ...transactionTasks.filter((candidate) => !automaticTasks.some((task) => task.title === candidate.title)).map((task) => ({ ...task, status: "WAITING", automatic: false }))];
  function taskWorkflow(type: string) {
    if (type === "RECEIVE") return "RECEIVE" as const;
    if (type === "PICK") return "SHIP_USE" as const;
    if (type === "TRANSFER") return "TRANSFER" as const;
    return "CYCLE_COUNT" as const;
  }
  async function openTaskInVoice(taskId: string) {
    const task = assignedTasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    setTaskActionId(taskId);
    try {
      if (task.status === "OPEN") await startInventoryTask(taskId);
      const refreshedTasks = await fetchInventoryTasks();
      setAssignedTasks(refreshedTasks);
      const refreshedTask = refreshedTasks.find((candidate) => candidate.id === taskId) ?? task;
      setActiveVoiceTask({
        id: refreshedTask.id,
        title: refreshedTask.title,
        type: refreshedTask.type,
        description: refreshedTask.description,
        product: refreshedTask.product,
        location: refreshedTask.location,
        source: "ASSIGNED",
      });
      resetVoice();
      setSelectedWorkflow(taskWorkflow(task.type));
      setMessage(`Task loaded. Speak the actual quantity and any condition or reference required for “${task.title}”.`);
      onNavigate("Voice entry");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Task status could not be updated."); }
    finally { setTaskActionId(null); }
  }
  function openRecountInVoice(transactionId: string) {
    const transaction = snapshot?.transactions.find((candidate) => candidate.id === transactionId);
    if (!transaction) {
      setMessage("The recount details could not be loaded. Refresh the page and try again.");
      return;
    }
    resetVoice();
    setSelectedWorkflow("CYCLE_COUNT");
    setActiveVoiceTask({
      id: transaction.id,
      title: `Recount ${transaction.product.name}`,
      type: "CYCLE_COUNT",
      description: transaction.reviewNotes ?? "A manager requested a new physical count.",
      product: transaction.product,
      location: transaction.sourceLocation ?? transaction.destinationLocation,
      source: "RECOUNT",
    });
    setMessage(`Recount loaded. Speak the actual physical quantity for ${transaction.product.name}.`);
    onNavigate("Voice entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const cycleCountsToday = todayTransactions.filter(
    (transaction) => transaction.action === "CYCLE_COUNT",
  ).length;
  const postedToday = todayTransactions.filter(
    (transaction) => transaction.status === "POSTED",
  ).length;
  const cycleCountTransactions = todayTransactions.filter(
    (transaction) => transaction.action === "CYCLE_COUNT",
  );
  const postedTransactions = todayTransactions.filter(
    (transaction) => transaction.status === "POSTED",
  );
  const metricPageTransactions = page === "My transactions"
    ? todayTransactions
    : page === "Cycle counts"
      ? cycleCountTransactions
      : page === "Posted today"
        ? postedTransactions
        : [];
  const metricPageTitle = page === "My transactions"
    ? "Transactions created today"
    : page === "Cycle counts"
      ? "Cycle counts submitted today"
      : "Validated transactions posted today";
  async function handleCancelTransaction(transaction: ApiTransaction) {
    if (!window.confirm(
      `Cancel TX-${transaction.id.slice(0, 8).toUpperCase()} (${transaction.action} ${transaction.quantity} ${transaction.product.name})? No stock has changed yet, and the record will be marked as cancelled.`,
    )) return;
    setCancellingTransactionId(transaction.id);
    setMessage("");
    try {
      await cancelInventoryTransaction(transaction.id);
      setSnapshot(await fetchInventorySnapshot());
      setMessage(
        `TX-${transaction.id.slice(0, 8).toUpperCase()} was cancelled. No stock was changed.`,
      );
    } catch {
      setMessage(
        "The transaction could not be cancelled. Refresh and try again.",
      );
    } finally {
      setCancellingTransactionId(null);
    }
  }
  const insufficientStockNotice = extraction
    ? (() => {
        const { action, product, quantity, sourceLocation } = extraction.fields;
        if (!action || !product || quantity === null || !sourceLocation) return null;
        if (!STOCK_OUT_ACTIONS.has(action)) return null;
        const balance = snapshot?.balances.find(
          (candidate) =>
            candidate.product.id === product.id &&
            candidate.location.id === sourceLocation.id,
        );
        const available = balance ? Math.max(0, balance.quantity - balance.reservedQuantity) : 0;
        if (available >= quantity) return null;
        return { requested: quantity, available };
      })()
    : null;
  const extractedDetails = extraction
    ? [
        [
          "Action",
          extraction.fields.action?.replaceAll("_", " ") ?? "Not identified",
        ],
        [
          "Item name",
          extraction.fields.product
            ? `${extraction.fields.product.name} (${extraction.fields.product.sku})`
            : "Not identified",
        ],
        [
          "Number",
          extraction.fields.quantity === null
            ? "Not identified"
            : `${extraction.fields.quantity} ${extraction.fields.product?.unit ?? "units"}`,
        ],
        [
          "From shelf",
          extraction.fields.sourceLocation?.name ?? "Not required / missing",
        ],
        [
          "To shelf",
          extraction.fields.destinationLocation?.name ??
            "Not required / missing",
        ],
        ["Item condition", extraction.fields.condition],
        [
          "Order or reference",
          extraction.fields.referenceNumber ?? "Not provided",
        ],
      ]
    : [];
  const activeTaskExample = activeVoiceTask
    ? (() => {
        const item = activeVoiceTask.product?.name ?? "the item";
        const place = activeVoiceTask.location?.name ?? "the shelf";
        if (activeVoiceTask.type === "RECEIVE") return "I received [number].";
        if (["PICK", "SHIP", "USE"].includes(activeVoiceTask.type)) return `I shipped [number] ${item} from ${place}.`;
        if (activeVoiceTask.type === "TRANSFER") return `I moved [number] ${item} from ${place} to the new shelf.`;
        if (["DAMAGE", "DAMAGE_INSPECTION"].includes(activeVoiceTask.type)) return `I found [number] damaged ${item} on ${place}.`;
        if (activeVoiceTask.type === "LOSS") return `I found [number] missing ${item} from ${place}.`;
        return "I counted [number].";
      })()
    : "";

  async function checkMicrophoneAccess() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneStatus("Microphone is not supported in this browser");
      return;
    }
    setMicrophoneStatus("Checking…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneStatus("Microphone is ready");
    } catch {
      setMicrophoneStatus("Permission is blocked — allow microphone access in the browser");
    }
  }

  function testSpeaker() {
    if (!("speechSynthesis" in window)) {
      setSpeakerStatus("Speaker test is not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Inventory Management voice guidance is working."));
    setSpeakerStatus("Test message played");
  }

  return (
    <div className="dashboard-content page-dashboard worker-dashboard" data-active-page={page}>
      <div id="worker-overview" className="space-y-6">
        <section id="worker-overview-hero" className="relative overflow-hidden rounded-[26px] border border-[#d9e6f8] bg-gradient-to-br from-[#0b2a58] via-[#12468f] to-[#2f6fe8] p-6 text-white shadow-[0_22px_55px_rgba(16,42,86,0.22)] sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#6ea5ff]/30 blur-3xl" />
          <div className="pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur">
                <Sparkles size={13} />
                {new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(clockNow)}
              </div>
              <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]">
                {workerGreeting}, {workerName}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]">
                {snapshot
                  ? workerTasks.length > 0 || postedToday > 0
                    ? `${workerTasks.length} open task${workerTasks.length === 1 ? "" : "s"} and ${postedToday} update${postedToday === 1 ? "" : "s"} posted today — pick a tool below to continue.`
                    : "Your workspace is ready — record voice updates, complete tasks and track your activity from the toolbar below."
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
          <MetricCard label="Open tasks" value={String(workerTasks.length)} detail={workerTasks.some((task) => task.urgent) ? "Recount action required" : "No urgent recounts"} icon={Clock3} tone="amber" onClick={() => { onNavigate("Task queue"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <MetricCard label="Posted today" value={String(postedToday)} detail="Validated inventory updates" icon={ShieldCheck} tone="green" onClick={() => { onNavigate("Posted today"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>

        <section id="worker-overview-command" className="rounded-[24px] border border-[#d8e5f7] bg-white p-5 shadow-[0_18px_45px_rgba(16,42,86,0.1)]">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]">Quick toolbar</p>
            <h2 className="text-lg font-extrabold text-[#102a56]">Jump to any tool in one tap</h2>
            <p className="text-xs font-semibold text-[#8294ac]">Your most-used warehouse tools, right here — no menus required.</p>
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
            ] as Array<[string, string, typeof Boxes, string, number | undefined]>).map(([page, label, ToolIcon, tone, count]) => (
              <button
                key={page}
                type="button"
                onClick={() => { onNavigate(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
      </div>

      {["My transactions", "Cycle counts", "Posted today"].includes(page) && (
        <section id="worker-metric-details" className="overflow-hidden rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]">
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
              <tbody>{metricPageTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[#eef2f7] last:border-0">
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">TX-{transaction.id.slice(0, 8).toUpperCase()}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#496482]">{formatAction(transaction.action as InventoryExtraction["fields"]["action"])}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">{transaction.product.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#29466f]">{transaction.quantity} {transaction.product.unit}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(transaction.createdAt))}</td>
                  <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${transaction.status === "POSTED" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "REJECTED" ? "bg-[#fff0f0] text-[#b83b3b]" : transaction.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`}>{transaction.status.replaceAll("_", " ")}</span></td>
                  <td className="whitespace-nowrap px-5 py-4">{"PENDING" === transaction.status || "RECOUNT_REQUESTED" === transaction.status ? (
                    <button type="button" disabled={cancellingTransactionId === transaction.id} onClick={() => void handleCancelTransaction(transaction)} className="rounded-lg border border-[#efb5b5] px-3 py-1.5 text-[11px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{cancellingTransactionId === transaction.id ? "Cancelling…" : "Cancel"}</button>
                  ) : <span className="text-[#d3dbe6]">—</span>}</td>
                </tr>
              ))}{metricPageTransactions.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm font-semibold text-[#7b8fa9]">No matching records were found for today.</td></tr>}</tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section id="voice-entry" className="scroll-mt-24 overflow-hidden rounded-[24px] border border-[#dfe8f4] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.065)]">
          <div className="border-b border-[#e8edf5] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Voice transaction</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#102a56]">{voiceCopy.title}</h2>
                <p className="mt-1 text-sm text-[#778ba8]">{voiceCopy.detail}</p>
              </div>
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${voiceState === "recording" ? "animate-pulse bg-[#ffe8e8] text-[#d94343]" : "bg-[#edf4ff] text-[#155eef]"}`}>
                {voiceState === "extracted" ? <CheckCircle2 size={23} /> : voiceState === "extracting" ? <Sparkles size={23} /> : <Mic size={23} />}
              </div>
            </div>
          </div>

          {activeVoiceTask && <div className="mx-6 mt-5 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f8fbff] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Active assigned task</p>
                <h3 className="mt-1 text-base font-extrabold text-[#17345f]">{activeVoiceTask.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#617796]">{activeVoiceTask.description ?? "Complete this task using the verified voice workflow."}</p>
              </div>
              <span className="w-fit rounded-full bg-[#155eef] px-3 py-1 text-[10px] font-extrabold text-white">In progress</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["What to do", activeVoiceTask.type.replaceAll("_", " ")],
                ["Item name", activeVoiceTask.product?.name ?? "Say the item name"],
                ["Shelf or area", activeVoiceTask.location?.name ?? "Say the shelf or area"],
                ["What number", "Say the number you counted or moved"],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-white bg-white/80 px-3 py-3"><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]">{label}</p><p className="mt-1 text-xs font-extrabold text-[#29466f]">{value}</p></div>)}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#102f60] px-4 py-3 text-white"><Mic size={18} className="mt-0.5 shrink-0 text-[#8eb8ff]" /><div><p className="text-xs font-extrabold">Item and location are already filled from this task</p><p className="mt-1 text-sm font-extrabold leading-6 text-white">“{activeTaskExample}”</p><p className="mt-1 text-[11px] leading-5 text-[#c5d7ee]">Replace [number] with the real number. For Receive and Cycle Count, you do not need to repeat the item or location.</p></div></div>
          </div>}

          <div className="p-6">
            {voiceState === "idle" && (
              <div className="grid place-items-center rounded-[22px] border border-dashed border-[#b9c9df] bg-[#f8fbff] px-5 py-10 text-center">
                <button
                  type="button"
                  onClick={() => void startRecording()}
                  className="grid h-20 w-20 place-items-center rounded-full bg-[#155eef] text-white shadow-[0_16px_34px_rgba(21,94,239,0.28)] transition hover:scale-105"
                  aria-label="Start microphone recording"
                >
                  <Mic size={30} />
                </button>
                <p className="mt-5 text-sm font-extrabold text-[#24466f]">Tap to start speaking</p>
                <p className="mt-1 text-xs text-[#8194ae]">Your browser will request microphone permission.</p>
                {message && (
                  <div className="mt-4 rounded-xl bg-[#fff5df] px-4 py-3 text-sm font-semibold text-[#916018]">
                    {message}
                  </div>
                )}
              </div>
            )}

            {voiceState === "recording" && (
              <div className="grid min-h-[225px] place-items-center rounded-[22px] bg-[#fff7f7] p-5 text-center">
                <div className="w-full max-w-lg">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center gap-1 rounded-full bg-[#d94343] text-white shadow-[0_15px_35px_rgba(217,67,67,0.24)]">
                    {[14, 28, 40, 24, 16].map((height, index) => (
                      <span key={index} className="w-1 animate-pulse rounded-full bg-white" style={{ height }} />
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-extrabold text-[#7d2c2c]">Recording from your microphone…</p>
                  <p className="mt-1 text-xs text-[#a45a5a]">Speak clearly, then stop the recording.</p>
                  {(liveTranscriptSupported || liveTranscript) && (
                    <div className="mt-5 rounded-2xl border border-[#f3c6c6] bg-white p-4 text-left shadow-[0_8px_22px_rgba(201,63,63,0.08)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#a45a5a]">Live transcript</p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d94343] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          Live
                        </span>
                      </div>
                      <p className="mt-2 min-h-[3.5rem] text-sm font-semibold leading-6 text-[#5b2b2b]">
                        {liveTranscript || "Listening for speech…"}
                        {liveTranscript && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse rounded-full bg-[#d94343] align-middle" />}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="mt-5 rounded-xl bg-[#c93f3f] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(201,63,63,0.2)]"
                  >
                    Stop recording
                  </button>
                </div>
              </div>
            )}

            {voiceState === "transcribing" && (
              <div className="grid min-h-[225px] place-items-center rounded-[22px] bg-[#f6f9ff] text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-[#155eef] text-white shadow-[0_15px_35px_rgba(21,94,239,0.22)]">
                    <Sparkles size={28} />
                  </div>
                  <p className="mt-5 text-sm font-extrabold text-[#24466f]">Whisper is transcribing…</p>
                  <p className="mt-1 text-xs text-[#8194ae]">The first recording may take longer while the model loads.</p>
                </div>
              </div>
            )}

            {voiceState === "extracting" && (
              <div className="grid min-h-[225px] place-items-center rounded-[22px] bg-[#f7f5ff] text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-[#7257d6] text-white shadow-[0_15px_35px_rgba(114,87,214,0.22)]">
                    <Sparkles size={28} />
                  </div>
                  <p className="mt-5 text-sm font-extrabold text-[#3f3470]">Qwen is extracting inventory details…</p>
                  <p className="mt-1 text-xs text-[#8379aa]">Products and locations are checked against approved database records.</p>
                </div>
              </div>
            )}

            {(voiceState === "review" || voiceState === "extracted") && (
              <div>
                <div className="rounded-2xl border border-[#dfe7f2] bg-[#f8fafc] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8396b0]">Transcript</p>
                  {voiceState === "review" ? (
                    <textarea
                      aria-label="Editable voice transcript"
                      value={transcript}
                      onChange={(event) => setTranscript(event.target.value)}
                      rows={4}
                      className="mt-2 w-full resize-y rounded-xl border border-[#d8e2ef] bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#29466f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
                    />
                  ) : (
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#29466f]">“{transcript}”</p>
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Language", transcription?.language?.toUpperCase() ?? "—"],
                    [
                      "Language confidence",
                      transcription
                        ? `${Math.round(transcription.languageProbability * 100)}%`
                        : "—",
                    ],
                    [
                      "Audio duration",
                      transcription ? `${transcription.duration.toFixed(1)} sec` : "—",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[#e3eaf3] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9bb3]">{label}</p>
                      <p className="mt-1 text-sm font-extrabold text-[#203f69]">{value}</p>
                    </div>
                  ))}
                </div>
                {voiceState === "extracted" && extraction && (
                  <div className="mt-5">
                    <div className={`rounded-2xl border p-4 ${
                      extraction.readyForConfirmation
                        ? "border-[#bde5d4] bg-[#f1fbf6]"
                        : "border-[#f1d69a] bg-[#fff9ec]"
                    }`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                            extraction.readyForConfirmation
                              ? "text-[#16865b]"
                              : "text-[#b36d0c]"
                          }`}>
                            AI extraction
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-[#203f69]">
                            {extraction.readyForConfirmation
                              ? "Complete and ready for Warehouse Executive confirmation"
                              : "More information is required"}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#536b8b]">
                          {Math.round(extraction.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {extractedDetails.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#e3eaf3] bg-white px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9bb3]">{label}</p>
                          <p className="mt-1 text-sm font-extrabold capitalize text-[#203f69]">{value}</p>
                        </div>
                      ))}
                    </div>

                    {insufficientStockNotice && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#f3c0c0] bg-[#fff1f1] px-4 py-3 text-sm font-semibold text-[#a12f2f]">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-extrabold">Insufficient available stock</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#b04848]">
                            This update requests {insufficientStockNotice.requested} units, but only {insufficientStockNotice.available} are currently available at {extraction.fields.sourceLocation?.name ?? "the selected shelf"}. The warehouse service will not confirm the transaction until the quantity is corrected.
                          </p>
                        </div>
                      </div>
                    )}

                    {extraction.requiresManagerReview && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#fff5df] px-4 py-3 text-sm font-semibold text-[#916018]">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        This action will require manager review after Warehouse Executive confirmation.
                      </div>
                    )}

                    {extraction.clarificationQuestions.length > 0 && (
                      <div className="mt-4 rounded-xl border border-[#f1d69a] bg-[#fffaf0] px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-extrabold text-[#8b5a13]">
                              Please clarify only this detail:
                            </p>
                            <p className="mt-2 text-sm font-extrabold text-[#765522]">
                              • {activeClarificationQuestion}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakClarificationQuestion()}
                            className="flex w-fit items-center gap-2 rounded-lg border border-[#e5c77f] bg-white px-3 py-2 text-xs font-extrabold text-[#8b5a13]"
                          >
                            <Volume2 size={15} />
                            Hear question
                          </button>
                        </div>

                        {clarificationHistory.length > 0 && (
                          <div className="mt-4 space-y-2 border-t border-[#efdcae] pt-3">
                            {clarificationHistory.map((entry, index) => (
                              <div key={`${entry.question}-${index}`} className="text-xs">
                                <p className="font-semibold text-[#8d734b]">{entry.question}</p>
                                <p className="mt-1 font-semibold text-[#8d734b]">
                                  Raw speech: “{entry.rawAnswer}”
                                </p>
                                <p className="mt-0.5 font-extrabold text-[#16865b]">
                                  AI understood: {entry.interpretedAnswer}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4">
                          {clarificationState === "idle" && (
                            <button
                              type="button"
                              onClick={() => void startClarificationRecording()}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(21,94,239,0.2)] sm:w-auto"
                            >
                              <Mic size={17} />
                              Answer this question by voice
                            </button>
                          )}
                          {clarificationState === "recording" && (
                            <div>
                              <button
                                type="button"
                                onClick={stopClarificationRecording}
                                className="flex w-full animate-pulse items-center justify-center gap-2 rounded-xl bg-[#c93f3f] px-5 py-3 text-sm font-extrabold text-white sm:w-auto"
                              >
                                <Mic size={17} />
                                Stop answer recording
                              </button>
                              {(liveTranscriptSupported || liveTranscript) && (
                                <div className="mt-3 rounded-xl border border-[#f3c6c6] bg-white px-3 py-2.5 text-left">
                                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a45a5a]">Live answer</p>
                                  <p className="mt-1 text-sm font-semibold leading-6 text-[#5b2b2b]">
                                    {liveTranscript || "Listening for your answer…"}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {clarificationState === "transcribing" && (
                            <p className="flex items-center gap-2 text-sm font-extrabold text-[#765522]">
                              <Sparkles size={17} className="animate-pulse" />
                              Converting your answer to text…
                            </p>
                          )}
                          {clarificationState === "processing" && (
                            <p className="flex items-center gap-2 text-sm font-extrabold text-[#765522]">
                              <Sparkles size={17} className="animate-pulse" />
                              Adding your answer to the existing details…
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {voiceState === "review" ? (
                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetVoice}
                      className="rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b] hover:bg-[#f7f9fc]"
                    >
                      Record again
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveTranscript()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#7257d6] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(114,87,214,0.2)]"
                    >
                      <Sparkles size={17} />
                      Extract inventory details
                    </button>
                  </div>
                ) : (
                  <div className="mt-5">
                    {submissionState === "complete" && (
                      <div className={`mb-4 rounded-xl border px-4 py-3 ${
                        confirmationOutcome === "POSTED"
                          ? "border-[#bde5d4] bg-[#f1fbf6] text-[#176f4e]"
                          : "border-[#f1d69a] bg-[#fff9ec] text-[#916018]"
                      }`}>
                        <p className="text-sm font-extrabold">
                          {confirmationOutcome === "POSTED"
                            ? "Transaction posted"
                            : "Pending manager review"}
                        </p>
                        <p className="mt-1 text-xs font-semibold">
                          Reference: TX-{submittedTransaction?.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                      <button
                        type="button"
                        onClick={resetVoice}
                        className="rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b] hover:bg-[#f7f9fc]"
                      >
                        Start another update
                      </button>
                      {submissionState !== "complete" && (
                        <button
                          type="button"
                          onClick={() => {
                            setExtraction(null);
                            setClarificationState("idle");
                            setClarificationHistory([]);
                            setSubmissionState("idle");
                            setSubmittedTransaction(null);
                            setConfirmationOutcome(null);
                            clientRequestIdRef.current = null;
                            setVoiceState("review");
                            setMessage("");
                            window.speechSynthesis?.cancel();
                          }}
                          className="flex items-center justify-center gap-2 rounded-xl border border-[#b8cae2] px-5 py-3 text-sm font-extrabold text-[#24466f]"
                        >
                          <RefreshCcw size={16} />
                          Correct details
                        </button>
                      )}
                      {extraction.readyForConfirmation &&
                        submissionState !== "complete" && (
                          <>
                            <button
                              type="button"
                              onClick={speakProposal}
                              className="flex items-center justify-center gap-2 rounded-xl border border-[#8db0ea] bg-[#f5f8ff] px-5 py-3 text-sm font-extrabold text-[#155eef]"
                            >
                              <Volume2 size={16} />
                              Hear full details
                            </button>
                            <button
                              type="button"
                              onClick={() => void confirmProposal()}
                              disabled={
                                submissionState === "creating" ||
                                submissionState === "confirming"
                              }
                              className="flex items-center justify-center gap-2 rounded-xl bg-[#16865b] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(22,134,91,0.22)] disabled:cursor-wait disabled:opacity-65"
                            >
                              <CheckCircle2 size={17} />
                              {submissionState === "creating"
                                ? "Creating pending transaction…"
                                : submissionState === "confirming"
                                  ? "Confirming safely…"
                                  : "Confirm inventory update"}
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                )}
                {message && (
                  <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${voiceState === "extracted" && extraction?.readyForConfirmation ? "bg-[#eaf8f1] text-[#176f4e]" : "bg-[#fff5df] text-[#916018]"}`}>
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#e0e8f3] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7288a7]">Quick actions</p>
              <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Choose what you did</h2>
            </div>
            <Boxes size={21} className="text-[#155eef]" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              [ArrowDownToLine, "Receive stock", "New stock came in", "bg-[#eaf8f1] text-[#16865b]"],
              [PackageMinus, "Ship or use stock", "Stock went out", "bg-[#edf4ff] text-[#155eef]"],
              [ArrowRightLeft, "Move stock", "Moved to another shelf", "bg-[#f2efff] text-[#7257d6]"],
              [ClipboardCheck, "Count stock", "Counted what is on the shelf", "bg-[#fff5df] text-[#d47b08]"],
            ].map(([Icon, title, detail, tone], index) => {
              const workflow = (["RECEIVE", "SHIP_USE", "TRANSFER", "CYCLE_COUNT"] as const)[index];
              const active = selectedWorkflow === workflow;
              return (
              <button key={String(title)} type="button" aria-pressed={active} onClick={() => chooseWorkflow(workflow)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#155eef] bg-[#f4f8ff] shadow-[0_8px_22px_rgba(21,94,239,0.12)]" : "border-[#e4eaf3] hover:border-[#b9cae2]"}`}>
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                  <Icon size={18} />
                </div>
                <p className="mt-3 text-sm font-extrabold text-[#203f69]">{String(title)}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#8294ac]">{String(detail)}</p>
              </button>
            )})}
          </div>
          <div className="mt-5 rounded-2xl bg-[#0f376d] p-5 text-white">
            <div className="flex items-start gap-3">
              <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#8eb8ff]" />
              <div>
                <p className="text-sm font-extrabold">Warehouse Executive confirmation required</p>
                <p className="mt-1 text-xs leading-5 text-[#bcd0e9]">AI prepares the transaction. Inventory changes only after you confirm and business rules pass.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="worker-settings" className="rounded-[24px] border border-[#dce6f3] bg-white p-5 shadow-[0_14px_42px_rgba(16,45,82,0.055)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#e8eef6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#155eef]">Warehouse Executive settings</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">Device and access checks</h2>
            <p className="mt-1 text-sm text-[#7489a6]">Make sure voice tools are ready before starting warehouse work.</p>
          </div>
          <button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-xs font-extrabold text-[#155eef]"><ChevronDown size={15} className="rotate-90" /> Back to Home</button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-[20px] border border-[#dfe8f4] bg-[#f8fbff] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f1ff] text-[#155eef]"><Mic size={21} /></span>
            <h3 className="mt-4 font-extrabold text-[#17345f]">Microphone access</h3>
            <p className="mt-1 min-h-10 text-xs font-semibold leading-5 text-[#7186a3]">{microphoneStatus}</p>
            <button type="button" onClick={() => void checkMicrophoneAccess()} className="mt-4 h-10 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white">Check microphone</button>
          </article>
          <article className="rounded-[20px] border border-[#dfe8f4] bg-[#f8fbff] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf8f1] text-[#16865b]"><Volume2 size={21} /></span>
            <h3 className="mt-4 font-extrabold text-[#17345f]">Speaker guidance</h3>
            <p className="mt-1 min-h-10 text-xs font-semibold leading-5 text-[#7186a3]">{speakerStatus || "Test spoken clarification guidance on this device."}</p>
            <button type="button" onClick={testSpeaker} className="mt-4 h-10 rounded-xl bg-[#16865b] px-4 text-xs font-extrabold text-white">Test speaker</button>
          </article>
        </div>
        <div className="mt-5 flex flex-col gap-4 rounded-[20px] border border-[#dfe8f4] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2efff] text-[#7257d6]"><ShieldCheck size={21} /></span><div><p className="font-extrabold text-[#17345f]">Secure role access</p><p className="mt-1 text-xs font-semibold text-[#7186a3]">Warehouse Executive · Central Warehouse · Role permissions active</p></div></div>
          <button type="button" onClick={() => { onNavigate("Voice entry"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="h-10 rounded-xl border border-[#b9cff0] bg-[#edf4ff] px-4 text-xs font-extrabold text-[#155eef]">Open Voice Entry</button>
        </div>
      </section>

      {newTaskAlert && <div role="status" aria-live="polite" className="mt-6 flex items-start justify-between gap-4 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f7faff] p-4 shadow-[0_12px_30px_rgba(21,94,239,0.09)]"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#155eef] text-white"><BellRing size={19} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#155eef]">New assignment</p><p className="mt-1 text-sm font-extrabold text-[#17345f]">{newTaskAlert}</p><p className="mt-1 text-xs font-semibold text-[#7186a3]">Open the task queue below to review and start the work.</p></div></div><button type="button" onClick={() => setNewTaskAlert("")} aria-label="Dismiss new task alert" className="rounded-lg p-2 text-[#6f84a3] transition hover:bg-white"><X size={17} /></button></div>}

      <section id="worker-task-queue" className="mt-6 scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]">
        <div className="flex flex-col gap-3 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7257d6]">My assigned work</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Task queue</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Only assigned work and manager-requested recounts that you still need to perform.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />Live updates{lastTaskRefresh ? ` · ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(lastTaskRefresh)}` : ""}</span><span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]">{workerTasks.length} open · {completedAssignedTasks.length} done</span><button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]"><ChevronDown size={15} className="rotate-90" /> Back to Overview</button></div>
        </div>
        {workerTasks.length === 0 ? (
          <div className="flex items-start gap-3 px-6 py-6">
            <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-[#16865b]" />
            <div>
              <p className="text-sm font-extrabold text-[#24466f]">No open Warehouse Executive tasks</p>
              <p className="mt-1 text-xs leading-5 text-[#8294ac]">New recount requests and pending adjustments will appear here automatically.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#edf1f6]">
            {workerTasks.map((task) => (
              <div key={task.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${task.urgent ? "bg-[#fff1e3] text-[#c56c08]" : "bg-[#edf4ff] text-[#155eef]"}`}>
                    {task.urgent ? <RefreshCcw size={18} /> : <Clock3 size={18} />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-[#24466f]">{task.title}</p>
                      <span className="rounded-full bg-[#f2efff] px-2.5 py-1 text-[10px] font-extrabold text-[#6349c1]">{taskTypeLabel(task.type)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${task.urgent ? "bg-[#fff1e3] text-[#a45d0b]" : "bg-[#edf4ff] text-[#155eef]"}`}>
                        {task.status === "IN_PROGRESS" ? "In progress" : task.urgent ? "Action required" : "Waiting for manager"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#6f84a1]">{task.detail}</p>
                    {task.dueAt && <p className="mt-1 text-xs font-extrabold text-[#d47b08]">{formatTaskDue(task.dueAt)}</p>}
                    <p className="mt-1 text-xs text-[#8a9bb1]">{task.note}</p>
                  </div>
                </div>
                {task.automatic ? (task.status === "OPEN" ? <button disabled={taskActionId === task.id} type="button" onClick={() => void openTaskInVoice(task.id)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"><Mic size={15} /> Start with voice</button> : <button disabled={taskActionId === task.id} type="button" onClick={() => void openTaskInVoice(task.id)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#16865b] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"><Mic size={15} /> Complete with voice</button>) : task.urgent ? <button type="button" onClick={() => openRecountInVoice(task.id)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white"><Mic size={15} /> Start recount with voice</button> : <span className="shrink-0 rounded-xl border border-[#e3e9f2] bg-[#f7f9fc] px-4 py-2.5 text-[10px] font-extrabold text-[#7b8fa9]">Manager review pending</span>}
              </div>
            ))}
          </div>
        )}
        {completedAssignedTasks.length > 0 && (
          <div className="border-t border-[#edf1f6] bg-[#fafbfd] px-6 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8597af]">Recently completed by you</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {completedAssignedTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-center gap-2 rounded-xl border border-[#e3e9f2] bg-white px-3 py-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-[#16865b]" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-[#29466f]">{task.title}</p>
                    <p className="text-[10px] font-semibold text-[#8a9bb1]">{taskTypeLabel(task.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="worker-history" className="mt-6 scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#102a56]">{historyRange === "WEEK" ? "This week's activity" : "My complete transaction history"}</h2>
            <p className="mt-1 text-xs text-[#8294ac]">
              {historySubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-[#dce5f1] bg-[#f6f9fd] p-1" role="group" aria-label="History time range">
              <button type="button" aria-pressed={historyRange === "WEEK"} onClick={() => setHistoryRange("WEEK")} className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${historyRange === "WEEK" ? "bg-white text-[#155eef] shadow-sm" : "text-[#7186a3] hover:text-[#29466f]"}`}>Last 7 days</button>
              <button type="button" aria-pressed={historyRange === "ALL"} onClick={() => setHistoryRange("ALL")} className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${historyRange === "ALL" ? "bg-white text-[#155eef] shadow-sm" : "text-[#7186a3] hover:text-[#29466f]"}`}>All time</button>
            </div>
            <button type="button" aria-pressed={historyView === "PENDING"} onClick={() => setHistoryView("PENDING")} className={`rounded-xl px-4 py-2 text-xs font-extrabold ${historyView === "PENDING" ? "bg-[#fff1db] text-[#a46009] shadow-[0_8px_20px_rgba(164,96,9,0.12)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`}>Pending</button>
            <button type="button" aria-pressed={historyView === "COMPLETED"} onClick={() => setHistoryView("COMPLETED")} className={`rounded-xl px-4 py-2 text-xs font-extrabold ${historyView === "COMPLETED" ? "bg-[#eaf8f1] text-[#16865b] shadow-[0_8px_20px_rgba(22,134,91,0.12)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`}>Completed</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
              <tr>
                {["Transaction", "Type", "Item", "Quantity", "Time", "Status"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-6 py-3 font-extrabold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6] text-sm">
              {displayedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="whitespace-nowrap px-6 py-4 font-extrabold text-[#24466f]">{transaction.id}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#5f7594]">{transaction.type}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#29466f]">{transaction.item}</td>
                  <td className={`whitespace-nowrap px-6 py-4 font-extrabold ${transaction.quantity.startsWith("+") ? "text-[#16865b]" : "text-[#496483]"}`}>{transaction.quantity}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#7f92aa]">{transaction.time}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${transaction.status === "Posted" || transaction.status === "Approved" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "Rejected" ? "bg-[#fff0f0] text-[#b83b3b]" : "bg-[#fff5df] text-[#a8670d]"}`}>{transaction.status}</span>
                  </td>
                </tr>
              ))}
              {displayedTransactions.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No {historyView === "PENDING" ? "pending" : "completed"} activity was found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section id="worker-active-items" className="overflow-hidden rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#16865b]">Live inventory catalogue</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Active items</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Current on-hand information across every warehouse location — read-only.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />Live from PostgreSQL</span>
            <span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]">{snapshot?.products.length ?? 0} active items</span>
            <button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]"><ChevronDown size={15} className="rotate-90" /> Back to Overview</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
              <tr>
                {["SKU (primary key)", "Product", "Unit", "Locations", "Available"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-6 py-3 font-extrabold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6] text-sm">
              {(snapshot?.products ?? []).map((product) => {
                const productBalances = (snapshot?.balances ?? []).filter(
                  (balance) => balance.product.id === product.id,
                );
                const available = productBalances.reduce(
                  (total, balance) =>
                    total + Math.max(0, balance.quantity - balance.reservedQuantity),
                  0,
                );
                const locationCodes = productBalances.map(
                  (balance) => balance.location.code,
                );
                return (
                  <tr key={product.id} className="hover:bg-[#f7faff]">
                    <td className="whitespace-nowrap px-6 py-4"><span className="rounded-lg border border-[#cfe0f8] bg-[#f4f8ff] px-2.5 py-1 font-mono text-xs font-extrabold text-[#155eef]">{product.sku}</span></td>
                    <td className="whitespace-nowrap px-6 py-4 font-extrabold text-[#24466f]">{product.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#647b99]">{product.unit}</td>
                    <td className="whitespace-nowrap px-6 py-4">{locationCodes.length > 0 ? locationCodes.map((code) => <span key={code} className="mr-1.5 inline-block rounded-full bg-[#edf4ff] px-2.5 py-1 text-[10px] font-extrabold text-[#155eef]">{code}</span>) : <span className="text-[#9aabc1]">No location</span>}</td>
                    <td className={`whitespace-nowrap px-6 py-4 text-lg font-black ${available > 0 ? "text-[#16865b]" : "text-[#a46009]"}`}>{available}</td>
                  </tr>
                );
              })}
              {snapshot && snapshot.products.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No active items are in the catalogue yet.</td></tr>
              )}
              {!snapshot && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">Loading live inventory from the warehouse service…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

function ManagerDashboard({
  page,
  onNavigate,
  onPendingApprovalsChange,
}: {
  page: string;
  onNavigate: (page: string) => void;
  onPendingApprovalsChange?: (count: number) => void;
}) {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [reorderDrafts, setReorderDrafts] = useState<ApiReorderDraft[]>([]);
  const [transactionTab, setTransactionTab] = useState<"needsReview" | "history">("needsReview");

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [managerMessage, setManagerMessage] = useState("");
  const [reorderActionId, setReorderActionId] = useState<string | null>(null);
  const [reorderMessage, setReorderMessage] = useState("");
  const [auditAction, setAuditAction] = useState("ALL");
  const [auditStatus, setAuditStatus] = useState("ALL");
  const [cancellingTransactionId, setCancellingTransactionId] =
    useState<string | null>(null);
  const [managerTasks, setManagerTasks] = useState<ApiInventoryTask[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<ApiTaskAssignee[]>([]);
  const [taskMessage, setTaskMessage] = useState("");
  const [taskMessageTone, setTaskMessageTone] = useState<"info" | "error">("info");
  const [managerTaskView, setManagerTaskView] = useState<"OPEN" | "COMPLETED">("OPEN");
  const [taskDueValue, setTaskDueValue] = useState(defaultTaskDue);
  const [schedulingTasks, setSchedulingTasks] = useState(false);
  const [healthMounted, setHealthMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHealthMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Sidebar clicks open the default tab: Transactions -> Needs review.
  // InventoryApp keys this component by activePage so switching pages
  // remounts with fresh tab state.

  function navigateToTransactions(tab: "needsReview" | "history") {
    setTransactionTab(tab);
    onNavigate(resolveManagerPage("Transactions"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleReorderAction(draft: ApiReorderDraft) {
    setReorderActionId(draft.id);
    setReorderMessage("");
    try {
      await approveReorderDraft(
        draft.id,
        "Approved from the manager reorder dashboard.",
      );
      setReorderMessage(
        `Purchase-order request approved for ${draft.suggestedQuantity} ${draft.product.unit}.`,
      );
      applyReorderDrafts(await fetchReorderDrafts());
    } catch {
      setReorderMessage(
        "The reorder action could not be completed. Refresh the drafts and try again.",
      );
    } finally {
      setReorderActionId(null);
    }
  }

  function applyReorderDrafts(drafts: ApiReorderDraft[]) {
    setReorderDrafts(drafts);
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetchInventorySnapshot(), refreshReorderDrafts(), fetchInventoryTasks(), fetchTaskAssignees()])
      .then(([inventory, drafts, tasks, assignees]) => {
        if (!active) return;
        setSnapshot(inventory);
        applyReorderDrafts(drafts);
        setManagerTasks(tasks);
        setTaskAssignees(assignees);
      })
      .catch(() => {
        if (!active) return;
        setSnapshot(null);
        applyReorderDrafts([]);
      });

    const refreshLiveData = async () => {
      if (!active || document.visibilityState === "hidden") return;
      try {
        const [tasks, inventory, drafts] = await Promise.all([
          fetchInventoryTasks(),
          fetchInventorySnapshot(),
          refreshReorderDrafts(),
        ]);
        if (!active) return;
        setManagerTasks(tasks);
        setSnapshot(inventory);
        setReorderDrafts(drafts);
      } catch {
        // Keep the last visible data while the next automatic refresh retries.
      }
    };
    const timer = window.setInterval(() => void refreshLiveData(), 8_000);
    const refreshOnFocus = () => void refreshLiveData();
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") void refreshLiveData();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, []);

  const stockHealth = useMemo(() => {
    const balances = snapshot?.balances ?? [];
    let critical = 0;
    let low = 0;
    let healthy = 0;
    for (const balance of balances) {
      const available = balance.quantity - balance.reservedQuantity;
      const safety = balance.product.safetyStock;
      if (available <= Math.max(1, Math.floor(safety / 2))) critical += 1;
      else if (available < safety) low += 1;
      else healthy += 1;
    }
    const total = balances.length || 1;
    return {
      critical,
      low,
      healthy,
      total: balances.length,
      healthyPct: Math.round((healthy / total) * 100),
    };
  }, [snapshot]);
  const needsAttention = useMemo(() => {
    return mapLowStock(snapshot?.balances ?? [])
      .sort((left, right) => left.available / Math.max(1, left.threshold) - right.available / Math.max(1, right.threshold))
      .slice(0, 3)
      .map((entry) => ({
        name: entry.item,
        sku: entry.code,
        available: entry.available,
        safety: entry.threshold,
      }));
  }, [snapshot]);
  const displayedLowStock = snapshot ? mapLowStock(snapshot.balances) : lowStock;
  const openTaskCount = managerTasks.filter((task) => task.status === "OPEN" || task.status === "IN_PROGRESS").length;
  const completedTaskCount = managerTasks.filter((task) => task.status === "COMPLETED").length;
  const displayedManagerTasks = managerTasks
    .filter((task) =>
      managerTaskView === "OPEN"
        ? task.status === "OPEN" || task.status === "IN_PROGRESS"
        : task.status === "COMPLETED",
    )
    .slice(0, 12);
  const managerExecutives = useMemo(() => {
    const byAssignee = new Map<
      string,
      {
        assignee: { id: string; displayName: string };
        open: number;
        inProgress: number;
        completed: number;
        currentTask?: ApiInventoryTask;
      }
    >();
    for (const task of managerTasks) {
      if (!task.assignedTo) continue;
      let entry = byAssignee.get(task.assignedTo.id);
      if (!entry) {
        entry = {
          assignee: {
            id: task.assignedTo.id,
            displayName: task.assignedTo.displayName,
          },
          open: 0,
          inProgress: 0,
          completed: 0,
        };
        byAssignee.set(task.assignedTo.id, entry);
      }
      if (task.status === "COMPLETED") entry.completed += 1;
      else if (task.status === "IN_PROGRESS") {
        entry.inProgress += 1;
        entry.currentTask ??= task;
      } else if (task.status === "OPEN") entry.open += 1;
    }
    return [...byAssignee.values()].sort(
      (left, right) => right.inProgress + right.open - (left.inProgress + left.open),
    );
  }, [managerTasks]);
  const pendingReviewTransactions = snapshot
    ? snapshot.transactions.filter(
        (transaction) =>
          transaction.status === "PENDING" && Boolean(transaction.confirmedAt),
      )
    : [];
  const pendingApprovals = pendingReviewTransactions.length;

  useEffect(() => {
    onPendingApprovalsChange?.(pendingApprovals);
  }, [pendingApprovals, onPendingApprovalsChange]);

  const visibleReorderDrafts = reorderDrafts
    .filter(
      (draft) =>
        draft.status === "DRAFT" ||
        draft.status === "APPROVED" ||
        draft.status === "SENT",
    )
    .slice(0, 10);
  const movementReport = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - offset));
      return { key: date.toDateString(), label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date), received: 0, outgoing: 0 };
    });
    for (const transaction of snapshot?.transactions ?? []) {
      if (transaction.status !== "POSTED") continue;
      const day = days.find((entry) => entry.key === new Date(transaction.createdAt).toDateString());
      if (!day) continue;
      if (transaction.action === "RECEIVE") day.received += transaction.quantity;
      if (["SHIP", "USE"].includes(transaction.action)) day.outgoing += transaction.quantity;
    }
    const receivedTotal = days.reduce((sum, day) => sum + day.received, 0);
    const outgoingTotal = days.reduce((sum, day) => sum + day.outgoing, 0);
    const maximum = Math.max(1, ...days.flatMap((day) => [day.received, day.outgoing]));
    return { days, receivedTotal, outgoingTotal, maximum };
  }, [snapshot]);
  const auditTransactions = (snapshot?.transactions ?? []).filter((transaction) =>
    (auditAction === "ALL" || transaction.action === auditAction) &&
    (auditStatus === "ALL" || transaction.status === auditStatus),
  );

  function exportAuditHistory() {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["Transaction ID", "Date", "Action", "Product", "Quantity", "Source", "Destination", "Status", "Created by", "Approved by", "Reference", "Notes"], ...auditTransactions.map((transaction) => [transaction.id, transaction.createdAt, transaction.action, transaction.product.name, transaction.quantity, transaction.sourceLocation?.name ?? "", transaction.destinationLocation?.name ?? "", transaction.status, transaction.createdBy?.displayName ?? "", transaction.approvedBy?.displayName ?? "", transaction.referenceNumber ?? "", transaction.notes ?? ""])];
    const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `inventory-audit-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }


  async function handleCancelManagerTransaction(transaction: ApiTransaction) {
    if (!window.confirm(
      `Cancel TX-${transaction.id.slice(0, 8).toUpperCase()} (${transaction.action} ${transaction.quantity} ${transaction.product.name})? No stock has changed yet, and the record will be marked as cancelled.`,
    )) return;
    setCancellingTransactionId(transaction.id);
    setManagerMessage("");
    try {
      await cancelInventoryTransaction(transaction.id);
      setSnapshot(await fetchInventorySnapshot());
      setManagerMessage(
        `TX-${transaction.id.slice(0, 8).toUpperCase()} was cancelled. No stock was changed.`,
      );
    } catch {
      setManagerMessage(
        "The transaction could not be cancelled. Refresh and try again.",
      );
    } finally {
      setCancellingTransactionId(null);
    }
  }

  async function reviewTransaction(
    transaction: ApiTransaction,
    decision: "approve" | "reject" | "recount",
  ) {
    setReviewingId(transaction.id);
    setManagerMessage("");
    try {
      if (decision === "approve") {
        await approveInventoryTransaction(
          transaction.id,
          "Approved after manager review.",
        );
        setManagerMessage(
          "Transaction approved and the validated stock adjustment was posted.",
        );
      } else if (decision === "reject") {
        await rejectInventoryTransaction(
          transaction.id,
          "Rejected by the inventory manager.",
        );
        setManagerMessage(
          "Transaction rejected. No inventory stock was changed.",
        );
      } else {
        await requestInventoryRecount(
          transaction.id,
          "A new physical count is required.",
        );
        setManagerMessage(
          "Recount requested. No inventory stock was changed.",
        );
      }
      setSnapshot(await fetchInventorySnapshot());
    } catch {
      setManagerMessage(
        "The manager decision could not be completed. Refresh the inventory data and try again.",
      );
    } finally {
      setReviewingId(null);
    }
  }

  async function savePlannedTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaskMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await createInventoryTask({
        type: String(data.get("type")),
        priority: String(data.get("priority")),
        title: String(data.get("title")),
        description: String(data.get("description") ?? "") || undefined,
        dueAt: String(data.get("dueAt") ?? "") || undefined,
        assignedToId: String(data.get("assignedToId")),
        productId: String(data.get("productId") ?? "") || undefined,
        locationId: String(data.get("locationId") ?? "") || undefined,
      });
      setTaskMessage(
        "Task assigned successfully and added to the Warehouse Executive queue.",
      );
      setTaskMessageTone("info");
      form.reset();
      setTaskDueValue(defaultTaskDue());
      setManagerTasks(await fetchInventoryTasks());
    } catch (error) {
      setTaskMessageTone("error");
      setTaskMessage(
        error instanceof Error ? error.message : "Task could not be assigned.",
      );
    }
  }

  async function scheduleLocationCycleCounts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaskMessage("");
    setSchedulingTasks(true);
    const data = new FormData(event.currentTarget);
    const locationId = String(data.get("schedLocationId") ?? "");
    const assigneeId = String(data.get("schedAssigneeId") ?? "");
    const dueAt = String(data.get("schedDueAt") ?? "");
    const priority = String(data.get("schedPriority") ?? "MEDIUM");
    const balances =
      snapshot?.balances.filter((balance) => balance.location.id === locationId) ?? [];
    if (balances.length === 0) {
      setTaskMessageTone("error");
      setTaskMessage(
        snapshot
          ? "No products with stock were found at that location. Choose another location."
          : "Stock data could not be loaded. Refresh the page and try again.",
      );
      return;
    }
    const location = balances[0].location;
    try {
      let created = 0;
      for (const balance of balances) {
        await createInventoryTask({
          type: "CYCLE_COUNT",
          priority,
          title: `Count ${balance.product.name}`,
          description: `Scheduled cycle count for ${balance.product.name} at ${location.name} (${location.code}).`,
          dueAt: dueAt || undefined,
          assignedToId: assigneeId,
          productId: balance.product.id,
          locationId: balance.location.id,
        });
        created += 1;
      }
      setTaskMessageTone("info");
      setTaskMessage(
        `Scheduled ${created} cycle count${created === 1 ? "" : "s"} for ${location.name}. The executive queue updates within seconds.`,
      );
      setManagerTasks(await fetchInventoryTasks());
    } catch (error) {
      setTaskMessageTone("error");
      setTaskMessage(
        error instanceof Error ? error.message : "Cycle counts could not be scheduled.",
      );
    } finally {
      setSchedulingTasks(false);
    }
  }

  return (
    <div className="dashboard-content page-dashboard manager-dashboard" data-active-page={page}>
      <div id="manager-overview-metrics" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Active items"
          value={snapshot ? String(snapshot.products.length) : "1,284"}
          detail={snapshot ? "Loaded from PostgreSQL" : "Preview inventory catalogue"}
          icon={Boxes}
          onClick={() => { onNavigate("Catalog"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
        <MetricCard
          label="Pending approvals"
          value={String(pendingApprovals)}
          detail="Warehouse Executive-confirmed transactions requiring review"
          icon={ClipboardCheck}
          tone="amber"
          onClick={() => navigateToTransactions("needsReview")}
        />
        <MetricCard
          label="Low-stock items"
          value={snapshot ? String(displayedLowStock.length) : "14"}
          detail={snapshot ? "Calculated from safety levels" : "3 currently critical"}
          icon={AlertTriangle}
          tone="violet"
          onClick={() => {
            onNavigate("Reorders");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

      <section id="manager-overview-health" className="mt-6 overflow-hidden rounded-[24px] border border-[#d8e5f7] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
        <div className="flex flex-col gap-2 border-b border-[#e9eef5] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Inventory health</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Live stock overview at a glance</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Availability across every product and warehouse location, refreshed from live balances.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />Live data</span>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr_1.1fr]">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" role="img" aria-label={`${stockHealth.healthyPct}% of stock assignments are healthy`}>
                <defs>
                  <linearGradient id="healthRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#16865b" />
                    <stop offset="100%" stopColor="#2fa97c" />
                  </linearGradient>
                </defs>
                <circle cx="70" cy="70" r="56" fill="none" stroke="#e9eef6" strokeWidth="13" />
                <circle cx="70" cy="70" r="56" fill="none" stroke="url(#healthRing)" strokeWidth="13" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={healthMounted ? 2 * Math.PI * 56 * (1 - stockHealth.healthyPct / 100) : 2 * Math.PI * 56}
                  style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)" }} />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-3xl font-black tracking-[-0.04em] text-[#17345f]">{stockHealth.healthyPct}<span className="text-base text-[#8295af]">%</span></p>
                  <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8295af]">Healthy stock</p>
                </div>
              </div>
            </div>
            <p className="max-w-44 text-center text-[11px] font-semibold leading-4 text-[#8294ac]">{stockHealth.total} stock assignments across the warehouse</p>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-[#49617f]"><span>Stock status breakdown</span><span>{stockHealth.total} assignments</span></div>
              <div className="mt-2 flex h-3.5 overflow-hidden rounded-full bg-[#eef2f7]">
                <div style={{ width: `${stockHealth.total ? (stockHealth.critical / stockHealth.total) * 100 : 0}%`, transition: "width 1s ease .2s" }} className="bg-[#e05252]" />
                <div style={{ width: `${stockHealth.total ? (stockHealth.low / stockHealth.total) * 100 : 0}%`, transition: "width 1s ease .35s" }} className="bg-[#e8a23d]" />
                <div style={{ width: `${stockHealth.total ? (stockHealth.healthy / stockHealth.total) * 100 : 0}%`, transition: "width 1s ease .5s" }} className="bg-[#2aa576]" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Critical", stockHealth.critical, "bg-[#ffecec] text-[#c04343]"],
                  ["Low", stockHealth.low, "bg-[#fff4df] text-[#b36d0c]"],
                  ["Healthy", stockHealth.healthy, "bg-[#eaf8f1] text-[#16865b]"],
                ].map(([label, count, tone]) => (
                  <div key={String(label)} className={`rounded-xl px-3 py-2.5 ${tone}`}>
                    <p className="text-lg font-black leading-none">{String(count)}</p>
                    <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider">{String(label)}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] font-semibold leading-5 text-[#8294ac]">
              {stockHealth.critical > 0 ? `${stockHealth.critical} item${stockHealth.critical === 1 ? "" : "s"} are at or below half their safety level and should be prioritised for reordering.` : "No critical shortages — safety levels are holding across the warehouse."}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2e9f3] bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#a46009]">Needs attention</p>
              <button type="button" onClick={() => onNavigate("Reorders")} className="rounded-lg border border-[#e0c37e] px-2.5 py-1.5 text-[10px] font-extrabold text-[#915807] transition hover:bg-[#fff4df]">View reorders</button>
            </div>
            <div className="mt-3 space-y-3">
              {needsAttention.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#cfe0c0] bg-white px-4 py-6 text-center">
                  <CheckCircle2 size={22} className="mx-auto text-[#16865b]" />
                  <p className="mt-2 text-xs font-extrabold text-[#24466f]">All items above safety stock</p>
                  <p className="mt-1 text-[10px] text-[#8294ac]">Replenish as needed — nothing is low right now.</p>
                </div>
              )}
              {needsAttention.map((item, index) => {
                const ratio = Math.min(1, item.available / Math.max(1, item.safety));
                const critical = item.available <= Math.max(1, Math.floor(item.safety / 2));
                return (
                  <div key={item.sku} className="group rounded-xl border border-[#e4eaf3] bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#c9d8ee] hover:shadow-[0_10px_24px_rgba(16,45,82,0.08)]" style={{ animation: `dashboard-enter .5s ease ${index * 90}ms both` }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-extrabold text-[#17345f]">{item.name}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${critical ? "bg-[#ffecec] text-[#c04343]" : "bg-[#fff4df] text-[#b36d0c]"}`}>{critical ? "Critical" : "Low"}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] font-bold text-[#7b8fa9]">{item.sku} · {item.available} available / {item.safety} safety</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]">
                      <div className={`h-full rounded-full ${critical ? "bg-[#e05252]" : "bg-[#e8a23d]"}`} style={{ width: `${ratio * 100}%`, transition: "width 1s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="manager-overview-approvals" className="mt-6 overflow-hidden rounded-[24px] border border-[#e8d5a8] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
        <div className="flex flex-col gap-3 border-b border-[#f0e5cf] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#d47b08]">Action required</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Pending approvals</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Warehouse Executive-confirmed transactions waiting for your decision.</p>
          </div>
          <button type="button" onClick={() => navigateToTransactions("needsReview")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(212,123,8,0.25)] transition hover:bg-[#b86806]">Review all {pendingApprovals} <ChevronDown size={15} className="-rotate-90" /></button>
        </div>
        {pendingReviewTransactions.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 size={26} className="mx-auto text-[#16865b]" />
            <p className="mt-3 text-sm font-extrabold text-[#24466f]">No confirmed transactions need review</p>
            <p className="mt-1 text-xs text-[#8093ab]">New items requiring manager review will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf1f6]">
            {pendingReviewTransactions.slice(0, 4).map((transaction) => {
              const title = transaction.action.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
              const location = transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "Location unavailable";
              return (
                <div key={transaction.id} className="flex items-center gap-3.5 px-6 py-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff4df] text-[#d47b08]"><AlertTriangle size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#24466f]">{title} · {transaction.product.name}</p>
                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#8295af]">TX-{transaction.id.slice(0, 8).toUpperCase()} · {location}</p>
                    {transaction.reviewReasons && (
                      <p className="mt-1.5 rounded-lg bg-[#fff4df] px-2.5 py-1.5 text-xs font-semibold text-[#b36d0c]">
                        Flagged: {transaction.reviewReasons.split("\n").join(" · ")}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-extrabold text-[#29466f]">{transaction.quantity} {transaction.product.unit}</p>
                  <button type="button" onClick={() => navigateToTransactions("needsReview")} className="shrink-0 rounded-lg border border-[#c9d8ee] px-3 py-2 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#f4f8ff]">Review</button>
                </div>
              );
            })}
            {pendingReviewTransactions.length > 4 && (
              <button type="button" onClick={() => navigateToTransactions("needsReview")} className="w-full px-6 py-3 text-xs font-extrabold text-[#155eef] transition hover:bg-[#f4f8ff]">+ {pendingReviewTransactions.length - 4} more pending · open Transactions</button>
            )}
          </div>
        )}
      </section>

      <section id="manager-task-planning" className="mt-6 scroll-mt-24 rounded-[24px] border border-[#d8e5f7] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Daily work planning</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Assign and schedule Warehouse Executive tasks</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Assigned work appears in the executive&apos;s queue within seconds — cycle counts, receives, transfers and more.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />Queue syncs live</span>
        </div>

        {taskMessage && (
          <div role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${taskMessageTone === "error" ? "bg-[#fff0f0] text-[#a73737]" : "bg-[#eef6ff] text-[#244f86]"}`}>
            {taskMessage}
          </div>
        )}

        <form onSubmit={savePlannedTask} className="mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-extrabold text-[#49617f]">Task type<select name="type" required defaultValue="CYCLE_COUNT" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3">{["CYCLE_COUNT","RECEIVE","PICK","TRANSFER","STOCK_VERIFY","DAMAGE_INSPECTION"].map((value)=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Priority<select name="priority" required defaultValue="MEDIUM" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3">{["LOW","MEDIUM","HIGH","URGENT"].map((value)=><option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Assign to<select name="assignedToId" required defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="" disabled>Select executive</option>{taskAssignees.map((user)=><option key={user.id} value={user.id}>{user.displayName} — {user.employeeId}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Due date and time<input name="dueAt" type="datetime-local" value={taskDueValue} onChange={(event)=>setTaskDueValue(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
          <label className="text-xs font-extrabold text-[#49617f] md:col-span-2">Task title<input name="title" required maxLength={150} placeholder="Count Blue Widgets at Shelf B" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Product<select name="productId" defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="">Not required</option>{snapshot?.products.map((product)=><option key={product.id} value={product.id}>{product.sku} — {product.name}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Location<select name="locationId" defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="">Not required</option>{snapshot?.locations.map((location)=><option key={location.id} value={location.id}>{location.code} — {location.name}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f] md:col-span-2 xl:col-span-3">Instructions<input name="description" maxLength={500} placeholder="Clear instructions for the executive" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
          <div className="flex items-end"><button disabled={!taskAssignees.length} className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-50">Assign task</button></div>
        </form>

        <form onSubmit={scheduleLocationCycleCounts} className="mt-4 rounded-2xl border border-[#e0cbf5] bg-[#faf6ff] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7257d6]">Quick schedule</p>
              <h3 className="mt-1 text-sm font-extrabold text-[#17345f]">Schedule a full location cycle count</h3>
              <p className="mt-1 text-xs text-[#8294ac]">Creates one count task for every product with stock at the chosen location, all due at the same time.</p>
            </div>
            <span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-[10px] font-extrabold text-[#6349c1]">CYCLE_COUNT</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-extrabold text-[#49617f]">Location<select name="schedLocationId" required defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="" disabled>Select location</option>{snapshot?.locations.map((location)=><option key={location.id} value={location.id}>{location.code} — {location.name}</option>)}</select></label>
            <label className="text-xs font-extrabold text-[#49617f]">Assign to<select name="schedAssigneeId" required defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="" disabled>Select executive</option>{taskAssignees.map((user)=><option key={user.id} value={user.id}>{user.displayName} — {user.employeeId}</option>)}</select></label>
            <label className="text-xs font-extrabold text-[#49617f]">Due date and time<input name="schedDueAt" type="datetime-local" required value={taskDueValue} onChange={(event)=>setTaskDueValue(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
            <label className="text-xs font-extrabold text-[#49617f]">Priority<select name="schedPriority" defaultValue="MEDIUM" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3">{["LOW","MEDIUM","HIGH","URGENT"].map((value)=><option key={value}>{value}</option>)}</select></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a7bb0]">Quick due</span>
            {[{label:"Today 5:00 PM",days:0},{label:"Tomorrow 5:00 PM",days:1},{label:"In 2 days",days:2}].map((preset)=>(
              <button key={preset.label} type="button" onClick={()=>setTaskDueValue(dueDateOffset(preset.days))} className="rounded-lg border border-[#d9c9f0] bg-white px-3 py-2 text-[11px] font-extrabold text-[#6349c1] transition hover:bg-[#f2efff]">{preset.label}</button>
            ))}
            <button disabled={!taskAssignees.length || schedulingTasks} className="ml-auto h-11 rounded-xl bg-[#7257d6] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(114,87,214,0.2)] disabled:cursor-wait disabled:opacity-50">{schedulingTasks ? "Scheduling…" : "Schedule cycle counts"}</button>
          </div>
        </form>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#155eef]">Live workload</p>
              <h3 className="mt-1 text-sm font-extrabold text-[#17345f]">Warehouse Executives working now</h3>
            </div>
            <span className="text-xs font-bold text-[#8295af]">{managerExecutives.reduce((sum, exec) => sum + exec.inProgress, 0)} in progress now</span>
          </div>
          {managerExecutives.length === 0 && (
            <div className="mt-3 rounded-2xl border border-dashed border-[#d5e1f0] bg-[#fbfcfe] px-5 py-8 text-center">
              <p className="text-sm font-extrabold text-[#24466f]">No executive work assigned yet</p>
              <p className="mt-1 text-xs text-[#8294ac]">Assign a task above and the executive&apos;s live workload appears here.</p>
            </div>
          )}
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {managerExecutives.map((exec) => (
              <article key={exec.assignee.id} className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${exec.inProgress > 0 ? "bg-[#f2efff] text-[#6349c1]" : "bg-[#edf4ff] text-[#155eef]"}`}>{exec.assignee.displayName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                    <div>
                      <p className="text-sm font-extrabold text-[#17345f]">{exec.assignee.displayName}</p>
                      <p className="text-[11px] font-semibold text-[#8294ac]">{exec.open} open · {exec.inProgress} in progress · {exec.completed} done</p>
                    </div>
                  </div>
                  {exec.inProgress > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2efff] px-2.5 py-1 text-[10px] font-extrabold text-[#6349c1]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7257d6]" />Working</span>}
                </div>
                {exec.currentTask && (
                  <div className="mt-3 rounded-xl border border-[#e0cbf5] bg-[#faf6ff] px-3 py-2.5">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Currently on</p>
                    <p className="mt-0.5 truncate text-xs font-extrabold text-[#3f3470]">{exec.currentTask.title}</p>
                    {exec.currentTask.startedAt && <p className="mt-0.5 text-[10px] font-semibold text-[#8379aa]">Started {formatClock(exec.currentTask.startedAt)}</p>}
                    {exec.inProgress > 1 && <span className="mt-1 w-fit rounded-full bg-[#e9e1fb] px-2 py-0.5 text-[9px] font-extrabold text-[#6349c1]">+{exec.inProgress - 1} more in progress</span>}
                  </div>
                )}
                {exec.open === 0 && exec.inProgress === 0 && (
                  <p className="mt-3 text-[11px] font-semibold text-[#8a9bb1]">{exec.completed > 0 ? `${exec.completed} task${exec.completed === 1 ? "" : "s"} completed` : "Waiting for assignments."}</p>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" aria-pressed={managerTaskView === "OPEN"} onClick={()=>setManagerTaskView("OPEN")} className={`rounded-xl px-4 py-2 text-xs font-extrabold ${managerTaskView === "OPEN" ? "bg-[#155eef] text-white shadow-[0_8px_20px_rgba(21,94,239,0.2)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`}>Open ({openTaskCount})</button>
              <button type="button" aria-pressed={managerTaskView === "COMPLETED"} onClick={()=>setManagerTaskView("COMPLETED")} className={`rounded-xl px-4 py-2 text-xs font-extrabold ${managerTaskView === "COMPLETED" ? "bg-[#16865b] text-white shadow-[0_8px_20px_rgba(22,134,91,0.2)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`}>Completed ({completedTaskCount})</button>
            </div>
            <span className="text-xs font-bold text-[#8295af]">{openTaskCount} open · {completedTaskCount} completed</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {displayedManagerTasks.map((task)=>(
              <article key={task.id} className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-extrabold text-[#17345f]">{task.title}</p>
                      <span className="rounded-full bg-[#f2efff] px-2 py-0.5 text-[9px] font-extrabold text-[#6349c1]">{taskTypeLabel(task.type)}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#7b8fa9]">{task.assignedTo?.displayName ?? "Unassigned"} · {task.location?.name ?? "Any location"}{task.product ? ` · ${task.product.name}` : ""}</p>
                  </div>
                  <span className={`inline-flex h-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${taskStatusTone(task.status)}`}>{task.status === "IN_PROGRESS" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7257d6]" />}{task.status.replaceAll("_", " ")}</span>
                </div>
                {task.status === "IN_PROGRESS" && task.startedAt && <p className="mt-2 text-[10px] font-bold text-[#6349c1]">Started {formatClock(task.startedAt)}</p>}
                {task.status === "COMPLETED" && task.completedAt && <p className="mt-2 text-[10px] font-bold text-[#16865b]">Completed {formatClock(task.completedAt)}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {task.priority !== "MEDIUM" && <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${priorityTone(task.priority)}`}>{task.priority}</span>}
                  {task.dueAt && <span className="rounded-full bg-[#fff5df] px-2 py-0.5 text-[9px] font-extrabold text-[#b36d0c]">{formatTaskDue(task.dueAt)}</span>}
                </div>
              </article>
            ))}
            {displayedManagerTasks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#d5e1f0] bg-[#fbfcfe] px-5 py-8 text-center md:col-span-2">
                <p className="text-sm font-extrabold text-[#24466f]">No {managerTaskView === "OPEN" ? "open" : "completed"} tasks</p>
                <p className="mt-1 text-xs text-[#8294ac]">{managerTaskView === "OPEN" ? "Assigned tasks appear here while executives work on them." : "Completed tasks are kept here for review."}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="manager-tx-tabbar" className="mt-6 rounded-[24px] border border-[#d7e2f0] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Manager transaction tools</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Transactions</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Review Warehouse Executive-confirmed stock changes, then trace every posted transaction in the controlled ledger.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#d5e1f0] bg-[#f4f8ff] p-1.5">
            <button
              type="button"
              aria-pressed={transactionTab === "needsReview"}
              onClick={() => setTransactionTab("needsReview")}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${transactionTab === "needsReview" ? "bg-[#155eef] text-white shadow-[0_8px_20px_rgba(21,94,239,0.22)]" : "text-[#496482] hover:text-[#155eef]"}`}
            >
              Needs review{pendingApprovals > 0 ? ` (${pendingApprovals})` : ""}
            </button>
            <button
              type="button"
              aria-pressed={transactionTab === "history"}
              onClick={() => setTransactionTab("history")}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${transactionTab === "history" ? "bg-[#155eef] text-white shadow-[0_8px_20px_rgba(21,94,239,0.22)]" : "text-[#496482] hover:text-[#155eef]"}`}
            >
              History
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]" data-tx-tab="needsReview" data-tx-tab-active={transactionTab === "needsReview" ? "true" : "false"}>
        <section id="manager-approvals" className="scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
          <div className="flex items-center justify-between border-b border-[#e9eef5] px-6 py-6">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#d47b08]">Action required</p>
              <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Pending approvals</h2>
            </div>
            <span className="rounded-full bg-[#fff4df] px-3 py-1 text-xs font-extrabold text-[#b36d0c]">
              {pendingApprovals} open
            </span>
          </div>
          {managerMessage && (
            <div className="mx-6 mt-5 rounded-xl bg-[#eef5ff] px-4 py-3 text-sm font-semibold text-[#244f86]">
              {managerMessage}
            </div>
          )}
          <div className="divide-y divide-[#edf1f6]">
            {pendingReviewTransactions.length === 0 && (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 size={26} className="mx-auto text-[#16865b]" />
                <p className="mt-3 text-sm font-extrabold text-[#24466f]">
                  No confirmed transactions need review
                </p>
                <p className="mt-1 text-xs text-[#8093ab]">
                  New items requiring manager review will appear here.
                </p>
              </div>
            )}
            {pendingReviewTransactions.map((transaction) => {
              const title = transaction.action
                .toLowerCase()
                .replaceAll("_", " ")
                .replace(/^\w/, (letter) => letter.toUpperCase());
              const location =
                transaction.sourceLocation?.name ??
                transaction.destinationLocation?.name ??
                "Location unavailable";
              return (
              <div key={transaction.id} className="px-6 py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff4df] text-[#d47b08]">
                    <AlertTriangle size={19} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#24466f]">{title}</p>
                    <p className="mt-1 text-xs font-semibold text-[#8093ab]">
                      {transaction.product.name} · {location}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8295af]">
                      TX-{transaction.id.slice(0, 8).toUpperCase()} · Warehouse Executive confirmed
                    </p>
                    {transaction.reviewReasons && (
                      <p className="mt-1.5 rounded-lg bg-[#fff4df] px-2.5 py-1.5 text-xs font-semibold text-[#b36d0c]">
                        Flagged: {transaction.reviewReasons.split("\n").join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-[#17345f]">
                      {transaction.quantity} {transaction.product.unit}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#b36d0c]">
                      Manager decision required
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2.5 border-t border-[#f0f3f8] pt-5 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={reviewingId === transaction.id}
                    onClick={() => void reviewTransaction(transaction, "approve")}
                    className="rounded-xl bg-[#16865b] px-4 py-3 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.22)] disabled:opacity-60"
                  >
                    Approve and post
                  </button>
                  <button
                    type="button"
                    disabled={reviewingId === transaction.id}
                    onClick={() => void reviewTransaction(transaction, "recount")}
                    className="rounded-xl border border-[#e0bd70] bg-[#fffaf0] px-4 py-2.5 text-xs font-extrabold text-[#b36d0c] disabled:opacity-60"
                  >
                    Request recount
                  </button>
                  <button
                    type="button"
                    disabled={reviewingId === transaction.id}
                    onClick={() => void reviewTransaction(transaction, "reject")}
                    className="rounded-xl border border-[#efb5b5] bg-[#fff6f6] px-4 py-2.5 text-xs font-extrabold text-[#b83f3f] disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#e0e8f3] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#16865b]">Last 7 days</p>
              <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Stock movement</h2>
            </div>
            <ArrowRightLeft size={21} className="text-[#155eef]" />
          </div>
          <div className="mt-6 flex h-44 items-end gap-2 rounded-2xl bg-[#f7f9fc] px-4 pb-3 pt-6">
            {movementReport.days.map((day) => (
              <div key={day.key} className="flex h-full flex-1 flex-col justify-end gap-1 text-center" title={`${day.label}: received ${day.received}, shipped/used ${day.outgoing}`}>
                <div className="flex h-[118px] items-end justify-center gap-1">
                  <div className="w-2 rounded-t bg-[#58b68e]" style={{ height: `${Math.max(day.received ? 5 : 0, (day.received / movementReport.maximum) * 100)}%` }} />
                  <div className="w-2 rounded-t bg-[#155eef]" style={{ height: `${Math.max(day.outgoing ? 5 : 0, (day.outgoing / movementReport.maximum) * 100)}%` }} />
                </div>
                <span className="text-[9px] font-bold text-[#8294ac]">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9db4]">Received</p>
              <p className="mt-1 text-xl font-extrabold text-[#16865b]">+{movementReport.receivedTotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9db4]">Shipped / used</p>
              <p className="mt-1 text-xl font-extrabold text-[#24466f]">-{movementReport.outgoingTotal.toLocaleString()}</p>
            </div>
          </div>
        </section>
      </div>


      <section className="mt-6 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#102a56]">Auto reorder requests</h2>
            <p className="mt-1 text-xs text-[#8294ac]">
              {snapshot ? "Reorder requests are created automatically when stock falls below the safety level. Approved orders stay in the purchase-order list below until the stock is received, then they are removed automatically." : "Preview data until the inventory API is available"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("purchase-order-drafts")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="rounded-xl border border-[#d8e2ef] px-4 py-2 text-xs font-extrabold text-[#496482]"
          >
            Review reorder requests
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
              <tr>
                {["Item", "Code", "Available", "Safety level", "Status", "Action"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-6 py-3 font-extrabold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6] text-sm">
              {displayedLowStock.map((stock) => (
                <tr key={stock.code}>
                  <td className="whitespace-nowrap px-6 py-4 font-extrabold text-[#24466f]">{stock.item}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#7c90aa]">{stock.code}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-extrabold text-[#29466f]">{stock.available}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#6c829f]">{stock.threshold}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${stock.status === "Critical" ? "bg-[#ffe8e8] text-[#c43f3f]" : "bg-[#fff2d9] text-[#aa690d]"}`}>
                      {stock.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setReorderActionId("refresh");
                        setReorderMessage("");
                        refreshReorderDrafts()
                          .then(applyReorderDrafts)
                          .catch(() =>
                            setReorderMessage(
                              "The reorder drafts could not be refreshed.",
                            ),
                          )
                          .finally(() => setReorderActionId(null));
                        document
                          .getElementById("purchase-order-drafts")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                      className="text-xs font-extrabold text-[#155eef]"
                    >
                      Reorder now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section
        id="purchase-order-drafts"
        className="mt-6 scroll-mt-6 rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]"
      >
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7257d6]">
              Manager-only · purchase orders
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">
              Reorder requests & purchase orders
            </h2>
            <p className="mt-1 text-xs text-[#8294ac]">
              Auto-created when stock falls below the safety level. Approved orders stay here until the stock is received, then they are removed automatically.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#fff2d9] px-3 py-1 text-[10px] font-extrabold text-[#aa690d]">{reorderDrafts.filter((draft) => draft.status === "DRAFT").length} awaiting approval</span>
              <span className="rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]">{(() => { const count = reorderDrafts.filter((draft) => draft.status === "APPROVED" || draft.status === "SENT").length; return `${count} purchase order${count === 1 ? "" : "s"}`; })()}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setReorderActionId("refresh");
              setReorderMessage("");
              refreshReorderDrafts()
                .then(setReorderDrafts)
                .catch(() =>
                  setReorderMessage("The reorder drafts could not be refreshed."),
                )
                .finally(() => setReorderActionId(null));
            }}
            disabled={reorderActionId === "refresh"}
            className="rounded-xl border border-[#c8d6e8] px-4 py-2.5 text-xs font-extrabold text-[#496482] disabled:opacity-60"
          >
            {reorderActionId === "refresh" ? "Checking stock…" : "Refresh drafts"}
          </button>
        </div>

        {reorderMessage && (
          <div className="mx-6 mt-5 rounded-xl bg-[#eef5ff] px-4 py-3 text-sm font-semibold text-[#244f86]">
            {reorderMessage}
          </div>
        )}

        {visibleReorderDrafts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <PackageCheck size={26} className="mx-auto text-[#16865b]" />
            <p className="mt-3 text-sm font-extrabold text-[#24466f]">
              No active reorder requests
            </p>
            <p className="mt-1 text-xs text-[#8093ab]">
              Requests are created automatically when stock drops below its safety level.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
                <tr>
                  {[
                    "Item",
                    "Location",
                    "Available",
                    "Safety",
                    "Suggested",
                    "Supplier",
                    "Status",
                    "Expected receiving",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 font-extrabold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f6] text-sm">
                {visibleReorderDrafts.map((draft) => (
                  <tr key={draft.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">
                      {draft.product.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">
                      {draft.location.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#c04b4b]">
                      {draft.currentStock}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">
                      {draft.safetyStock}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#7257d6]">
                      {draft.suggestedQuantity}
                      {draft.product.supplier && draft.product.supplier.minimumOrderQuantity > 0 ? (
                        <p className="mt-0.5 text-[10px] font-semibold text-[#8a9bb3]">
                          Min. order: {draft.product.supplier.minimumOrderQuantity}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap font-semibold text-[#496482]">
                        {draft.product.supplierName ?? "Not configured"}
                      </p>
                      <p className="whitespace-nowrap text-[10px] text-[#8a9bb3]">
                        {draft.product.supplierEmail ?? "Supplier email required"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                          draft.emailStatus === "SENT"
                            ? "bg-[#eaf8f1] text-[#16865b]"
                            : draft.emailStatus === "FAILED"
                              ? "bg-[#ffe8e8] text-[#c43f3f]"
                              : draft.emailStatus === "QUEUED"
                                ? "bg-[#edf4ff] text-[#155eef]"
                                : draft.status === "APPROVED"
                                  ? "bg-[#eaf8f1] text-[#16865b]"
                                  : "bg-[#fff2d9] text-[#aa690d]"
                        }`}
                      >
                        {draft.emailStatus === "SENT"
                          ? "Email sent"
                          : draft.emailStatus === "FAILED"
                            ? "Delivery failed"
                            : draft.emailStatus === "QUEUED"
                              ? "Email queued"
                              : draft.status === "APPROVED"
                                ? "Approved"
                                : "Draft"}
                      </span>
                      {draft.emailAttempts > 0 && (
                        <p className="mt-1 text-[10px] font-semibold text-[#8a9bb3]">
                          {draft.emailAttempts} delivery attempt
                          {draft.emailAttempts === 1 ? "" : "s"}
                        </p>
                      )}
                      {draft.emailStatus === "FAILED" && draft.emailError && (
                        <p
                          className="mt-1 max-w-40 truncate text-[10px] font-semibold text-[#b83f3f]"
                          title={draft.emailError}
                        >
                          {draft.emailError}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {draft.status === "APPROVED" || draft.status === "SENT" ? (
                        draft.receivingTask ? (
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${taskStatusTone(
                                draft.receivingTask.status,
                              )}`}
                            >
                              {draft.receivingTask.status === "IN_PROGRESS" && (
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7257d6]" />
                              )}
                              Expected receiving · {receivingTaskLabel(draft.receivingTask.status)}
                            </span>
                            <span className="text-[10px] font-semibold text-[#8a9bb3]">
                              {draft.receivingTask.dueAt
                                ? formatTaskDue(draft.receivingTask.dueAt)
                                : "No due date"}
                              {draft.receivingTask.assignedTo
                                ? ` · ${draft.receivingTask.assignedTo.displayName}`
                                : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a9bb3]">
                            Task pending
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a9bb3]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {draft.status === "DRAFT" ? (
                        <button
                          type="button"
                          disabled={reorderActionId === draft.id}
                          onClick={() =>
                            void handleReorderAction(draft)
                          }
                          className="rounded-lg bg-[#16865b] px-3 py-2 text-[11px] font-extrabold text-white disabled:opacity-60"
                        >
                          Approve order
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a9bb3]">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section id="manager-audit-history" className="mt-6 scroll-mt-24 rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]" data-tx-tab="history" data-tx-tab-active={transactionTab === "history" ? "true" : "false"}>
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Controlled ledger</p><h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Inventory audit history</h2><p className="mt-1 text-xs text-[#8294ac]">All authorized stock transactions with creator, reviewer and references.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter audit action" value={auditAction} onChange={(event) => setAuditAction(event.target.value)} className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]"><option value="ALL">All actions</option>{["RECEIVE","SHIP","USE","TRANSFER","CYCLE_COUNT","DAMAGE","LOSS"].map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}</select><select aria-label="Filter audit status" value={auditStatus} onChange={(event) => setAuditStatus(event.target.value)} className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]"><option value="ALL">All statuses</option>{["PENDING","RECOUNT_REQUESTED","APPROVED","REJECTED","POSTED","CANCELLED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><button type="button" onClick={exportAuditHistory} disabled={!auditTransactions.length} className="flex h-10 items-center gap-2 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white disabled:opacity-50"><Download size={15} /> Export CSV</button></div></div>
        <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]"><tr>{["Date","Transaction","Action","Product","Quantity","Location","Created by","Reviewed by","Status","Cancel"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-extrabold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#edf1f6] text-xs">{auditTransactions.map((transaction) => <tr key={transaction.id}><td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{new Intl.DateTimeFormat("en", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(transaction.createdAt))}</td><td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">TX-{transaction.id.slice(0,8).toUpperCase()}</td><td className="whitespace-nowrap px-5 py-4 font-bold text-[#496482]">{transaction.action.replaceAll("_"," ")}</td><td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">{transaction.product.name}</td><td className="whitespace-nowrap px-5 py-4 font-bold text-[#29466f]">{transaction.quantity} {transaction.product.unit}</td><td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"}</td><td className="whitespace-nowrap px-5 py-4 text-[#496482]">{transaction.createdBy?.displayName ?? "System"}</td><td className="whitespace-nowrap px-5 py-4 text-[#496482]">{transaction.approvedBy?.displayName ?? "—"}</td><td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${transaction.status === "POSTED" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "REJECTED" ? "bg-[#fff0f0] text-[#b83b3b]" : transaction.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`}>{transaction.status.replaceAll("_"," ")}</span></td><td className="whitespace-nowrap px-5 py-4">{["PENDING","RECOUNT_REQUESTED","APPROVED"].includes(transaction.status) ? <button type="button" disabled={cancellingTransactionId === transaction.id} onClick={() => void handleCancelManagerTransaction(transaction)} className="rounded-lg border border-[#efb5b5] px-2.5 py-1.5 text-[10px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{cancellingTransactionId === transaction.id ? "Cancelling…" : "Cancel"}</button> : <span className="text-[#d3dbe6]">—</span>}</td></tr>)}{!auditTransactions.length && <tr><td colSpan={10} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No audit records match the selected filters.</td></tr>}</tbody></table></div>
      </section>


      <AdministratorDashboard managerMode page={page} />
    </div>
  );
}

function FloatingVoiceAssistant({
  active,
  onOpen,
}: {
  active: boolean;
  onOpen: () => void;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  function clampPosition(x: number, y: number) {
    return {
      x: Math.min(Math.max(12, x), Math.max(12, window.innerWidth - 76)),
      y: Math.min(Math.max(88, y), Math.max(88, window.innerHeight - 82)),
    };
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("inventory_worker_voice_position");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x: number; y: number };
        if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
          setPosition(clampPosition(parsed.x, parsed.y));
        }
      } catch {
        window.localStorage.removeItem("inventory_worker_voice_position");
      }
    }
    const keepOnScreen = () => setPosition((current) => current ? clampPosition(current.x, current.y) : current);
    window.addEventListener("resize", keepOnScreen);
    return () => window.removeEventListener("resize", keepOnScreen);
  }, []);

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: bounds.left,
      originY: bounds.top,
      moved: false,
    };
    setPosition({ x: bounds.left, y: bounds.top });
    setDragging(true);
  }

  function moveVoiceButton(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.current.startX;
    const deltaY = event.clientY - drag.current.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) drag.current.moved = true;
    setPosition(clampPosition(drag.current.originX + deltaX, drag.current.originY + deltaY));
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const wasMoved = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setPosition((current) => {
      if (current) window.localStorage.setItem("inventory_worker_voice_position", JSON.stringify(current));
      return current;
    });
    if (!wasMoved) onOpen();
  }

  return (
    <div
      className="floating-voice-wrap fixed z-50"
      style={position ? { left: position.x, top: position.y } : { right: 24, bottom: 24 }}
    >
      <span className="floating-voice-hint" aria-hidden="true">Drag me · Tap for voice</span>
      <button
        type="button"
        aria-label={active ? "Voice entry is open. Drag this microphone to move it." : "Open voice entry. Drag this microphone to move it."}
        aria-pressed={active}
        title="Drag to move · Tap to open Voice Entry"
        onPointerDown={beginDrag}
        onPointerMove={moveVoiceButton}
        onPointerUp={finishDrag}
        onPointerCancel={() => { drag.current = null; setDragging(false); }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className={`floating-voice-button ${active ? "is-active" : ""} ${dragging ? "is-dragging" : ""}`}
        style={{ touchAction: "none" }}
      >
        <span className="floating-voice-ripple" aria-hidden="true" />
        <Mic size={25} strokeWidth={2.4} />
        <span className="floating-drag-dots" aria-hidden="true">•••</span>
      </button>
    </div>
  );
}

function AdministratorDashboard({
  managerMode = false,
  page = "Overview",
  onNavigate,
}: {
  managerMode?: boolean;
  page?: string;
  onNavigate?: (page: string) => void;
}) {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [clockNow, setClockNow] = useState(() => new Date());
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productMessage, setProductMessage] = useState("");
  const [productError, setProductError] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<ApiLocation | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [viewLocationId, setViewLocationId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [productFormSupplierId, setProductFormSupplierId] = useState<string>("");
  const [editingSupplier, setEditingSupplier] = useState<ApiSupplier | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierMessage, setSupplierMessage] = useState("");
  const [supplierError, setSupplierError] = useState(false);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<ApiSystemHealth | null>(null);
  const [systemUsers, setSystemUsers] = useState<ApiSystemUser[]>([]);
  const [userAccessAudit, setUserAccessAudit] = useState<ApiUserAccessAudit[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [editingSystemUser, setEditingSystemUser] = useState<ApiSystemUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<ApiSystemUser | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [trackedItemId, setTrackedItemId] = useState<string | null>(null);
  const [itemDrafts, setItemDrafts] = useState<ApiReorderDraft[]>([]);
  const [itemActionId, setItemActionId] = useState<string | null>(null);
  const [itemOrderMessage, setItemOrderMessage] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (managerMode) {
        const [inventory, supplierRecords] = await Promise.all([
          fetchInventorySnapshot(),
          fetchSuppliers(),
        ]);
        setSnapshot(inventory);
        setSuppliers(supplierRecords);
      } else {
        const [health, users, accessAudit, inventory, supplierRecords, drafts] = await Promise.all([
          fetchDetailedSystemHealth(),
          fetchSystemUsers(),
          fetchUserAccessAudit(),
          fetchInventorySnapshot(),
          fetchSuppliers(),
          fetchReorderDrafts(),
        ]);
        setSystemHealth(health);
        setSystemUsers(users);
        setUserAccessAudit(accessAudit);
        setSnapshot(inventory);
        setSuppliers(supplierRecords);
        setItemDrafts(drafts);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : managerMode
            ? "Warehouse management data could not be loaded."
            : "Administrator access and system-health data could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void fetchInventorySnapshot()
        .then((inventory) => setSnapshot(inventory))
        .catch(() => undefined);
    }, 8_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  async function saveSystemUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingUser(true);
    setUserMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const userInput = {
        employeeId: String(data.get("employeeId") ?? ""),
        displayName: String(data.get("displayName") ?? ""),
        email: String(data.get("email") ?? ""),
        role: String(data.get("role")) as "WORKER" | "MANAGER",
      };
      if (editingSystemUser) {
        await updateSystemUser(editingSystemUser.id, userInput);
      } else {
        await createSystemUser({
          ...userInput,
          temporaryPassword: String(data.get("temporaryPassword") ?? ""),
        });
      }
      setUserMessage(
        editingSystemUser
          ? "User details and role updated successfully."
          : "User created successfully. The account can sign in immediately and must set a new password.",
      );
      form.reset();
      setShowUserForm(false);
      setEditingSystemUser(null);
      setSystemUsers(await fetchSystemUsers());
      setUserAccessAudit(await fetchUserAccessAudit());
    } catch (saveError) {
      setUserMessage(
        saveError instanceof Error ? saveError.message : "User account could not be created.",
      );
    } finally {
      setSavingUser(false);
    }
  }

  async function changeSystemUserStatus(user: ApiSystemUser) {
    if (
      user.active &&
      !window.confirm(
        `Deactivate ${user.displayName}? The user will be signed out and blocked immediately.`,
      )
    ) {
      return;
    }
    setUpdatingUserId(user.id);
    setUserMessage("");
    try {
      const updated = await updateSystemUserStatus(user.id, !user.active);
      setSystemUsers((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      setUserMessage(
        updated.active
          ? `${updated.displayName} was activated and can sign in now.`
          : `${updated.displayName} was deactivated and signed out immediately.`,
      );
      setUserAccessAudit(await fetchUserAccessAudit());
    } catch (statusError) {
      setUserMessage(
        statusError instanceof Error
          ? statusError.message
          : "The account status could not be changed.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function saveResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetPasswordUser) return;
    setUpdatingUserId(resetPasswordUser.id);
    setUserMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await resetSystemUserPassword(
        resetPasswordUser.id,
        String(data.get("temporaryPassword") ?? ""),
      );
      setUserMessage(
        `${resetPasswordUser.displayName}'s password was reset. The user must choose a new password at the next sign-in.`,
      );
      form.reset();
      setResetPasswordUser(null);
      setUserAccessAudit(await fetchUserAccessAudit());
    } catch (resetError) {
      setUserMessage(
        resetError instanceof Error
          ? resetError.message
          : "The temporary password could not be reset.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProduct(true);
    setProductMessage("");
    setProductError(false);
    const data = new FormData(event.currentTarget);
    const sku = String(data.get("sku") ?? "").trim().toUpperCase();
    const supplierName = String(data.get("supplierName") ?? "").trim();
    const supplierEmail = String(data.get("supplierEmail") ?? "").trim();
    const supplierId = String(data.get("supplierId") ?? "").trim();
    const input: ProductInput = {
      sku,
      name: String(data.get("name") ?? "").trim(),
      unit: String(data.get("unit") ?? "unit").trim() || "unit",
      safetyStock: Number(data.get("safetyStock")),
      reorderQuantity: Number(data.get("reorderQuantity")),
      controlled: data.get("controlled") === "on",
      ...(supplierName ? { supplierName } : {}),
      ...(supplierEmail ? { supplierEmail } : {}),
      ...(supplierId ? { supplierId } : {}),
    };
    const duplicateSku = (snapshot?.products ?? []).some(
      (product) =>
        product.sku.trim().toUpperCase() === sku &&
        product.id !== editingProduct?.id,
    );
    if (duplicateSku) {
      setProductError(true);
      setProductMessage(`A product with SKU "${sku}" already exists. Choose a different SKU.`);
      setSavingProduct(false);
      return;
    }
    const selectedSupplier = supplierId
      ? suppliers.find((supplier) => supplier.id === supplierId && supplier.active) ?? null
      : null;
    if (selectedSupplier && input.reorderQuantity < selectedSupplier.minimumOrderQuantity) {
      setProductError(true);
      setProductMessage(`Reorder quantity must be at least ${selectedSupplier.minimumOrderQuantity} — ${selectedSupplier.name}'s minimum order quantity is ${selectedSupplier.minimumOrderQuantity}.`);
      setSavingProduct(false);
      return;
    }
    try {
      if (editingProduct) await updateInventoryProduct(editingProduct.id, input);
      else await createInventoryProduct(input);
      setProductMessage(editingProduct ? "Product and rules updated successfully." : "Product added successfully.");
      setEditingProduct(null);
      setShowProductForm(false);
      await load();
    } catch (error) {
      setProductError(true);
      setProductMessage(error instanceof Error ? error.message : "Product could not be saved. Check the SKU and entered values.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(product: ApiProduct) {
    const stockedBalances = (snapshot?.balances ?? []).filter(
      (balance) =>
        balance.product.id === product.id &&
        (balance.quantity > 0 || balance.reservedQuantity > 0),
    );
    if (stockedBalances.length > 0) {
      setProductError(true);
      setProductMessage(
        `"${product.name}" still has stock on hand and cannot be deleted. Stock found at ${stockedBalances
          .map((balance) => `${balance.location.code} (${balance.quantity} on hand)`)
          .join(", ")}. Move or remove the stock first, then try again.`,
      );
      return;
    }
    if (
      !window.confirm(
        `Delete "${product.name}" (${product.sku}) from the product list? The item will no longer appear anywhere in the app. Its transaction history is kept for the audit ledger.`,
      )
    ) {
      return;
    }
    setDeletingProductId(product.id);
    setProductMessage("");
    setProductError(false);
    try {
      await deleteInventoryProduct(product.id);
      setProductMessage(`Product ${product.sku} deleted from the master list.`);
      await load();
    } catch (error) {
      setProductError(true);
      setProductMessage(error instanceof Error ? error.message : "Product could not be deleted. Try again.");
    } finally {
      setDeletingProductId(null);
    }
  }

  async function handleDeleteSupplier(supplier: ApiSupplier) {
    if (
      !window.confirm(
        `Delete supplier "${supplier.name}" (${supplier.code})? The supplier will be removed from the list and can no longer be assigned to new items. Its code can be reused later.`,
      )
    ) {
      return;
    }
    setDeletingSupplierId(supplier.id);
    setSupplierMessage("");
    setSupplierError(false);
    try {
      await deleteSupplier(supplier.id);
      setSupplierMessage(`Supplier ${supplier.code} deleted.`);
      await load();
    } catch (error) {
      setSupplierError(true);
      setSupplierMessage(error instanceof Error ? error.message : "Supplier could not be deleted. Try again.");
    } finally {
      setDeletingSupplierId(null);
    }
  }

  async function saveSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      code: String(data.get("code") ?? ""), name: String(data.get("name") ?? ""),
      leadTimeDays: Number(data.get("leadTimeDays")), minimumOrderQuantity: Number(data.get("minimumOrderQuantity")),
    };
    try {
      if (editingSupplier) await updateSupplier(editingSupplier.id, input); else await createSupplier(input);
      setSupplierMessage(editingSupplier ? "Supplier updated successfully." : "Supplier added successfully.");
      setEditingSupplier(null); setShowSupplierForm(false); await load();
    } catch (error) { setSupplierMessage(error instanceof Error ? error.message : "Supplier could not be saved. Check the supplier code and details."); }
  }

  async function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const generatedCode = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const input = {
      code: editingLocation?.code ?? generatedCode,
      name,
    };
    try {
      if (editingLocation) await updateLocation(editingLocation.id, input); else await createLocation(input);
      setLocationMessage(editingLocation ? "Location updated successfully." : "Location added successfully.");
      setLocationError(false);
      setEditingLocation(null); setShowLocationForm(false); await load();
    } catch (error) { setLocationMessage(error instanceof Error ? error.message : "Location could not be saved. A location with this name may already exist."); setLocationError(true); }
  }

  async function handleDeleteLocation(location: ApiLocation) {
    const locationStock = (snapshot?.balances ?? [])
      .filter((balance) => balance.location.id === location.id)
      .reduce((sum, balance) => sum + (balance.quantity - balance.reservedQuantity), 0);
    const confirmed = window.confirm(
      locationStock > 0
        ? `Delete location "${location.name}"? This location currently holds ${locationStock} available unit${locationStock === 1 ? "" : "s"} of stock. Move or post the stock out first, then delete the location.`
        : `Delete location "${location.name}"? The location will be permanently removed from the warehouse list.`,
    );
    if (!confirmed) return;
    setDeletingLocationId(location.id);
    try {
      await deleteLocation(location.id);
      setLocationMessage(`Location "${location.name}" deleted successfully.`);
      setLocationError(false);
      await load();
    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : "Location could not be deleted.");
      setLocationError(true);
    } finally {
      setDeletingLocationId(null);
    }
  }

  async function handleItemOrder(
    product: ApiProduct,
    action: "check" | "approve" | "send",
  ) {
    setItemActionId(product.id);
    setItemOrderMessage("");
    try {
      let drafts = itemDrafts;
      if (action === "check") {
        drafts = await refreshReorderDrafts();
        setItemDrafts(drafts);
      }
      const draft = drafts.find(
        (entry) =>
          entry.product.id === product.id &&
          ["DRAFT", "APPROVED", "SENT"].includes(entry.status),
      );
      if (!draft) {
        setItemOrderMessage(
          `${product.name} is not below its safety level, so no purchase order is required.`,
        );
        return;
      }
      if (action === "check") {
        setTrackedItemId(product.id);
        setItemOrderMessage(
          draft.status === "DRAFT"
            ? `A purchase-order draft is ready for ${product.name}. Review and approve it below.`
            : `${product.name} already has an ${draft.status.toLowerCase()} order.`,
        );
      } else if (action === "approve") {
        await approveReorderDraft(
          draft.id,
          "Approved from the Administrator item page.",
        );
        setItemOrderMessage(
          `The purchase order for ${product.name} is approved and ready to send.`,
        );
        setItemDrafts(await fetchReorderDrafts());
      } else {
        await queueReorderEmail(draft.id);
        setItemOrderMessage(
          `The purchase order for ${product.name} was queued for supplier delivery.`,
        );
        setItemDrafts(await fetchReorderDrafts());
      }
    } catch (orderError) {
      setItemOrderMessage(
        orderError instanceof Error
          ? orderError.message
          : "The item order action could not be completed.",
      );
    } finally {
      setItemActionId(null);
    }
  }

  const nextSku = useMemo(() => {
    let highest = 99;
    for (const product of snapshot?.products ?? []) {
      const match = /^ITEM-(\d+)$/i.exec(product.sku.trim());
      if (match) highest = Math.max(highest, Number(match[1]));
    }
    return `ITEM-${String(highest + 1).padStart(3, "0")}`;
  }, [snapshot]);
  const nextSupplierCode = useMemo(() => {
    let highest = 0;
    for (const supplier of suppliers) {
      const match = /^SUP-(\d+)$/i.exec(supplier.code.trim());
      if (match) highest = Math.max(highest, Number(match[1]));
    }
    return `SUP-${String(highest + 1).padStart(3, "0")}`;
  }, [suppliers]);

  const productFormSupplier = productFormSupplierId
    ? suppliers.find((supplier) => supplier.id === productFormSupplierId && supplier.active) ?? null
    : null;

  const filteredItems = (snapshot?.products ?? []).filter((product) =>
    `${product.sku} ${product.name} ${product.supplierName ?? ""}`
      .toLowerCase()
      .includes(itemSearch.trim().toLowerCase()),
  );
  const trackedItem =
    snapshot?.products.find((product) => product.id === trackedItemId) ?? null;
  const trackedBalances = trackedItem
    ? (snapshot?.balances ?? []).filter(
        (balance) => balance.product.id === trackedItem.id,
      )
    : [];
  const trackedTransactions = trackedItem
    ? (snapshot?.transactions ?? [])
        .filter((transaction) => transaction.product.id === trackedItem.id)
        .slice(0, 8)
    : [];
  const totalAvailableStock = (snapshot?.balances ?? []).reduce(
    (total, balance) =>
      total + Math.max(0, balance.quantity - balance.reservedQuantity),
    0,
  );
  const lowItemCount = (snapshot?.products ?? []).filter((product) => {
    const available = (snapshot?.balances ?? [])
      .filter((balance) => balance.product.id === product.id)
      .reduce(
        (total, balance) =>
          total + Math.max(0, balance.quantity - balance.reservedQuantity),
        0,
      );
    return available < product.safetyStock;
  }).length;

  const adminName = getAuthenticatedDisplayName() || "Administrator";
  const adminGreeting = (() => {
    const hour = clockNow.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const metrics = [
    [UsersRound, "Application users", String(systemUsers.length), "Authenticated users synchronized with the system", "User access"],
    [Boxes, "Active items", String(snapshot?.products.length ?? 0), "Products available in the inventory catalogue", "Items"],
    [PackageCheck, "Available stock", String(totalAvailableStock), "On-hand quantity after reservations", "Items"],
    [AlertTriangle, "Items below safety", String(lowItemCount), "Products requiring replenishment attention", "Items"],
    [Activity, "System health", systemHealth?.status === "healthy" ? "Healthy" : "Review", "Live application and service availability", "System health"],
  ] as const;

  return (
    <div id={managerMode ? "manager-warehouse-controls" : "admin-overview"} className="dashboard-content page-dashboard administrator-dashboard space-y-6" data-active-page={page}>
      {!managerMode && <>
      <section id="admin-overview-hero" className="relative overflow-hidden rounded-[26px] border border-[#d9e6f8] bg-gradient-to-br from-[#0b2a58] via-[#12468f] to-[#2f6fe8] p-6 text-white shadow-[0_22px_55px_rgba(16,42,86,0.22)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#6ea5ff]/30 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur">
              <Sparkles size={13} />
              {new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(clockNow)}
            </div>
            <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]">
              {adminGreeting}, {adminName}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]">
              Manage the item catalogue, user access and system health — {lowItemCount} item{lowItemCount === 1 ? "" : "s"} need replenishment attention and {systemUsers.length} user{systemUsers.length === 1 ? "" : "s"} have secure access.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <Clock3 size={18} className="text-[#a9c6ff]" />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Live clock</p>
                <p className="text-sm font-extrabold tabular-nums">{new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: true }).format(clockNow)}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <UsersRound size={18} className="text-[#ffd08a]" />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Users</p>
                <p className="text-sm font-extrabold">{systemUsers.length} active</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <AlertTriangle size={18} className="text-[#ff9d9d]" />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Below safety</p>
                <p className="text-sm font-extrabold">{lowItemCount} items</p>
              </div>
            </div>
            <button type="button" onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#155eef] shadow-[0_10px_24px_rgba(21,94,239,0.25)] transition hover:scale-[1.03]">
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh data
            </button>
          </div>
        </div>
      </section>

      {error && <div id="admin-load-error" className="rounded-2xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-sm font-semibold text-[#a73737]">{error}</div>}

      <section id="admin-overview-metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([Icon, label, value, detail, targetPage]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              onNavigate?.(targetPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-[20px] border border-[#e0e8f3] bg-white p-5 text-left shadow-[0_10px_28px_rgba(20,49,87,0.06)] transition hover:-translate-y-0.5 hover:border-[#b9cff0] hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]"
          >
            <div className="flex items-center justify-between"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8295af]">{label}</span><Icon size={19} className="text-[#155eef]" /></div>
            <p className="mt-4 text-3xl font-extrabold text-[#102a56]">{loading ? "—" : value}</p>
            <p className="mt-1 text-xs font-semibold text-[#7b8fa9]">{detail}</p>
            <span className="mt-3 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]">View details →</span>
          </button>
        ))}
      </section>

      <section id="admin-overview-command" className="rounded-[24px] border border-[#d8e5f7] bg-white p-5 shadow-[0_18px_45px_rgba(16,42,86,0.1)]">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]">Quick toolbar</p>
          <h2 className="text-lg font-extrabold text-[#102a56]">Jump to any tool in one tap</h2>
          <p className="text-xs font-semibold text-[#8294ac]">Your most-used administration tools, right here — no menus required.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
          {([
            ["Items", "Items", Boxes, "from-[#155eef] to-[#4a7df0]", snapshot?.products.length ?? 0],
            ["User access", "User access", UsersRound, "from-[#d47b08] to-[#f0a13a]", systemUsers.length],
            ["System health", "System health", Activity, "from-[#16865b] to-[#2fa97c]", undefined],
            ["Add item", "Add item", PackageCheck, "from-[#16865b] to-[#22aa78]", undefined],
            ["Add user", "Add user", UserRound, "from-[#7257d6] to-[#9678f2]", undefined],
            ["Refresh data", "Refresh", RefreshCcw, "from-[#455b78] to-[#6e86a5]", undefined],
          ] as Array<[string, string, typeof Boxes, string, number | undefined]>).map(([action, label, ToolIcon, tone, count]) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                if (action === "Add item") { onNavigate?.("Items"); setEditingProduct(null); setProductFormSupplierId(""); setShowProductForm(true); setProductMessage(""); setProductError(false); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
                if (action === "Add user") { onNavigate?.("User access"); setEditingSystemUser(null); setShowUserForm(true); setUserMessage(""); return; }
                if (action === "Refresh data") { void load(); return; }
                onNavigate?.(action); window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
      </>}

      {!managerMode && <section id="admin-items" className="scroll-mt-28 rounded-[24px] border border-[#dbe5f2] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]">
        <div className="flex flex-col gap-5 border-b border-[#e8eef6] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Item master and availability</p>
            <h3 className="mt-1 text-xl font-extrabold text-[#102a56]">Items and stock control</h3>
            <p className="mt-1 text-sm text-[#7489a6]">Track every item, check location availability, edit purchasing rules and manage supplier orders.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-11 items-center gap-2 rounded-xl border border-[#d5e1f0] bg-[#f8fafc] px-3">
              <Search size={16} className="text-[#8295af]" />
              <input value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder="Search item, SKU or supplier" aria-label="Search items" className="w-56 bg-transparent text-xs font-semibold outline-none" />
            </label>
            <button type="button" onClick={() => { setEditingProduct(null); setProductFormSupplierId(""); setShowProductForm(true); setProductMessage(""); setProductError(false); }} className="h-11 rounded-xl bg-[#155eef] px-4 text-sm font-extrabold text-white">+ Add item</button>
          </div>
        </div>

        {(productMessage || itemOrderMessage) && <div role="status" className={`mx-6 mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${productMessage ? (productError ? "border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "border-[#cfe0f8] bg-[#eef6ff] text-[#244f86]") : "border-[#cfe0f8] bg-[#eef6ff] text-[#244f86]"}`}>{productMessage || itemOrderMessage}</div>}

        {showProductForm && <form key={editingProduct?.id ?? "new-admin-item"} onSubmit={saveProduct} className="mx-6 mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-4"><p className="font-extrabold text-[#17345f]">{editingProduct ? `Edit ${editingProduct.name}` : "Add a new inventory item"}</p><p className="mt-1 text-xs text-[#7b8fa9]">Item details and reorder settings are saved directly to the inventory database.</p></div>
          <label className="text-xs font-extrabold text-[#49617f]">SKU / Item code<input name="sku" required defaultValue={editingProduct?.sku ?? nextSku} placeholder="ITEM-500" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Item name<input name="name" required defaultValue={editingProduct?.name ?? ""} placeholder="Product name" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Unit<input name="unit" required defaultValue={editingProduct?.unit ?? "unit"} placeholder="unit, box, kg" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Approved supplier<select name="supplierId" defaultValue={editingProduct?.supplierId ?? ""} onChange={(event) => setProductFormSupplierId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"><option value="">Not assigned</option>{suppliers.filter((supplier) => supplier.active).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.code} — {supplier.name}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Safety stock<input name="safetyStock" type="number" min="0" required defaultValue={editingProduct?.safetyStock ?? 10} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Reorder quantity<input name="reorderQuantity" type="number" min={productFormSupplier?.minimumOrderQuantity ?? 0} required defaultValue={editingProduct?.reorderQuantity ?? 20} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />{productFormSupplier ? <span className="mt-1 block text-[10px] font-bold text-[#155eef]">Minimum order for {productFormSupplier.name}: {productFormSupplier.minimumOrderQuantity} — reorder quantity must be at least this value.</span> : null}</label>
          <label className="flex items-center gap-3 rounded-xl border border-[#d5e1f0] bg-white px-4 py-3 sm:col-span-2"><input name="controlled" type="checkbox" defaultChecked={editingProduct?.controlled ?? false} className="h-4 w-4 accent-[#155eef]" /><span className="text-xs font-extrabold text-[#49617f]">Controlled / high-value item<span className="mt-0.5 block text-[10px] font-bold text-[#8295af]">Stock-reducing actions always require manager review.</span></span></label>
          <div className="flex items-end gap-2 sm:col-span-2"><button disabled={savingProduct} className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60">{savingProduct ? "Saving…" : editingProduct ? "Save item changes" : "Add item"}</button><button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]">Cancel</button></div>
        </form>}

        <div className="overflow-x-auto p-6">
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-[0.12em] text-[#8295af]">{["SKU", "Item", "Locations", "On hand", "Reserved", "Available", "Safety", "Status", "Supplier", "Actions"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3.5 font-extrabold">{heading}</th>)}</tr></thead>
            <tbody>{filteredItems.map((product) => {
              const balances = (snapshot?.balances ?? []).filter((balance) => balance.product.id === product.id);
              const onHand = balances.reduce((total, balance) => total + balance.quantity, 0);
              const reserved = balances.reduce((total, balance) => total + balance.reservedQuantity, 0);
              const available = Math.max(0, onHand - reserved);
              const status = available <= 0 ? "Out of stock" : available < product.safetyStock ? "Low stock" : "Available";
              return <tr key={product.id} className={`border-b border-[#eef2f7] last:border-0 ${trackedItemId === product.id ? "bg-[#f5f9ff]" : ""}`}>
                <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0f8] bg-[#f4f8ff] px-2.5 py-1.5 font-mono text-[11px] font-extrabold text-[#155eef]">{product.sku}</span></td>
                <td className="px-4 py-4"><p className="flex flex-wrap items-center gap-2 font-extrabold text-[#17345f]">{product.name}{product.controlled && <span className="rounded-full bg-[#fff4df] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#b36d0c]">Controlled</span>}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#8295af]">{product.unit}</p></td>
                <td className="px-4 py-4 font-bold text-[#496482]">{balances.length}</td>
                <td className="px-4 py-4 font-extrabold text-[#17345f]">{onHand}</td>
                <td className="px-4 py-4 font-bold text-[#a46009]">{reserved}</td>
                <td className="px-4 py-4 text-lg font-black text-[#16865b]">{available}</td>
                <td className="px-4 py-4 font-bold text-[#496482]">{product.safetyStock}</td>
                <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${status === "Available" ? "bg-[#eaf8f1] text-[#16865b]" : status === "Low stock" ? "bg-[#fff4df] text-[#b36d0c]" : "bg-[#ffe8e8] text-[#c43f3f]"}`}>{status}</span></td>
                <td className="px-4 py-4"><p className="font-bold text-[#496482]">{product.supplierName || "Not assigned"}</p><p className="mt-1 max-w-44 truncate text-[10px] text-[#8295af]">{product.supplierEmail || "Supplier email required"}</p></td>
                <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setTrackedItemId(product.id); setItemOrderMessage(""); }} className="rounded-lg border border-[#b9d0f8] px-3 py-2 text-xs font-extrabold text-[#155eef]">Track</button><button type="button" onClick={() => { setEditingProduct(product); setProductFormSupplierId(product.supplierId ?? ""); setShowProductForm(true); setProductMessage(""); setProductError(false); }} className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#496482]">Edit</button><button type="button" disabled={itemActionId === product.id} onClick={() => void handleItemOrder(product, "check")} className="rounded-lg bg-[#17345f] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">{itemActionId === product.id ? "Checking…" : "Order"}</button><button type="button" disabled={deletingProductId === product.id} onClick={() => void handleDeleteProduct(product)} className="rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{deletingProductId === product.id ? "Deleting…" : "Delete"}</button></div></td>
              </tr>;
            })}</tbody>
          </table>
          {!filteredItems.length && <div className="py-12 text-center"><Boxes size={28} className="mx-auto text-[#9aabc1]" /><p className="mt-3 text-sm font-extrabold text-[#496482]">No items match your search</p></div>}
        </div>

        {trackedItem && <div className="border-t border-[#e8eef6] bg-[#f8fbff] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Item tracking</p><h4 className="mt-1 text-lg font-extrabold text-[#102a56]">{trackedItem.name} <span className="text-sm text-[#8295af]">({trackedItem.sku})</span></h4><p className="mt-1 text-xs text-[#7489a6]">Live availability by location and recent stock movement history.</p></div><button type="button" onClick={() => setTrackedItemId(null)} className="rounded-lg border border-[#d5e1f0] bg-white px-3 py-2 text-xs font-bold text-[#617796]">Close tracking</button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{trackedBalances.map((balance) => { const available = balance.quantity - balance.reservedQuantity; return <article key={balance.id} className="rounded-2xl border border-[#dce6f3] bg-white p-4"><div className="flex items-center justify-between"><p className="font-extrabold text-[#17345f]">{balance.location.code}</p><Warehouse size={17} className="text-[#155eef]" /></div><p className="mt-3 text-2xl font-black text-[#16865b]">{available}</p><p className="text-[10px] font-bold uppercase tracking-wider text-[#8295af]">Available stock</p><div className="mt-3 flex justify-between text-xs font-semibold text-[#647b99]"><span>On hand {balance.quantity}</span><span>Reserved {balance.reservedQuantity}</span></div></article>; })}{!trackedBalances.length && <article className="rounded-2xl border border-dashed border-[#cbd8e8] bg-white p-5 text-sm font-semibold text-[#7b8fa9]">No location assignment exists for this item.</article>}</div>
          {(() => { const draft = itemDrafts.find((entry) => entry.product.id === trackedItem.id && ["DRAFT", "APPROVED", "SENT"].includes(entry.status)); return <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#e4d2a7] bg-[#fffaf0] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#a66a12]">Purchase order</p><p className="mt-1 font-extrabold text-[#604515]">{draft ? `${draft.status.replaceAll("_", " ")} · ${draft.suggestedQuantity} ${trackedItem.unit} suggested` : "No active order for this item"}</p><p className="mt-1 text-xs font-semibold text-[#8a7147]">{draft ? `${draft.location.name} · available ${draft.currentStock} · safety ${draft.safetyStock}${draft.product.supplier && draft.product.supplier.minimumOrderQuantity > 0 ? ` · supplier min. order ${draft.product.supplier.minimumOrderQuantity}` : ""}` : "Use Order to check the latest stock level and generate a draft when required."}</p></div><div className="flex flex-wrap gap-2">{draft?.receivingTask && <><span className={`inline-flex items-center gap-1.5 self-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ${taskStatusTone(draft.receivingTask.status)}`}>{draft.receivingTask.status === "IN_PROGRESS" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7257d6]" />}Expected receiving · {receivingTaskLabel(draft.receivingTask.status)}</span>{(draft.receivingTask.dueAt || draft.receivingTask.assignedTo) && <span className="self-center text-[10px] font-bold text-[#8a7147]">{draft.receivingTask.dueAt ? formatTaskDue(draft.receivingTask.dueAt) : ""}{draft.receivingTask.assignedTo ? ` · ${draft.receivingTask.assignedTo.displayName}` : ""}</span>}</>}{draft?.status === "DRAFT" && <button type="button" disabled={itemActionId === trackedItem.id} onClick={() => void handleItemOrder(trackedItem, "approve")} className="rounded-xl bg-[#16865b] px-4 py-2.5 text-xs font-extrabold text-white">Approve order</button>}{draft?.status === "APPROVED" && draft.emailStatus === "NOT_QUEUED" && <button type="button" disabled={itemActionId === trackedItem.id} onClick={() => void handleItemOrder(trackedItem, "send")} className="rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white">Send to supplier</button>}<button type="button" disabled={itemActionId === trackedItem.id} onClick={() => void handleItemOrder(trackedItem, "check")} className="rounded-xl border border-[#d9bc78] bg-white px-4 py-2.5 text-xs font-extrabold text-[#8b5c16]">Refresh order status</button></div></div>; })()}
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dce6f3] bg-white"><table className="min-w-full text-left text-xs"><thead><tr className="border-b border-[#e8eef6] bg-[#f7f9fc] text-[10px] uppercase tracking-wider text-[#8295af]">{["Date", "Action", "Quantity", "Location", "Reference", "Status"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3">{heading}</th>)}</tr></thead><tbody>{trackedTransactions.map((transaction) => <tr key={transaction.id} className="border-b border-[#eef2f7] last:border-0"><td className="whitespace-nowrap px-4 py-3 text-[#7186a3]">{new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(transaction.createdAt))}</td><td className="px-4 py-3 font-extrabold text-[#496482]">{transaction.action.replaceAll("_", " ")}</td><td className="px-4 py-3 font-bold text-[#17345f]">{transaction.quantity}</td><td className="px-4 py-3 text-[#647b99]">{transaction.sourceLocation?.code ?? transaction.destinationLocation?.code ?? "—"}</td><td className="px-4 py-3 text-[#647b99]">{transaction.referenceNumber ?? "—"}</td><td className="px-4 py-3"><span className="rounded-full bg-[#eaf8f1] px-2.5 py-1 text-[10px] font-extrabold text-[#16865b]">{transaction.status.replaceAll("_", " ")}</span></td></tr>)}{!trackedTransactions.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm font-semibold text-[#7b8fa9]">No transactions recorded for this item.</td></tr>}</tbody></table></div>
        </div>}
      </section>}

      {!managerMode && <section id="admin-user-access" className="scroll-mt-28 rounded-[22px] border border-[#e0e8f3] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-[#102a56]">User access and permissions</h3>
            <p className="mt-1 text-sm text-[#7489a6]">Create Worker and Manager accounts, then activate or deactivate access in real time.</p>
          </div>
          <button type="button" onClick={() => { setEditingSystemUser(null); setShowUserForm(true); setUserMessage(""); }} className="rounded-xl bg-[#155eef] px-4 py-2.5 text-sm font-extrabold text-white">+ Add user</button>
        </div>
        {userMessage && <div role="status" className="mt-4 rounded-xl border border-[#cfe0f8] bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#244f86]">{userMessage}</div>}
        {showUserForm && <form key={editingSystemUser?.id ?? "new-system-user"} onSubmit={saveSystemUser} className="mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-extrabold text-[#49617f]">Employee ID<input name="employeeId" required maxLength={50} pattern="[A-Za-z0-9._-]+" defaultValue={editingSystemUser?.employeeId ?? ""} placeholder="WH-102" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Full name<input name="displayName" required minLength={2} maxLength={100} defaultValue={editingSystemUser?.displayName ?? ""} placeholder="Ravi Shah" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Company email<input name="email" type="email" required defaultValue={editingSystemUser?.email ?? ""} placeholder="ravi.shah@company.com" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">User role<select name="role" required defaultValue={editingSystemUser?.role ?? "WORKER"} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"><option value="WORKER">Warehouse Executive</option><option value="MANAGER">Manager</option></select></label>
          {!editingSystemUser && <label className="text-xs font-extrabold text-[#49617f]">Temporary password<input name="temporaryPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Minimum 8 characters" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>}
          <div className="flex items-end gap-2"><button disabled={savingUser} className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60">{savingUser ? "Saving…" : editingSystemUser ? "Save changes" : "Create account"}</button><button type="button" onClick={() => { setShowUserForm(false); setEditingSystemUser(null); }} className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]">Cancel</button></div>
          <p className="text-xs font-semibold text-[#7186a3] md:col-span-2 xl:col-span-3">{editingSystemUser ? "Role changes apply at the user's next secure session." : "The user must replace the temporary password during the first secure sign-in."}</p>
        </form>}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            [Warehouse, "Warehouse Executive", "Voice entry, confirmations and personal transaction history"],
            [ClipboardCheck, "Manager", "Approvals, warehouse master data, stock controls and purchase-order drafts"],
            [Settings, "Administrator", "User access policies and system-health monitoring"],
          ].map(([Icon, title, description]) => {
            const AccessIcon = Icon as typeof Warehouse;
            return <div key={String(title)} className="rounded-2xl border border-[#e2e9f3] bg-[#f8fafc] p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]"><AccessIcon size={19} /></span><div><p className="font-extrabold text-[#17345f]">{title}</p><span className="text-[10px] font-bold uppercase tracking-wider text-[#16865b]">Keycloak controlled</span></div></div><p className="mt-3 text-xs font-semibold leading-5 text-[#7186a3]">{description}</p></div>;
          })}
        </div>
        <div className="mt-6 border-t border-[#e8edf5] pt-5">
          <div><h4 className="font-extrabold text-[#17345f]">Real-time account controls</h4><p className="mt-1 text-xs text-[#7b8fa9]">Deactivation signs the user out and blocks API access immediately.</p></div>
          {resetPasswordUser && <form onSubmit={saveResetPassword} className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#f0cf8d] bg-[#fffaf0] p-4 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-extrabold text-[#6f582b]">New temporary password for {resetPasswordUser.displayName}<input name="temporaryPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Minimum 8 characters" className="mt-2 h-11 w-full rounded-xl border border-[#e4cf9e] bg-white px-3 text-sm font-semibold" /></label><div className="flex gap-2"><button disabled={updatingUserId === resetPasswordUser.id} className="h-11 rounded-xl bg-[#a46009] px-4 text-sm font-extrabold text-white disabled:opacity-50">Reset password</button><button type="button" onClick={() => setResetPasswordUser(null)} className="h-11 rounded-xl border border-[#dccda9] bg-white px-4 text-sm font-bold text-[#6f582b]">Cancel</button></div></form>}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {systemUsers.map((user) => <article key={user.id} className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-extrabold text-[#17345f]">{user.displayName}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#7b8fa9]">{user.employeeId} · {user.role.replaceAll("_", " ")}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${user.active ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#eef1f5] text-[#75859b]"}`}>{user.active ? "Active" : "Inactive"}</span></div>{user.role === "ADMINISTRATOR" ? <p className="mt-4 text-xs font-extrabold text-[#7b8fa9]">Protected Administrator account</p> : <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingSystemUser(user); setShowUserForm(true); setUserMessage(""); }} className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#155eef]">Edit</button><button type="button" onClick={() => { setResetPasswordUser(user); setUserMessage(""); }} className="rounded-lg border border-[#e0c37e] px-3 py-2 text-xs font-extrabold text-[#915807]">Reset password</button><button type="button" disabled={updatingUserId === user.id} onClick={() => void changeSystemUserStatus(user)} className={`rounded-lg border px-3 py-2 text-xs font-extrabold disabled:opacity-50 ${user.active ? "border-[#efb5b5] text-[#b83f3f]" : "border-[#b9decf] text-[#16865b]"}`}>{updatingUserId === user.id ? "Updating…" : user.active ? "Deactivate" : "Activate"}</button></div>}</article>)}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-[#e8edf5] pt-5 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-extrabold text-[#17345f]">Authenticated user directory</h4><p className="mt-1 text-xs text-[#7b8fa9]">Users appear here after a successful Keycloak login. Role permissions remain controlled in Keycloak.</p></div><div className="flex items-center gap-2 rounded-xl border border-[#d5e1f0] bg-[#f8fafc] px-3"><Search size={15} className="text-[#8295af]" /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" className="h-10 w-44 bg-transparent text-xs font-semibold outline-none" /></div></div>
        <div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-wider text-[#8295af]"><th className="px-3 py-3">User</th><th className="px-3 py-3">Employee ID</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Transactions</th><th className="px-3 py-3">Tasks</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Last login</th></tr></thead><tbody>{systemUsers.filter((user) => `${user.displayName} ${user.email} ${user.employeeId} ${user.role}`.toLowerCase().includes(userSearch.trim().toLowerCase())).map((user) => <tr key={user.id} className="border-b border-[#eef2f7] last:border-0"><td className="px-3 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-xs font-extrabold text-[#155eef]">{user.displayName.split(" ").map((part) => part[0]).join("").slice(0,2).toUpperCase()}</span><div><p className="font-extrabold text-[#17345f]">{user.displayName}</p><p className="text-[10px] text-[#8295af]">{user.email}</p></div></div></td><td className="px-3 py-4 font-bold text-[#496482]">{user.employeeId}</td><td className="px-3 py-4"><span className="rounded-full bg-[#f2efff] px-3 py-1 text-[10px] font-extrabold text-[#7257d6]">{user.role.replaceAll("_", " ")}</span></td><td className="px-3 py-4 font-bold text-[#29466f]">{user._count.createdTransactions}</td><td className="px-3 py-4 font-bold text-[#29466f]">{user._count.assignedTasks}</td><td className="px-3 py-4"><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${user.active ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#eef1f5] text-[#75859b]"}`}>{user.active ? "Active" : "Inactive"}</span></td><td className="whitespace-nowrap px-3 py-4 text-xs text-[#7186a3]">{user.lastLoginAt ? new Intl.DateTimeFormat("en", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(user.lastLoginAt)) : "Never"}</td></tr>)}</tbody></table>{systemUsers.length === 0 && <p className="py-8 text-center text-sm font-semibold text-[#7b8fa9]">No authenticated application users are available yet.</p>}</div>
      </section>}

      {!managerMode && <section id="admin-access-audit" className="scroll-mt-28 rounded-[22px] border border-[#e0e8f3] bg-white p-6 shadow-[0_10px_28px_rgba(20,49,87,0.05)]"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Security history</p><h3 className="mt-1 text-lg font-extrabold text-[#102a56]">User access audit</h3><p className="mt-1 text-sm text-[#7489a6]">A permanent record of account, role, password and access-status changes.</p></div><div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-wider text-[#8295af]"><th className="px-3 py-3">Date</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Target user</th><th className="px-3 py-3">Performed by</th><th className="px-3 py-3">Details</th></tr></thead><tbody>{userAccessAudit.map((record) => <tr key={record.id} className="border-b border-[#eef2f7] last:border-0"><td className="whitespace-nowrap px-3 py-4 text-xs text-[#7186a3]">{new Intl.DateTimeFormat("en", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(record.createdAt))}</td><td className="px-3 py-4"><span className="rounded-full bg-[#edf4ff] px-3 py-1 text-[10px] font-extrabold text-[#155eef]">{record.action.replaceAll("_", " ")}</span></td><td className="px-3 py-4"><p className="font-extrabold text-[#17345f]">{record.targetDisplayName}</p><p className="text-[10px] font-bold text-[#8295af]">{record.targetEmployeeId}</p></td><td className="px-3 py-4"><p className="font-bold text-[#496482]">{record.actorUsername}</p><p className="text-[10px] text-[#8295af]">{record.actorEmail ?? "Administrator"}</p></td><td className="max-w-xs px-3 py-4 text-xs leading-5 text-[#7186a3]">{record.details ?? "—"}</td></tr>)}{userAccessAudit.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No user-access changes have been recorded yet.</td></tr>}</tbody></table></div></section>}

      {managerMode && page === "Locations" && <>
      <section id="manager-locations-hero" className="rounded-[24px] bg-gradient-to-r from-[#17345f] to-[#16865b] p-6 text-white shadow-[0_18px_45px_rgba(22,134,91,0.16)] sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#cdeee1]">Warehouse management</p><h2 className="mt-2 text-2xl font-extrabold">Location management</h2><p className="mt-2 text-sm font-medium text-[#e0f4ed]">Manage warehouses, receiving areas, zones, shelves and bins used in inventory movements.</p></div><button type="button" onClick={() => void load()} className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#16865b]"><RefreshCcw size={16} className={`mr-2 inline ${loading ? "animate-spin" : ""}`} />Refresh locations</button></div></section>
      <section id="admin-locations" className="scroll-mt-28 rounded-[22px] border border-[#e0e8f3] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-extrabold text-[#102a56]">Warehouse locations</h3><p className="mt-1 text-sm text-[#7489a6]">Manage warehouses, receiving areas, zones, shelves and bins used in inventory movements.</p></div><button type="button" onClick={() => { setEditingLocation(null); setShowLocationForm(true); setLocationMessage(""); setLocationError(false); }} className="rounded-xl bg-[#155eef] px-4 py-2.5 text-sm font-extrabold text-white">+ Add location</button></div>
        {locationMessage && <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${locationError ? "border border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "bg-[#eaf8f1] text-[#16865b]"}`}>{locationMessage}</div>}
        {showLocationForm && <form key={editingLocation?.id ?? "new-location"} onSubmit={saveLocation} className="mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5"><label className="block text-xs font-extrabold text-[#49617f]">Location name<input name="name" required defaultValue={editingLocation?.name ?? ""} placeholder="Shelf B" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label><div className="flex gap-2"><button className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white">{editingLocation ? "Save changes" : "Add location"}</button><button type="button" onClick={() => setShowLocationForm(false)} className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]">Cancel</button></div></form>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{snapshot?.locations.map((location) => { const locationBalances = (snapshot?.balances ?? []).filter((balance) => balance.location.id === location.id); const availableStock = locationBalances.reduce((sum, balance) => sum + (balance.quantity - balance.reservedQuantity), 0); const stockItems = locationBalances.length; return <article key={location.id} className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-wider text-[#155eef]">{location.code}</p><p className="mt-1 font-extrabold text-[#17345f]">{location.name}</p><p className="mt-1 text-xs text-[#7b8fa9]">{location.description || "No description"}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${location.active !== false ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#eef1f5] text-[#75859b]"}`}>{location.active !== false ? "Active" : "Inactive"}</span></div><button type="button" onClick={() => setViewLocationId(viewLocationId === location.id ? null : location.id)} className={`mt-3 flex w-full items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left text-xs font-extrabold transition ${availableStock > 0 ? "border-[#cfe0f8] bg-[#f0f6ff] text-[#155eef]" : "border-[#eadfc0] bg-[#fffaf0] text-[#a46009]"} hover:border-[#6f9cff] hover:bg-[#eaf2ff]`}><span className="flex items-center gap-1.5"><Boxes size={14} />{availableStock} available unit{availableStock === 1 ? "" : "s"}<span className="font-semibold text-[#7b8fa9]">· {stockItems} item{stockItems === 1 ? "" : "s"}</span></span><span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider">{viewLocationId === location.id ? "Hide items" : "View items"}<ChevronDown size={13} className={`transition-transform ${viewLocationId === location.id ? "rotate-180" : ""}`} /></span></button>{viewLocationId === location.id && <div className="mt-3 overflow-hidden rounded-xl border border-[#dce7f5] bg-white"><div className="flex items-center justify-between border-b border-[#eef2f7] bg-[#f6f9fe] px-3 py-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#49617f]">Items stored in {location.name}</p><button type="button" onClick={() => setViewLocationId(null)} className="rounded-md p-1 text-[#8295af] hover:bg-[#e9f0fa] hover:text-[#155eef]" aria-label="Close item list"><X size={14} /></button></div>{locationBalances.length > 0 ? <>{availableStock <= 0 && <p className="border-b border-[#f0e3bd] bg-[#fffaf0] px-3 py-2 text-[10px] font-bold leading-4 text-[#a46009]">These items are assigned to this location but currently have no available stock. If stock was just received, check the location named in the worker's voice entry — it may have been placed at another location.</p>}<table className="min-w-full text-left text-xs"><thead><tr className="border-b border-[#eef2f7] text-[9px] uppercase tracking-wider text-[#8295af]"><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">On hand</th><th className="px-3 py-2 text-right">Reserved</th><th className="px-3 py-2 text-right">Available</th></tr></thead><tbody>{locationBalances.map((balance) => { const available = balance.quantity - balance.reservedQuantity; return <tr key={balance.id} className="border-b border-[#f2f6fb] last:border-0"><td className="px-3 py-2.5"><div className="flex items-center gap-2"><p className="font-extrabold text-[#17345f]">{balance.product.name}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${available <= 0 ? "bg-[#ffe8e8] text-[#c43f3f]" : available < balance.product.safetyStock ? "bg-[#fff2d9] text-[#aa690d]" : "bg-[#eaf8f1] text-[#16865b]"}`}>{available <= 0 ? "Out of stock" : available < balance.product.safetyStock ? "Low" : "Available"}</span></div><p className="mt-0.5 font-mono text-[10px] text-[#8295af]">{balance.product.sku}</p></td><td className="px-3 py-2.5 text-right font-bold text-[#496483]">{balance.quantity}</td><td className="px-3 py-2.5 text-right text-[#a46009]">{balance.reservedQuantity}</td><td className={`px-3 py-2.5 text-right font-extrabold ${available > 0 ? "text-[#16865b]" : "text-[#a46009]"}`}>{available}</td></tr>; })}</tbody></table></> : <p className="px-3 py-4 text-center text-xs font-semibold text-[#7b8fa9]">No stock is currently stored in this location.</p>}</div>}<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingLocation(location); setShowLocationForm(true); }} className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#155eef]">Edit</button><button type="button" onClick={async () => { try { await updateLocation(location.id, { active: location.active === false }); setLocationMessage(location.active === false ? "Location activated." : "Location deactivated."); setLocationError(false); await load(); } catch { setLocationMessage("Location contains stock or pending transactions and cannot be deactivated."); setLocationError(true); } }} className="rounded-lg border border-[#d5e1f0] px-3 py-2 text-xs font-bold text-[#617796]">{location.active === false ? "Activate" : "Deactivate"}</button><button type="button" disabled={deletingLocationId === location.id} onClick={() => void handleDeleteLocation(location)} className="rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50"><Trash2 size={13} className="mr-1 inline" />{deletingLocationId === location.id ? "Deleting…" : "Delete"}</button></div></article>; })}</div>
      </section>
      </>}

      {managerMode && page === "Catalog" && <>
      <section id="manager-catalog-hero" className="rounded-[24px] bg-gradient-to-r from-[#17345f] to-[#16865b] p-6 text-white shadow-[0_18px_45px_rgba(22,134,91,0.16)] sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#cdeee1]">Warehouse management</p><h2 className="mt-2 text-2xl font-extrabold">Master data and stock controls</h2><p className="mt-2 text-sm font-medium text-[#e0f4ed]">Manage product units, safety stock and reorder settings.</p></div><button type="button" onClick={() => void load()} className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#16865b]"><RefreshCcw size={16} className={`mr-2 inline ${loading ? "animate-spin" : ""}`} />Refresh controls</button></div></section>
      <section id="manager-catalog-card" className="rounded-[22px] border border-[#d7e2f0] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Catalogue master data</p>
            <h3 className="mt-1 text-lg font-extrabold text-[#102a56]">Catalog</h3>
            <p className="mt-1 text-xs text-[#8294ac]">Manage product units, safety stock and reorder settings.</p>
          </div>
        </div>
      </section>

      <section id="admin-warehouse-setup" className="scroll-mt-28 rounded-[22px] border border-[#e0e8f3] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-extrabold text-[#102a56]">Products and inventory rules</h3><p className="mt-1 text-sm text-[#7489a6]">Add available products and control their safety-stock and automatic reorder values.</p></div><button type="button" onClick={() => { setEditingProduct(null); setProductFormSupplierId(""); setShowProductForm(true); setProductMessage(""); setProductError(false); }} className="rounded-xl bg-[#155eef] px-4 py-2.5 text-sm font-extrabold text-white">+ Add product</button></div>
        {productMessage && <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${productError ? "border border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "bg-[#eef6ff] text-[#244f86]"}`}>{productMessage}</div>}
        {showProductForm && <form key={editingProduct?.id ?? "new"} onSubmit={saveProduct} className="mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 sm:grid-cols-2 lg:grid-cols-4">
          {["sku", "name", "unit"].map((field) => { const labels: Record<string,string> = { sku: "SKU / Item code", name: "Product name", unit: "Unit" }; const values: Record<string,string> = { sku: editingProduct?.sku ?? nextSku, name: editingProduct?.name ?? "", unit: editingProduct?.unit ?? "unit" }; return <label key={field} className="text-xs font-extrabold text-[#49617f]">{labels[field]}<input name={field} type="text" required defaultValue={values[field]} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold outline-none focus:border-[#155eef]" /></label>; })}
          <label className="text-xs font-extrabold text-[#49617f]">Approved supplier<select name="supplierId" defaultValue={editingProduct?.supplierId ?? ""} onChange={(event) => setProductFormSupplierId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold outline-none focus:border-[#155eef]"><option value="">Not assigned</option>{suppliers.filter((supplier) => supplier.active).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.code} — {supplier.name}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Safety stock<input name="safetyStock" type="number" min="0" required defaultValue={editingProduct?.safetyStock ?? 10} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold outline-none focus:border-[#155eef]" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Reorder quantity<input name="reorderQuantity" type="number" min={productFormSupplier?.minimumOrderQuantity ?? 0} required defaultValue={editingProduct?.reorderQuantity ?? 20} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold outline-none focus:border-[#155eef]" />{productFormSupplier ? <span className="mt-1 block text-[10px] font-bold text-[#155eef]">Minimum order for {productFormSupplier.name}: {productFormSupplier.minimumOrderQuantity} — reorder quantity must be at least this value.</span> : null}</label>
          <div className="flex items-end gap-2"><button disabled={savingProduct} className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60">{savingProduct ? "Saving…" : editingProduct ? "Save changes" : "Add product"}</button><button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]">Cancel</button></div>
        </form>}
        <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#e5ebf4] text-xs uppercase tracking-wider text-[#8295af]"><th className="px-4 py-3.5">SKU <span className="font-normal normal-case text-[#9aabc1]">(primary key)</span></th><th className="px-4 py-3.5">Product</th><th className="px-4 py-3.5">Unit</th><th className="px-4 py-3.5">Locations</th><th className="px-4 py-3.5">On hand</th><th className="px-4 py-3.5">Reserved</th><th className="px-4 py-3.5">Available</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Safety stock</th><th className="px-4 py-3.5">Reorder qty.</th><th className="px-4 py-3.5">Supplier</th><th className="px-4 py-3.5">Action</th></tr></thead><tbody>{snapshot?.products.map((product) => { const balances = (snapshot?.balances ?? []).filter((balance) => balance.product.id === product.id); const onHand = balances.reduce((total, balance) => total + balance.quantity, 0); const reserved = balances.reduce((total, balance) => total + balance.reservedQuantity, 0); const available = Math.max(0, onHand - reserved); const stockStatus = available <= 0 ? "Out of stock" : available < product.safetyStock ? "Low stock" : "Available"; return <tr key={product.id} className="border-b border-[#eef2f7] last:border-0"><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0f8] bg-[#f4f8ff] px-2.5 py-1.5 font-mono text-xs font-extrabold text-[#155eef]">{product.sku}</span></td><td className="px-4 py-4 font-bold text-[#17345f]">{product.name}</td><td className="px-4 py-4 text-[#647b99]">{product.unit}</td><td className="px-4 py-4 font-bold text-[#496482]">{balances.length}</td><td className="px-4 py-4 font-extrabold text-[#17345f]">{onHand}</td><td className="px-4 py-4 font-bold text-[#a46009]">{reserved}</td><td className="px-4 py-4 text-lg font-black text-[#16865b]">{available}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${stockStatus === "Available" ? "bg-[#eaf8f1] text-[#16865b]" : stockStatus === "Low stock" ? "bg-[#fff4df] text-[#b36d0c]" : "bg-[#ffe8e8] text-[#c43f3f]"}`}>{stockStatus}</span></td><td className="px-4 py-4 font-bold text-[#a46009]">{product.safetyStock}</td><td className="px-4 py-4 font-bold text-[#16865b]">{product.reorderQuantity}</td><td className="px-4 py-4 text-[#647b99]">{product.supplierName || "Not assigned"}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingProduct(product); setProductFormSupplierId(product.supplierId ?? ""); setShowProductForm(true); setProductMessage(""); setProductError(false); }} className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#155eef]">Edit rules</button><button type="button" disabled={deletingProductId === product.id} onClick={() => void handleDeleteProduct(product)} className="rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{deletingProductId === product.id ? "Deleting…" : "Delete"}</button></div></td></tr>; })}</tbody></table></div>
      </section>
      </>}

      {managerMode && page === "Suppliers" && <>
      <section id="admin-suppliers" className="scroll-mt-28 rounded-[22px] border border-[#e0e8f3] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-extrabold text-[#102a56]">Supplier management</h3><p className="mt-1 text-sm text-[#7489a6]">Maintain approved suppliers, lead times and minimum-order rules.</p></div><button type="button" onClick={() => { setEditingSupplier(null); setShowSupplierForm(true); setSupplierMessage(""); }} className="rounded-xl bg-[#155eef] px-4 py-2.5 text-sm font-extrabold text-white">+ Add supplier</button></div>
        {supplierMessage && <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${supplierError ? "border border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "bg-[#eef6ff] text-[#244f86]"}`}>{supplierMessage}</div>}
        {showSupplierForm && <form key={editingSupplier?.id ?? "new-supplier"} onSubmit={saveSupplier} className="mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 sm:grid-cols-2 lg:grid-cols-4">
          {["code","name"].map((field) => { const labels: Record<string,string>={code:"Supplier code",name:"Supplier name"}; const value=editingSupplier?.[field as keyof ApiSupplier]; return <label key={field} className="text-xs font-extrabold text-[#49617f]">{labels[field]}<input name={field} type="text" required defaultValue={field === "code" && !editingSupplier ? nextSupplierCode : (typeof value === "string" ? value : "")} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold outline-none focus:border-[#155eef]" /></label>; })}
          <label className="text-xs font-extrabold text-[#49617f]">Lead time (days)<input name="leadTimeDays" type="number" min="0" required defaultValue={editingSupplier?.leadTimeDays ?? 0} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Minimum order quantity<input name="minimumOrderQuantity" type="number" min="0" required defaultValue={editingSupplier?.minimumOrderQuantity ?? 0} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" /></label>
          <div className="flex items-end gap-2"><button className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white">{editingSupplier ? "Save changes" : "Add supplier"}</button><button type="button" onClick={() => setShowSupplierForm(false)} className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]">Cancel</button></div>
        </form>}
        <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#e5ebf4] text-xs uppercase tracking-wider text-[#8295af]"><th className="px-3 py-3">Code</th><th className="px-3 py-3">Supplier</th><th className="px-3 py-3">Lead time</th><th className="px-3 py-3">Minimum order</th><th className="px-3 py-3">Action</th></tr></thead><tbody>{suppliers.filter((supplier) => supplier.active).map((supplier) => <tr key={supplier.id} className="border-b border-[#eef2f7] last:border-0"><td className="px-3 py-4 font-extrabold text-[#155eef]">{supplier.code}</td><td className="px-3 py-4"><p className="font-bold text-[#17345f]">{supplier.name}</p><p className="text-xs text-[#7b8fa9]">{supplier.email || "No email"}</p></td><td className="px-3 py-4 text-[#647b99]">{supplier.leadTimeDays} days</td><td className="px-3 py-4 text-[#647b99]">{supplier.minimumOrderQuantity}</td><td className="px-3 py-4"><div className="flex gap-2"><button type="button" onClick={() => { setEditingSupplier(supplier); setShowSupplierForm(true); }} className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#155eef]">Edit</button><button type="button" disabled={deletingSupplierId === supplier.id} onClick={() => void handleDeleteSupplier(supplier)} className="rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{deletingSupplierId === supplier.id ? "Deleting…" : "Delete"}</button></div></td></tr>)}</tbody></table>{!suppliers.some((supplier) => supplier.active) ? <p className="py-8 text-center text-sm font-semibold text-[#7b8fa9]">No active suppliers. Deleted suppliers can be re-added with the same code.</p> : null}</div>
      </section>

      </>}

      {!managerMode && <section id="admin-system-health" className="scroll-mt-28 rounded-[22px] border border-[#e0e8f3] bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-extrabold text-[#102a56]">Live system health</h3><p className="mt-1 text-sm text-[#7489a6]">Direct checks of the services required for inventory operations.</p></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${systemHealth?.status === "healthy" ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#fff2d9] text-[#aa690d]"}`}>{systemHealth?.status === "healthy" ? "All healthy" : "Attention required"}</span></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{systemHealth?.services.map((service) => <article key={service.key} className={`rounded-[18px] border p-5 ${service.healthy ? "border-[#cfe7dc] bg-[#f6fcf9]" : "border-[#f0d59c] bg-[#fffaf0]"}`}><div className="flex items-center justify-between"><Activity size={21} className={service.healthy ? "text-[#16865b]" : "text-[#c4770a]"} /><span className={`text-[10px] font-extrabold uppercase tracking-wider ${service.healthy ? "text-[#16865b]" : "text-[#b16b09]"}`}>{service.healthy ? "Healthy" : "Unavailable"}</span></div><p className="mt-4 font-extrabold text-[#17345f]">{service.name}</p><p className="mt-1 text-xs font-semibold leading-5 text-[#7186a3]">{service.detail}</p></article>)}</div>{systemHealth && <p className="mt-4 text-[11px] font-semibold text-[#8a9bb3]">Last checked {new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(systemHealth.checkedAt))}. Use Refresh data to check again.</p>}</section>}

    </div>
  );
}

function AuthenticationLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f7fc] px-5 text-[#17345f]">
      <div className="rounded-[24px] border border-[#dfe7f2] bg-white px-8 py-7 text-center shadow-[0_20px_55px_rgba(15,45,85,0.1)]">
        <div className="mx-auto grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-[#edf4ff] text-[#155eef]">
          <ShieldCheck size={23} />
        </div>
        <p className="mt-4 text-sm font-extrabold text-[#17345f]">Checking secure session…</p>
        <p className="mt-1 text-xs text-[#7b8fa9]">Connecting to Inventory Management identity services</p>
      </div>
    </main>
  );
}

function InventorySearch({ role, onNavigate }: { role: Role; onNavigate: (page: string) => void }) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<InventorySnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function prepareSearch() {
    setOpen(true);
    if (data || loading) return;
    setLoading(true);
    try { setData(await fetchInventorySnapshot()); } catch { setData(null); }
    finally { setLoading(false); }
  }

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2 || !data) return [];
    const productSection = role === "administrator" ? "admin-warehouse-setup" : role === "manager" ? "admin-warehouse-setup" : "voice-entry";
    const locationSection = role === "administrator" ? "admin-locations" : role === "manager" ? "admin-locations" : "voice-entry";
    const transactionSection = role === "manager" ? "manager-audit-history" : role === "administrator" ? "admin-items" : "worker-history";
    return [
      ...data.products.filter((item) => `${item.sku} ${item.name}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ id: `p-${item.id}`, title: item.name, detail: `${item.sku} · Product`, section: productSection, icon: PackageCheck })),
      ...data.locations.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(term)).slice(0, 3).map((item) => ({ id: `l-${item.id}`, title: item.name, detail: `${item.code} · Location`, section: locationSection, icon: Warehouse })),
      ...data.transactions.filter((item) => `${item.id} ${item.action} ${item.product.name} ${item.referenceNumber ?? ""}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ id: `t-${item.id}`, title: `${item.action.replaceAll("_", " ")} · ${item.product.name}`, detail: `TX-${item.id.slice(0, 8).toUpperCase()} · ${item.status}`, section: transactionSection, icon: FileClock })),
    ].slice(0, 8);
  }, [data, query, role]);

  function selectResult(section: string) {
    setOpen(false); setQuery("");
    const pages: Record<string, string> = {
      "admin-warehouse-setup": "Catalog",
      "admin-locations": "Locations",
      "admin-items": "Items",
      "manager-audit-history": "Transactions",
      "voice-entry": "Voice entry",
      "worker-history": "My history",
    };
    onNavigate(pages[section] ?? "Overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className="relative hidden sm:block"><div className="flex items-center gap-2 rounded-xl border border-[#dce5f1] bg-[#f8fafc] px-3 transition focus-within:border-[#8db0ea] focus-within:bg-white focus-within:shadow-[0_8px_24px_rgba(21,94,239,0.1)]"><Search size={16} className="text-[#8497b0]" /><input value={query} onFocus={() => void prepareSearch()} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.currentTarget.blur(); } }} aria-label="Search inventory" aria-expanded={open} placeholder="Search items, locations, TX…" className="h-10 w-44 bg-transparent text-xs font-semibold outline-none xl:w-60" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[#8497b0] hover:text-[#155eef]"><X size={14} /></button>}</div>{open && query.trim().length >= 2 && <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-[0_18px_55px_rgba(16,45,82,0.18)]">{loading ? <p className="px-5 py-6 text-center text-xs font-bold text-[#7b8fa9]">Searching inventory…</p> : results.length ? <div className="p-2">{results.map((result) => { const ResultIcon = result.icon; return <button key={result.id} type="button" onClick={() => selectResult(result.section)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f3f7ff]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#155eef]"><ResultIcon size={17} /></span><span className="min-w-0"><span className="block truncate text-xs font-extrabold text-[#17345f]">{result.title}</span><span className="mt-0.5 block truncate text-[10px] font-semibold text-[#8295af]">{result.detail}</span></span></button>; })}</div> : <div className="px-5 py-7 text-center"><Search size={21} className="mx-auto text-[#9aabc1]" /><p className="mt-2 text-xs font-extrabold text-[#496482]">No matching inventory records</p><p className="mt-1 text-[10px] text-[#8a9bb3]">Try a product name, SKU, location or transaction number.</p></div>}</div>}</div>;
}

export default function InventoryApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>("worker");
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [displayName, setDisplayName] = useState("Inventory user");
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncState, setSyncState] = useState<
    "idle" | "syncing" | "complete" | "error"
  >("idle");
  const showingWorkerInterface = role === "worker";

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      if (import.meta.env.PROD) {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(
              registrations.map((registration) => registration.unregister()),
            ),
          )
          .then(() => caches.keys())
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("nirka-inventory-shell-"))
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => undefined);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let refreshTimer: number | undefined;

    initializeKeycloak()
      .then((authenticated) => {
        if (!active) return;

        if (authenticated) {
          const requestedRole =
            (sessionStorage.getItem("nirka_requested_role") as Role | null) ??
            "worker";
          setInventoryAccessToken(keycloak.token);
          setDisplayName(getAuthenticatedDisplayName());

          if (canUseRole(requestedRole)) {
            setRole(requestedRole);
            setLoggedIn(true);
          } else {
            setAuthError(
              "Your account is authenticated but does not have access to the selected role.",
            );
          }

          refreshTimer = window.setInterval(() => {
            keycloak
              .updateToken(60)
              .then(() => setInventoryAccessToken(keycloak.token))
              .catch(() => {
                setInventoryAccessToken();
                setLoggedIn(false);
                setAuthError("Your secure session expired. Please sign in again.");
              });
          }, 30_000);
        }

        setAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        setAuthError(
          "The authentication service is unavailable. Start Keycloak and try again.",
        );
        setAuthReady(true);
      });

    return () => {
      active = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (!loggedIn || !showingWorkerInterface) {
      setPendingSyncCount(0);
      setSyncState("idle");
      return;
    }

    const ownerId = keycloak.subject ?? "local-worker";
    let active = true;
    let syncing = false;

    const refreshAndSynchronize = async () => {
      try {
        const queued = await countOfflineInventoryUpdates(ownerId);
        if (!active) return;
        setPendingSyncCount(queued);

        if (!navigator.onLine || queued === 0 || syncing) return;
        syncing = true;
        setSyncState("syncing");
        const result = await synchronizeOfflineInventoryUpdates(ownerId);
        if (!active) return;
        setPendingSyncCount(result.remaining);
        setSyncState(result.lastError ? "error" : "complete");
      } catch {
        if (active) setSyncState("error");
      } finally {
        syncing = false;
      }
    };

    const handleQueueChange = () => void refreshAndSynchronize();
    window.addEventListener(offlineQueueChangedEvent, handleQueueChange);
    const timer = window.setInterval(() => {
      if (navigator.onLine) void refreshAndSynchronize();
    }, 30_000);
    void refreshAndSynchronize();

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(offlineQueueChangedEvent, handleQueueChange);
    };
  }, [isOnline, loggedIn, showingWorkerInterface]);

  async function beginSecureLogin(employeeId: string) {
    setAuthLoading(true);
    setAuthError("");
    sessionStorage.setItem("nirka_requested_role", role);

    if (keycloak.authenticated) {
      if (canUseRole(role)) {
        setInventoryAccessToken(keycloak.token);
        setDisplayName(getAuthenticatedDisplayName());
        setLoggedIn(true);
      } else {
        setAuthError(
          `This account does not have ${formatRoleLabel(role)} access.`,
        );
      }
      setAuthLoading(false);
      return;
    }

    try {
      await keycloak.login({
        redirectUri: window.location.origin,
        loginHint: employeeId || undefined,
      });
    } catch {
      setAuthError("Secure sign-in could not be started. Please try again.");
      setAuthLoading(false);
    }
  }

  function signOut() {
    setInventoryAccessToken();
    setLoggedIn(false);
    setActivePage("Overview");
    sessionStorage.removeItem("nirka_requested_role");
    void keycloak.logout({ redirectUri: window.location.origin });
  }

  if (!authReady) return <AuthenticationLoading />;

  if (!loggedIn) {
    return (
      <Login
        role={role}
        setRole={(nextRole) => { setRole(nextRole); setActivePage("Overview"); }}
        onLogin={(employeeId) => void beginSecureLogin(employeeId)}
        authError={authError}
        isLoading={authLoading}
      />
    );
  }

  const HeaderPageIcon = currentPageIcon(role, activePage);

  return (
    <main className={`app-shell min-h-screen bg-transparent text-[#17345f] ${showingWorkerInterface ? "pb-24 lg:pb-0" : ""}`}>        <Sidebar
        role={role}
        displayName={displayName}
        activePage={activePage}
        onNavigate={setActivePage}
        mobileOpen={mobileOpen}
        close={() => setMobileOpen(false)}
        pendingApprovals={role === "manager" ? pendingApprovals : 0}
      />
      <div className="lg:pl-[254px]">
        <header className="app-header sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            {role !== "worker" && <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="rounded-xl border border-[#dce5f1] p-2.5 text-[#55708f] lg:hidden"
              >
                <Menu size={19} />
              </button>}
            <div
              className="brand-mark grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-white shadow-[0_10px_30px_rgba(21,94,239,0.28)]"
              aria-hidden="true"
            >
              <HeaderPageIcon size={20} strokeWidth={2.1} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8497b0]">
                Central Warehouse
                <span className="inline-block h-1 w-1 rounded-full bg-[#c2cfe1]" aria-hidden="true" />
                <span className="hidden sm:inline">{roleLabel(role)}</span>
              </p>
              <h1 className="flex items-center gap-2 text-base font-extrabold tracking-[-0.02em] text-[#102a56]">
                <span className="truncate">{activePage}</span>
                <span
                  className={`status-live-dot ${isOnline ? "" : "offline"}`}
                  aria-hidden="true"
                  title={isOnline ? "System online" : "Offline — updates saved on device"}
                />
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {role === "administrator" ? (
              <div className="hidden items-center gap-2 rounded-xl border border-[#d9e8e1] bg-[#f3fbf7] px-3 py-2 text-xs font-extrabold text-[#267054] sm:flex">
                <ShieldCheck size={16} />
                Secure administration
              </div>
            ) : role === "manager" ? (
              <InventorySearch role={role} onNavigate={setActivePage} />
            ) : null}
            <div className="hidden items-center gap-2.5 rounded-2xl border border-[#e3eaf4] bg-white/75 py-1.5 pl-1.5 pr-4 shadow-[0_6px_18px_rgba(18,48,88,0.06)] md:flex">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-[11px] font-extrabold text-white">
                {(displayName || role).split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="max-w-[150px] truncate text-xs font-extrabold text-[#17345f]">{displayName || role}</p>
                <p className="text-[10px] font-semibold text-[#8295af]">
                  {roleLabel(role)}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Log out"
              onClick={signOut}
              className="rounded-xl border border-[#dce5f1] p-2.5 text-[#6f84a3] transition hover:bg-[#f5f8fc] hover:text-[#29466f]"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="dashboard-stage px-4 py-6 sm:px-7 sm:py-7">
          <div className="dashboard-welcome mb-6 flex flex-col gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#667e9e]">
                <span className="font-extrabold text-[#17345f]">{activePage}</span> · {pageDescription(role, activePage)}
              </p>
            </div>
            <div
              aria-live="polite"
              className={`flex items-center gap-2 text-xs font-semibold ${
                isOnline ? "text-[#778ba7]" : "text-[#a46009]"
              }`}
            >
              {isOnline && syncState !== "syncing" && <span className="status-live-dot" aria-hidden="true" />}
              {isOnline ? (
                syncState === "syncing" ? (
                  <CloudUpload size={15} className="text-[#155eef]" />
                ) : (
                  <Wifi size={15} className="text-[#20ad76]" />
                )
              ) : (
                <WifiOff size={15} className="text-[#d47b08]" />
              )}
              {!isOnline
                ? `Offline · ${pendingSyncCount} saved update${
                    pendingSyncCount === 1 ? "" : "s"
                  }`
                : syncState === "syncing"
                  ? `Synchronizing ${pendingSyncCount} saved update${
                      pendingSyncCount === 1 ? "" : "s"
                    }…`
                  : pendingSyncCount > 0
                    ? `${pendingSyncCount} update${
                        pendingSyncCount === 1 ? "" : "s"
                      } waiting to synchronize`
                    : syncState === "complete"
                      ? "Saved updates synchronized"
                      : "System online · Updated just now"}
            </div>
          </div>
          {showingWorkerInterface &&
            (!isOnline || pendingSyncCount > 0 || syncState === "error") && (
              <div
                role="status"
                className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  !isOnline
                    ? "border-[#f0ce8e] bg-[#fff8ea] text-[#875810]"
                    : syncState === "error"
                      ? "border-[#efb5b5] bg-[#fff4f4] text-[#a73737]"
                      : "border-[#b9d0f8] bg-[#f2f6ff] text-[#244f86]"
                }`}
              >
                {!isOnline ? (
                  <WifiOff size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <CloudUpload size={18} className="mt-0.5 shrink-0" />
                )}
                <p>
                  {!isOnline
                    ? "Offline mode is active. A confirmation for an already prepared proposal will be saved on this device; inventory will not change until synchronization succeeds."
                    : syncState === "error"
                      ? "Saved updates are still protected on this device. Synchronization will retry automatically while the app remains signed in."
                      : `${pendingSyncCount} confirmed update${
                          pendingSyncCount === 1 ? " is" : "s are"
                        } saved on this device and waiting to synchronize.`}
                </p>
              </div>
            )}
          {showingWorkerInterface ? <WorkerDashboard page={activePage} onNavigate={setActivePage} /> : role === "manager" ? <ManagerDashboard key={activePage} page={activePage} onNavigate={setActivePage} onPendingApprovalsChange={setPendingApprovals} /> : <AdministratorDashboard page={activePage} onNavigate={setActivePage} />}
        </div>
      </div>
      {showingWorkerInterface && activePage !== "Voice entry" && (
        <FloatingVoiceAssistant
          active={activePage === "Voice entry"}
          onOpen={() => {
            setActivePage("Voice entry");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
      {showingWorkerInterface && <WorkerToolDock activePage={activePage} onNavigate={setActivePage} />}
    </main>
  );
}
