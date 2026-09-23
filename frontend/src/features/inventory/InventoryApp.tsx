"use client";

import { useEffect, useState } from "react";
import { ChevronDown, CloudUpload, LogOut, Menu, ShieldCheck, Wifi, WifiOff } from "lucide-react";

import type { Role } from "./types";

import { roleLabel, pageDescription, resolveManagerPage, resolveWorkerPage } from "./shared/helpers";
import { AppSidebar } from "./shared/AppSidebar";
import { NotificationsBell } from "./shared/NotificationsBell";
import { InventorySearch } from "./shared/InventorySearch";
import { LoadingState } from "./shared/LoadingState";
import { Badge, PageHeader } from "./shared/ui";
import { AuthenticationPage } from "./authentication/AuthenticationPage";
import { ChangePasswordPage } from "./authentication/ChangePasswordPage";
import { InitializeLocalPassword } from "./authentication/InitializeLocalPassword";
import { offlineOwnerForUser, useLocalAuth, workspaceForUser } from "./auth/local-auth";
import { useNetworkStatus, useOfflineSync } from "./hooks/useNetworkStatus";
import { ExecutiveDashboard } from "./warehouse-executive/ExecutiveDashboard";
import { FloatingVoiceAssistant } from "./FloatingVoiceAssistant";
import { WorkerToolDock } from "./warehouse-executive/WorkerToolDock";
import { ManagerDashboard } from "./manager/ManagerDashboard";
import { AdministratorDashboard } from "./administrator/AdministratorDashboard";

