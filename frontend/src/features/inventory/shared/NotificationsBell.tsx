"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
} from "../api/inventory-api";

const notificationTypeLabel: Record<string, string> = {
  NEW_DISCREPANCY: "New discrepancy",
  MAJOR_CRITICAL_DISCREPANCY: "Major discrepancy",
  RECOUNT_ASSIGNED: "Recount assigned",
  RECOUNT_COMPLETED: "Recount completed",
  DISCREPANCY_APPROVED: "Discrepancy approved",
  DISCREPANCY_REJECTED: "Discrepancy rejected",
  RESOLVED_AS_TRANSFER: "Resolved as transfer",
  CYCLE_COUNT_PLAN_ASSIGNED: "Month-end cycle count",
};

export function NotificationsBell({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate: (page: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const [list, count] = await Promise.all([
      fetchNotifications().catch(() => [] as ApiNotification[]),
      fetchUnreadNotificationCount().catch(() => 0),
    ]);
    setItems(list);
    setUnread(count);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Deferred so the loading state never updates synchronously inside the
    // effect.
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      refresh()
        .catch(() => setError("Notifications could not be loaded."))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open]);

  // Keep the badge fresh while signed in.
  useEffect(() => {
    void fetchUnreadNotificationCount().then(setUnread).catch(() => undefined);
    const timer = window.setInterval(() => {
      void fetchUnreadNotificationCount().then(setUnread).catch(() => undefined);
    }, 45_000);
    return () => window.clearInterval(timer);
  }, []);

  async function openNotification(item: ApiNotification) {
    if (!item.readAt) {
      await markNotificationRead(item.id).catch(() => undefined);
      setUnread((value) => Math.max(0, value - 1));
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, readAt: new Date().toISOString() } : candidate,
        ),
      );
    }
    setOpen(false);
    if (item.linkType === "TASK") {
      onNavigate(role === "worker" ? "Task queue" : "Task planning");
    } else {
      onNavigate(role === "worker" ? "My history" : "Discrepancies");
    }
  }

  async function markAllRead() {
    const count = await markAllNotificationsRead().catch(() => ({ updated: 0 }));
    setUnread(0);
    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
    );
    if (count.updated === 0) return;
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl border border-[#dce5f1] p-2.5 text-[#6f84a3] transition hover:bg-[#f5f8fc] hover:text-[#29466f]"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#c04343] px-1 text-[9px] font-black leading-none text-white"
            title={`${unread} unread notification${unread === 1 ? "" : "s"}`}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
            tabIndex={-1}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-[#d8e5f7] bg-white shadow-[0_20px_55px_rgba(11,35,67,0.25)]"
            style={{ animation: "dialog-in .22s ease both" }}
          >
            <div className="flex items-center justify-between border-b border-[#e9eef5] bg-[#f8faff] px-4 py-3">
              <p className="text-xs font-extrabold text-[#17345f]">
                Notifications
                {unread > 0 && (
                  <span className="ml-2 rounded-full bg-[#ffecec] px-2 py-0.5 text-[10px] font-extrabold text-[#c04343]">
                    {unread} unread
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold text-[#155eef] transition hover:bg-[#edf4ff]"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-[#8295af] transition hover:bg-[#edf1f6]"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {loading && items.length === 0 && (
                <p className="px-4 py-8 text-center text-xs font-semibold text-[#8295af]">
                  Loading notifications…
                </p>
              )}
              {error && (
                <p className="px-4 py-6 text-center text-xs font-semibold text-[#a73737]">
                  {error}
                </p>
              )}
              {!loading && !error && items.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <Bell size={22} className="mx-auto text-[#c9d5e4]" />
                  <p className="mt-2 text-sm font-extrabold text-[#24466f]">No notifications</p>
                  <p className="mt-1 text-xs text-[#7b8fa9]">
                    Updates about discrepancies and recounts appear here.
                  </p>
                </div>
              )}
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openNotification(item)}
                  className={`block w-full border-b border-[#eef2f7] px-4 py-3 text-left transition last:border-0 hover:bg-[#f8faff] ${
                    item.readAt ? "opacity-75" : "bg-[#f4f9ff]"
                  }`}
                >
                  <p className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-extrabold text-[#29466f]">
                      {notificationTypeLabel[item.type] ?? item.type.replaceAll("_", " ")}
                    </span>
                    <span className="shrink-0 text-[9px] font-bold text-[#9aabc1]">
                      {new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[#6c829f]">
                    {item.title} — {item.message}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
