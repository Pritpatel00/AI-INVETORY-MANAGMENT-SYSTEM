"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu, ShieldCheck, Wifi, WifiOff, CloudUpload } from "lucide-react";

import { initializeKeycloak, keycloak, canUseRole, getAuthenticatedDisplayName } from "./auth/keycloak";
import { setInventoryAccessToken } from "./api/inventory-api";
import type { Role } from "./types";

import { formatRoleLabel, roleLabel, pageDescription, resolveManagerPage } from "./shared/helpers";
import { HeaderPageIcon } from "./shared/currentPageIcon";
import { AppSidebar } from "./shared/AppSidebar";
import { NotificationsBell } from "./shared/NotificationsBell";
import { InventorySearch } from "./shared/InventorySearch";
import { LoadingState } from "./shared/LoadingState";
import { AuthenticationPage } from "./authentication/AuthenticationPage";
import { useNetworkStatus, useOfflineSync } from "./hooks/useNetworkStatus";
import { ExecutiveDashboard } from "./warehouse-executive/ExecutiveDashboard";
import { FloatingVoiceAssistant } from "./FloatingVoiceAssistant";
import { AnimatedBackground } from "./shared/AnimatedBackground";
import { WorkerToolDock } from "./warehouse-executive/WorkerToolDock";
import { ManagerDashboard } from "./manager/ManagerDashboard";
import { AdministratorDashboard } from "./administrator/AdministratorDashboard";

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
  const [pendingWorkerTasks, setPendingWorkerTasks] = useState(0);
  const { isOnline, pendingSyncCount, syncState, setPendingSyncCount, setSyncState } = useNetworkStatus();

  const visiblePage = role === "manager" ? resolveManagerPage(activePage) : activePage;
  const showingWorkerInterface = role === "worker";

  useOfflineSync(loggedIn, showingWorkerInterface, isOnline, pendingSyncCount, syncState, setPendingSyncCount, setSyncState);

  useEffect(() => {
    let active = true;
    let refreshTimer: number | undefined;

    initializeKeycloak()
      .then((authenticated) => {
        if (!active) return;
        if (authenticated) {
          const requestedRole =
            (sessionStorage.getItem("nirka_requested_role") as Role | null) ?? "worker";
          setInventoryAccessToken(keycloak.token);
          setDisplayName(getAuthenticatedDisplayName());
          if (canUseRole(requestedRole)) {
            setRole(requestedRole);
            setLoggedIn(true);
          } else {
            setAuthError("Your account is authenticated but does not have access to the selected role.");
          }
          refreshTimer = window.setInterval(() => {
            keycloak
              .updateToken(60)
              .then(() => setInventoryAccessToken(keycloak.token))
              .catch(() =>
                // A single transient refresh failure (Keycloak momentarily
                // busy, network hiccup) must not sign the worker out mid-
                // update. Retry the refresh once; only a second consecutive
                // failure — a genuinely rejected refresh grant — ends the
                // session. The API client additionally reacquires the token
                // and retries once on a 401, so the session survives brief
                // expiry windows without weakening authentication.
                keycloak
                  .updateToken(60)
                  .then(() => setInventoryAccessToken(keycloak.token))
                  .catch(() => {
                    setInventoryAccessToken();
                    setLoggedIn(false);
                    setAuthError(
                      "Your secure session expired. Please sign in again.",
                    );
                  }),
              );
          }, 30_000);
        }
        setAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        setAuthError("The authentication service is unavailable. Start Keycloak and try again.");
        setAuthReady(true);
      });

    return () => {
      active = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, []);

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
        setAuthError(`This account does not have ${formatRoleLabel(role)} access.`);
      }
      setAuthLoading(false);
      return;
    }

    try {
      await keycloak.login({ redirectUri: window.location.origin, loginHint: employeeId || undefined });
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

  if (!authReady) return <LoadingState />;

  if (!loggedIn) {
    return (
      <AuthenticationPage
        role={role}
        setRole={(nextRole) => { setRole(nextRole); setActivePage("Overview"); }}
        onLogin={(employeeId) => void beginSecureLogin(employeeId)}
        authError={authError}
        isLoading={authLoading}
      />
    );
  }

  return (
    <main className={`app-shell min-h-screen bg-transparent text-[#17345f] ${showingWorkerInterface ? "worker-mobile-app pb-28 lg:pb-0" : ""}`}>
      <AppSidebar
        role={role}
        displayName={displayName}
        activePage={visiblePage}
        onNavigate={setActivePage}
        mobileOpen={mobileOpen}
        close={() => setMobileOpen(false)}
        pendingApprovals={role === "manager" ? pendingApprovals : 0}
        pendingWorkerTasks={role === "worker" ? pendingWorkerTasks : 0}
      />
      <div className="lg:pl-[254px]">
        <header className={`app-header sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 px-4 sm:px-7 ${showingWorkerInterface ? "worker-mobile-header" : ""}`}>
          <div className="flex min-w-0 items-center gap-3">
            {role !== "worker" && (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="rounded-xl border border-[#dce5f1] p-2.5 text-[#55708f] lg:hidden"
              >
                <Menu size={19} />
              </button>
            )}
            <div
              className="brand-mark grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-white shadow-[0_10px_30px_rgba(21,94,239,0.28)]"
              aria-hidden="true"
            >
              <HeaderPageIcon role={role} page={visiblePage} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8497b0]">
                Central Warehouse
                <span className="inline-block h-1 w-1 rounded-full bg-[#c2cfe1]" aria-hidden="true" />
                <span className="hidden sm:inline">{roleLabel(role)}</span>
              </p>
              <h1 className="flex items-center gap-2 text-base font-extrabold tracking-[-0.02em] text-[#102a56]">
                <span className="truncate">{visiblePage}</span>
                <span
                  className={`status-live-dot ${isOnline ? "" : "offline"}`}
                  aria-hidden="true"
                  title={isOnline ? "System online" : "Offline \u2014 updates saved on device"}
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
            <NotificationsBell role={role} onNavigate={setActivePage} />
            <div className="hidden items-center gap-2.5 rounded-2xl border border-[#e3eaf4] bg-white/75 py-1.5 pl-1.5 pr-4 shadow-[0_6px_18px_rgba(18,48,88,0.06)] md:flex">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-[11px] font-extrabold text-white">
                {(displayName || role).split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="max-w-[150px] truncate text-xs font-extrabold text-[#17345f]">{displayName || role}</p>
                <p className="text-[10px] font-semibold text-[#8295af]">{roleLabel(role)}</p>
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

        <div className={`dashboard-stage px-4 py-6 sm:px-7 sm:py-7 ${showingWorkerInterface ? "worker-mobile-stage" : ""}`}>
          <div className={`dashboard-welcome mb-6 flex flex-col gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${showingWorkerInterface ? "worker-mobile-status" : ""}`}>
            <div>
              <p className="text-sm font-semibold text-[#667e9e]">
                <span className="font-extrabold text-[#17345f]">{visiblePage}</span> · {pageDescription(role, visiblePage)}
              </p>
            </div>
            <div
              aria-live="polite"
              className={`flex items-center gap-2 text-xs font-semibold ${isOnline ? "text-[#778ba7]" : "text-[#a46009]"}`}
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
                ? `Offline \u00B7 ${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}`
                : syncState === "syncing"
                  ? `Synchronizing ${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}\u2026`
                  : pendingSyncCount > 0
                    ? `${pendingSyncCount} update${pendingSyncCount === 1 ? "" : "s"} waiting to synchronize`
                    : syncState === "complete"
                      ? "Saved updates synchronized"
                      : "System online \u00B7 Updated just now"}
            </div>
          </div>

          {showingWorkerInterface && (!isOnline || pendingSyncCount > 0 || syncState === "error") && (
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
                    : `${pendingSyncCount} confirmed update${pendingSyncCount === 1 ? " is" : "s are"} saved on this device and waiting to synchronize.`}
              </p>
            </div>
          )}

          {showingWorkerInterface ? (
            <ExecutiveDashboard
              page={visiblePage}
              onNavigate={setActivePage}
              isOnline={isOnline}
              pendingSyncCount={pendingSyncCount}
              syncState={syncState}
              onSignOut={signOut}
              onPendingTaskCountChange={setPendingWorkerTasks}
            />
          ) : role === "manager" ? (
            <ManagerDashboard key={visiblePage} page={visiblePage} onNavigate={setActivePage} onPendingApprovalsChange={setPendingApprovals} />
          ) : (
            <AdministratorDashboard page={visiblePage} onNavigate={setActivePage} />
          )}
        </div>
      </div>

      {showingWorkerInterface && visiblePage !== "Voice entry" && (
        <FloatingVoiceAssistant
          active={visiblePage === "Voice entry"}
          onOpen={() => {
            setActivePage("Voice entry");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Animated background mesh for all pages */}
      <AnimatedBackground />
      {showingWorkerInterface && <WorkerToolDock activePage={visiblePage} onNavigate={setActivePage} pendingTaskCount={pendingWorkerTasks} />}
    </main>
  );
}