export default function InventoryApp() {
  const [role, setRole] = useState<Role>("worker");
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [sessionBlocked, setSessionBlocked] = useState(false);
  const [localPasswordInitialized, setLocalPasswordInitialized] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingWorkerTasks, setPendingWorkerTasks] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const localAuth = useLocalAuth();
  const { ready: localAuthReady, user, provider, error: localAuthError } = localAuth;
  const loggedIn = Boolean(user) && !sessionBlocked;
  const displayName = user?.displayName ?? "Inventory user";
  const offlineOwnerId = user ? offlineOwnerForUser(user) : undefined;
  const { isOnline, pendingSyncCount, syncState, setPendingSyncCount, setSyncState } = useNetworkStatus();

  const visiblePage =
    role === "manager" ? resolveManagerPage(activePage) : role === "worker" ? resolveWorkerPage(activePage) : activePage;
  const showingWorkerInterface = role === "worker";

  useOfflineSync(
    loggedIn,
    showingWorkerInterface,
    isOnline,
    pendingSyncCount,
    syncState,
    setPendingSyncCount,
    setSyncState,
    offlineOwnerId,
  );

  useEffect(() => {
    if (!localAuthReady) return;
    if (user) {
      setRole(workspaceForUser(user));
      setSessionBlocked(false);
      setAuthReady(true);
      return;
    }
    setAuthReady(true);
  }, [localAuthReady]);

  async function beginLocalLogin(identifier: string, password: string) {
    setAuthError("");
    localAuth.clearError();
    try {
      const authenticatedUser = await localAuth.login(identifier, password);
      setRole(workspaceForUser(authenticatedUser));
      setSessionBlocked(false);
      setAuthError("");
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Invalid credentials.");
    }
  }

  async function signOut() {
    await localAuth.logout();
    setSessionBlocked(false);
    setActivePage("Overview");
    setProfileOpen(false);
  }

  /** Every navigation closes transient menus and returns to the top of the new screen. */
  function goToPage(page: string) {
    setActivePage(page);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!authReady) return <LoadingState />;

  if (!loggedIn) {
    return (
      <AuthenticationPage
        onLogin={(identifier, password) => void beginLocalLogin(identifier, password)}
        authError={authError || localAuthError}
        isLoading={localAuth.loading}
      />
    );
  }

  if (provider === "local" && user?.mustChangePassword) {
    return (
      <ChangePasswordPage
        displayName={displayName}
        onSubmit={(currentPassword, newPassword) => {
          void localAuth.changePassword(currentPassword, newPassword)
            .then((updatedUser) => {
              setRole(workspaceForUser(updatedUser));
              setAuthError("");
            })
            .catch((cause) => {
              setAuthError(cause instanceof Error ? cause.message : "Password change failed.");
            });
        }}
        authError={authError || localAuthError}
        isLoading={localAuth.loading}
      />
    );
  }

  const syncSummary = !isOnline
    ? `Offline · ${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}`
    : syncState === "syncing"
      ? `Synchronizing ${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}…`
      : pendingSyncCount > 0
        ? `${pendingSyncCount} update${pendingSyncCount === 1 ? "" : "s"} waiting to synchronize`
        : syncState === "complete"
          ? "Saved updates synchronized"
          : "System online";

  return (
    <main className={`app-shell min-h-screen text-[#101828] ${showingWorkerInterface ? "worker-mobile-app pb-28 lg:pb-0" : ""}`}>
      <a className="skip-to-content" href="#dashboard-content">Skip to main content</a>

      <AppSidebar
        role={role}
        displayName={displayName}
        activePage={visiblePage}
        onNavigate={goToPage}
        mobileOpen={mobileOpen}
        close={() => setMobileOpen(false)}
        pendingApprovals={role === "manager" ? pendingApprovals : 0}
        pendingWorkerTasks={role === "worker" ? pendingWorkerTasks : 0}
      />

      <div className="lg:pl-[254px]">
        <header className={`app-header sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 ${showingWorkerInterface ? "worker-mobile-header" : ""}`}>
          <div className="flex min-w-0 items-center gap-3">
            {role !== "worker" && (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="rounded-[10px] border border-[#e4e7ec] p-2.5 text-[#475467] hover:bg-[#f9fafb] lg:hidden"
              >
                <Menu size={18} />
              </button>
            )}
            <nav aria-label="Breadcrumb" className="page-breadcrumbs min-w-0">
              <span className="hidden items-center gap-1.5 sm:flex">
                <span>Central Warehouse</span>
                <span className="breadcrumb-sep" aria-hidden="true">/</span>
              </span>
              <span className="hidden items-center gap-1.5 md:flex">
                <span>{roleLabel(role)}</span>
                <span className="breadcrumb-sep" aria-hidden="true">/</span>
              </span>
              <span className="truncate font-bold text-[#101828]" aria-current="page">{visiblePage}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {role === "administrator" ? (
              <span className="hidden lg:block">
                <Badge tone="success">
                  <ShieldCheck size={13} aria-hidden="true" />
                  Secure administration
                </Badge>
              </span>
            ) : role === "manager" ? (
              <InventorySearch role={role} onNavigate={goToPage} />
            ) : null}

            <NotificationsBell role={role} onNavigate={goToPage} />

            <span className={`header-status-chip header-status-chip-compact ${isOnline ? "" : "is-offline"}`} aria-live="polite">
              {isOnline ? (
                syncState === "syncing" ? (
                  <CloudUpload size={14} className="text-[#155eef]" aria-hidden="true" />
                ) : (
                  <Wifi size={14} className="text-[#067647]" aria-hidden="true" />
                )
              ) : (
                <WifiOff size={14} aria-hidden="true" />
              )}
              {syncSummary}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-[12px] border border-[#e4e7ec] bg-white py-1.5 pl-1.5 pr-2 hover:bg-[#f9fafb]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#155eef] text-[11px] font-bold text-white">
                  {(displayName || role).split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                </span>
                <span className="hidden max-w-[150px] truncate text-[12px] font-bold text-[#101828] lg:block">{displayName || role}</span>
                <ChevronDown size={15} className="text-[#667085]" aria-hidden="true" />
                <span className="sr-only">Account menu</span>
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    onClick={() => setProfileOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="profile-menu" role="menu">
                    <div className="border-b border-[#e4e7ec] px-4 py-3">
                      <p className="truncate text-[13px] font-bold text-[#101828]">{displayName || role}</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-[#667085]">{roleLabel(role)}</p>
                    </div>
                    <dl className="space-y-2 px-4 py-3 text-[11px]">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-semibold text-[#667085]">Workspace</dt>
                        <dd className="font-bold text-[#101828]">Central Warehouse</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-semibold text-[#667085]">Sign-in</dt>
                        <dd className="font-bold text-[#101828]">{provider === "keycloak" ? "Legacy SSO" : "PostgreSQL account"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-semibold text-[#667085]">Connection</dt>
                        <dd className={`font-bold ${isOnline ? "text-[#067647]" : "text-[#b54708]"}`}>{isOnline ? "Online" : "Offline queue"}</dd>
                      </div>
                    </dl>
                    <div className="border-t border-[#e4e7ec] p-2">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void signOut()}
                        className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] font-bold text-[#b42318] hover:bg-[#fef3f2]"
                      >
                        <LogOut size={15} aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label="Log out"
              onClick={() => void signOut()}
              className="rounded-[10px] border border-[#e4e7ec] p-2.5 text-[#667085] hover:bg-[#f9fafb] hover:text-[#101828]"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div
          id="dashboard-content"
          className={`dashboard-stage px-4 py-5 sm:px-6 sm:py-6 ${showingWorkerInterface ? "worker-mobile-stage" : ""}`}
        >
          {provider === "keycloak" && user?.localPasswordInitializationAvailable && (
            <InitializeLocalPassword onInitialized={(initializedUser) => {
              localAuth.adoptExternalSession(initializedUser);
              setLocalPasswordInitialized(true);
            }} />
          )}
          {provider === "keycloak" && localPasswordInitialized && user?.localAuthEnabled && (
            <p className="ui-alert ui-alert-success mb-4" role="status">
              Local password initialized successfully. Sign out and sign in to the Administrator workspace with your new password to verify it.
            </p>
          )}
          {provider === "keycloak" && user && !user.localAuthEnabled && !user.localPasswordInitializationAvailable && (
            <p className="ui-alert mb-4" role="status">
              This account currently uses SSO only. Ask your administrator about secure local-password initialization through User Management. Administrator accounts require a separately approved recovery procedure if first-time setup is no longer available.
            </p>
          )}

          <PageHeader
            title={visiblePage}
            description={pageDescription(role, visiblePage)}
            meta={
              <span className={`header-status-chip ${isOnline ? "" : "is-offline"}`} aria-live="polite">
                <span className={`status-live-dot ${isOnline ? "" : "offline"}`} aria-hidden="true" />
                {showingWorkerInterface ? `${syncSummary} · Voice entry ready` : syncSummary}
              </span>
            }
          />

          {showingWorkerInterface && (!isOnline || pendingSyncCount > 0 || syncState === "error") && (
            <div
              role="status"
              className={`mb-5 flex items-start gap-3 rounded-[12px] border px-4 py-3 text-[13px] font-semibold ${
                !isOnline
                  ? "border-[#f0ce8e] bg-[#fffaeb] text-[#b54708]"
                  : syncState === "error"
                    ? "border-[#efb5b5] bg-[#fef3f2] text-[#b42318]"
                    : "border-[#b9d0f8] bg-[#eff4ff] text-[#175cd3]"
              }`}
            >
              {!isOnline ? (
                <WifiOff size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <CloudUpload size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
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
              onNavigate={goToPage}
              isOnline={isOnline}
              pendingSyncCount={pendingSyncCount}
              syncState={syncState}
              onSignOut={signOut}
              onPendingTaskCountChange={setPendingWorkerTasks}
              displayName={displayName}
              offlineOwnerId={offlineOwnerId}
            />
          ) : role === "manager" ? (
            <ManagerDashboard key={visiblePage} page={visiblePage} onNavigate={goToPage} onPendingApprovalsChange={setPendingApprovals} />
          ) : (
            <AdministratorDashboard page={visiblePage} onNavigate={goToPage} displayName={displayName} />
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

      {showingWorkerInterface && (
        <WorkerToolDock
          activePage={visiblePage}
          onNavigate={goToPage}
          pendingTaskCount={pendingWorkerTasks}
          pendingSyncCount={pendingSyncCount}
        />
      )}
    </main>
  );
}
