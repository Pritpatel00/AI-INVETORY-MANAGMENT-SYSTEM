"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  PackageCheck,
  RefreshCcw,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
  Warehouse,
  ClipboardCheck,
  Settings,
  X,
} from "lucide-react";
import {
  fetchInventorySnapshot,
  fetchDetailedSystemHealth,
  fetchSystemUsers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createLocation,
  updateLocation,
  deleteLocation,
  createInventoryProduct,
  updateInventoryProduct,
  deleteInventoryProduct,
  adjustInventoryBalance,
  createSystemUser,
  updateSystemUser,
  updateSystemUserStatus,
  resetSystemUserPassword,
  type ApiProduct,
  type ApiBalance,
  type ApiLocation,
  type ApiSupplier,
  type ApiSystemUser,
  type ApiSystemHealth,
  type ServiceHealthStatus,
  type InventorySnapshot,
  type ProductInput,
  type LocationInput,
  type SupplierInput,
} from "../api/inventory-api";
import { getAuthenticatedDisplayName } from "../auth/keycloak";
import { WarehouseHero } from "../shared/WarehouseHero";
import { StatusPulse } from "../shared/AnimationUtils";
import { AdministratorAuditTransactions } from "./AdministratorAuditTransactions";

export function AdministratorDashboard({
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
  const [adjustingBalance, setAdjustingBalance] = useState<ApiBalance | null>(null);
  const [savingBalanceAdjustment, setSavingBalanceAdjustment] = useState(false);
  const [suppliers] = useState<ApiSupplier[]>([]);
  const [systemHealth, setSystemHealth] = useState<ApiSystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState("");
  const [systemUsers, setSystemUsers] = useState<ApiSystemUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [editingSystemUser, setEditingSystemUser] = useState<ApiSystemUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<ApiSystemUser | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [trackedItemId, setTrackedItemId] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ApiLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [selectedLocationDetails, setSelectedLocationDetails] = useState<ApiLocation | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ApiSupplier | null>(null);
  const [supplierMessage, setSupplierMessage] = useState("");
  const [supplierError, setSupplierError] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (managerMode) {
        const inventory = await fetchInventorySnapshot();
        setSnapshot(inventory);
      } else {
        const [health, users, inventory] =
          await Promise.all([
            fetchDetailedSystemHealth(),
            fetchSystemUsers(),
            fetchInventorySnapshot(),
          ]);
        setSystemHealth(health);
        setSystemUsers(users);
        setSnapshot(inventory);
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

  const refreshHealth = async () => {
    setHealthLoading(true);
    setHealthError("");
    try {
      setSystemHealth(await fetchDetailedSystemHealth());
    } catch (healthRefreshError) {
      setHealthError(
        healthRefreshError instanceof Error
          ? healthRefreshError.message
          : "System health data could not be refreshed.",
      );
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        shift: String(data.get("shift") ?? ""),
        warehouseZone: String(data.get("warehouseZone") ?? ""),
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
          : "User created successfully.",
      );
      form.reset();
      setShowUserForm(false);
      setEditingSystemUser(null);
      setSystemUsers(await fetchSystemUsers());
    } catch (saveError) {
      setUserMessage(
        saveError instanceof Error
          ? saveError.message
          : "User account could not be created.",
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
        `${resetPasswordUser.displayName}'s password was reset.`,
      );
      form.reset();
      setResetPasswordUser(null);
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
    const input: ProductInput = {
      sku,
      name: String(data.get("name") ?? "").trim(),
      unit: String(data.get("unit") ?? "unit").trim() || "unit",
      safetyStock: Number(data.get("safetyStock")),
      reorderQuantity: Number(data.get("reorderQuantity")),
    };
    const duplicateSku = (snapshot?.products ?? []).some(
      (product) =>
        product.sku.trim().toUpperCase() === sku &&
        product.id !== editingProduct?.id,
    );
    if (duplicateSku) {
      setProductError(true);
      setProductMessage(
        `A product with SKU "${sku}" already exists. Choose a different SKU.`,
      );
      setSavingProduct(false);
      return;
    }
    try {
      if (editingProduct)
        await updateInventoryProduct(editingProduct.id, input);
      else await createInventoryProduct(input);
      setProductMessage(
        editingProduct
          ? "Product and rules updated successfully."
          : "Product added successfully.",
      );
      setEditingProduct(null);
      setShowProductForm(false);
      await load();
    } catch (error) {
      setProductError(true);
      setProductMessage(
        error instanceof Error
          ? error.message
          : "Product could not be saved.",
      );
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
    if (stockedBalances.length > 0 && managerMode) {
      setProductError(true);
      setProductMessage(
        `"${product.name}" still has stock on hand and cannot be deleted.`,
      );
      return;
    }
    const confirmationMessage = stockedBalances.length > 0
      ? `Administrator override: archive "${product.name}" (${product.sku}) even though it still has stock? The item will disappear from active inventory, while its stock records and audit history are preserved.`
      : `Delete "${product.name}" (${product.sku}) from the product list?`;
    if (!window.confirm(confirmationMessage)) {
      return;
    }
    setDeletingProductId(product.id);
    setProductMessage("");
    setProductError(false);
    try {
      await deleteInventoryProduct(product.id, stockedBalances.length > 0 && !managerMode);
      setProductMessage(
        stockedBalances.length > 0
          ? `Product ${product.sku} archived using Administrator permission. Stock records and audit history were preserved.`
          : `Product ${product.sku} deleted.`,
      );
      await load();
    } catch (error) {
      setProductError(true);
      setProductMessage(
        error instanceof Error
          ? error.message
          : "Product could not be deleted.",
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  async function saveBalanceAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adjustingBalance || managerMode) return;
    setSavingBalanceAdjustment(true);
    setProductMessage("");
    setProductError(false);
    const data = new FormData(event.currentTarget);
    try {
      await adjustInventoryBalance({
        balanceId: adjustingBalance.id,
        quantity: Number(data.get("quantity")),
        reservedQuantity: Number(data.get("reservedQuantity")),
        reason: String(data.get("reason") ?? "").trim(),
      });
      setProductMessage(
        `${adjustingBalance.product.name} stock updated. Available quantity and status were recalculated automatically.`,
      );
      setAdjustingBalance(null);
      await load();
    } catch (adjustError) {
      setProductError(true);
      setProductMessage(
        adjustError instanceof Error
          ? adjustError.message
          : "Stock quantity could not be adjusted.",
      );
    } finally {
      setSavingBalanceAdjustment(false);
    }
  }

  async function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingLocation(true);
    setLocationMessage("");
    setLocationError(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: LocationInput = {
      code: String(data.get("code") ?? "").trim().toUpperCase(),
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      active: editingLocation?.active ?? true,
    };
    const duplicateCode = (snapshot?.locations ?? []).some(
      (location) =>
        location.code.trim().toUpperCase() === input.code &&
        location.id !== editingLocation?.id,
    );
    if (duplicateCode) {
      setLocationError(true);
      setLocationMessage(`Location code "${input.code}" already exists.`);
      setSavingLocation(false);
      return;
    }
    try {
      if (editingLocation) await updateLocation(editingLocation.id, input);
      else await createLocation(input);
      setLocationMessage(
        editingLocation
          ? "Location updated successfully."
          : "Location added successfully.",
      );
      form.reset();
      setEditingLocation(null);
      setShowLocationForm(false);
      await load();
    } catch (saveError) {
      setLocationError(true);
      setLocationMessage(
        saveError instanceof Error
          ? saveError.message
          : "Location could not be saved.",
      );
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleDeleteLocation(location: ApiLocation) {
    const relatedBalances = (snapshot?.balances ?? []).filter(
      (balance) => balance.location.id === location.id,
    );
    if (relatedBalances.some((balance) => balance.quantity > 0 || balance.reservedQuantity > 0)) {
      setLocationError(true);
      setLocationMessage(
        `"${location.name}" contains stock and cannot be deleted. Move the stock first.`,
      );
      return;
    }
    if (!window.confirm(`Delete location "${location.name}" (${location.code})?`)) return;
    setDeletingLocationId(location.id);
    setLocationMessage("");
    setLocationError(false);
    try {
      await deleteLocation(location.id);
      setLocationMessage(`Location ${location.code} deleted.`);
      await load();
    } catch (deleteError) {
      setLocationError(true);
      setLocationMessage(
        deleteError instanceof Error
          ? deleteError.message
          : "Location could not be deleted.",
      );
    } finally {
      setDeletingLocationId(null);
    }
  }

  async function saveSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSupplier(true);
    setSupplierMessage("");
    setSupplierError(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: SupplierInput = {
      code: String(data.get("code") ?? "").trim().toUpperCase(),
      name: String(data.get("name") ?? "").trim(),
      contactName: String(data.get("contactName") ?? "").trim() || null,
      email: String(data.get("email") ?? "").trim() || null,
      phone: String(data.get("phone") ?? "").trim() || null,
      address: String(data.get("address") ?? "").trim() || null,
      leadTimeDays: Number(data.get("leadTimeDays")),
      minimumOrderQuantity: Number(data.get("minimumOrderQuantity")),
      active: editingSupplier?.active ?? true,
    };
    const duplicateCode = suppliers.some(
      (supplier) =>
        supplier.code.trim().toUpperCase() === input.code &&
        supplier.id !== editingSupplier?.id,
    );
    if (duplicateCode) {
      setSupplierError(true);
      setSupplierMessage(`Supplier code "${input.code}" already exists.`);
      setSavingSupplier(false);
      return;
    }
    try {
      if (editingSupplier) await updateSupplier(editingSupplier.id, input);
      else await createSupplier(input);
      setSupplierMessage(
        editingSupplier
          ? "Supplier updated successfully."
          : "Supplier added successfully.",
      );
      form.reset();
      setEditingSupplier(null);
      setShowSupplierForm(false);
      await load();
    } catch (saveError) {
      setSupplierError(true);
      setSupplierMessage(
        saveError instanceof Error
          ? saveError.message
          : "Supplier could not be saved.",
      );
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleDeleteSupplier(supplier: ApiSupplier) {
    const linkedProducts = (snapshot?.products ?? []).filter(
      (product) => product.supplierId === supplier.id,
    );
    if (linkedProducts.length > 0) {
      setSupplierError(true);
      setSupplierMessage(
        `"${supplier.name}" is assigned to ${linkedProducts.length} product${linkedProducts.length === 1 ? "" : "s"}. Reassign them before deleting the supplier.`,
      );
      return;
    }
    if (!window.confirm(`Delete supplier "${supplier.name}" (${supplier.code})?`)) return;
    setDeletingSupplierId(supplier.id);
    setSupplierMessage("");
    setSupplierError(false);
    try {
      await deleteSupplier(supplier.id);
      setSupplierMessage(`Supplier ${supplier.code} deleted.`);
      await load();
    } catch (deleteError) {
      setSupplierError(true);
      setSupplierMessage(
        deleteError instanceof Error
          ? deleteError.message
          : "Supplier could not be deleted.",
      );
    } finally {
      setDeletingSupplierId(null);
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

  const filteredItems = (snapshot?.products ?? []).filter((product) =>
    `${product.sku} ${product.name}`
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
  const selectedLocationBalances = selectedLocationDetails
    ? (snapshot?.balances ?? []).filter(
        (balance) =>
          balance.location.id === selectedLocationDetails.id &&
          (balance.quantity > 0 || balance.reservedQuantity > 0),
      )
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

  const healthItems = systemHealth
    ? systemHealth.services.map((service) => ({
        key: service.key,
        label: service.name,
        status: service.status,
        detail: service.detail,
      }))
    : [];

  const healthTone = (status: ServiceHealthStatus) => {
    if (status === "degraded") {
      return {
        pulse: "warning" as const,
        card: "border-[#f0ce8e] bg-[#fffaf0]",
        badge: "bg-[#fff4df] text-[#b36d0c]",
        label: "Degraded",
      };
    }
    if (status === "unavailable") {
      return {
        pulse: "offline" as const,
        card: "border-[#efb5b5] bg-[#fff4f4]",
        badge: "bg-[#ffe8e8] text-[#c43f3f]",
        label: "Offline",
      };
    }
    return {
      pulse: "online" as const,
      card: "border-[#cfe0c0] bg-[#f5fcf7]",
      badge: "bg-[#eaf8f1] text-[#16865b]",
      label: "Online",
    };
  };

  const lastCheckedLabel = systemHealth
    ? new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(systemHealth.checkedAt))
    : null;

  const metrics = [
    [
      UsersRound,
      "Application users",
      String(systemUsers.length),
      "Authenticated users",
      "User access",
    ],
    [
      Boxes,
      "Active items",
      String(snapshot?.products.length ?? 0),
      "Products in catalogue",
      "Items",
    ],
    [
      PackageCheck,
      "Available stock",
      String(totalAvailableStock),
      "On-hand after reservations",
      "Items",
    ],
    [
      AlertTriangle,
      "Items below safety",
      String(lowItemCount),
      "Replenishment attention",
      "Items",
    ],
    [
      Activity,
      "System health",
      systemHealth?.status === "healthy" ? "Healthy" : "Review",
      "Service availability",
      "System health",
    ],
    [
      ClipboardCheck,
      "Audit records",
      String(snapshot?.transactions.length ?? 0),
      "Recorded stock actions",
      "Audit transactions",
    ],
  ] as const;

  return (
    <div
      id={managerMode ? "manager-warehouse-controls" : "admin-overview"}
      className="dashboard-content page-dashboard administrator-dashboard space-y-6"
      data-active-page={page}
    >
      {!managerMode && (
        <>
          <section
            id="admin-overview-hero"
            className="hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7"
          >
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur">
                  <Sparkles size={13} />
                  {new Intl.DateTimeFormat("en", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(clockNow)}
                </div>
                <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]">
                  {adminGreeting}, {adminName}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]">
                  Manage the item catalogue, user access and system health &mdash;{" "}
                  {lowItemCount} item{lowItemCount === 1 ? "" : "s"} need
                  attention and {systemUsers.length} user
                  {systemUsers.length === 1 ? "" : "s"} have secure access.
                </p>
              </div>
              <div className="flex flex-row items-center gap-3">
                <div className="warehouse-hero-frame hidden h-28 w-44 shrink-0 sm:block">
                  <WarehouseHero variant="admin" className="w-full h-full" />
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#155eef] shadow-[0_10px_24px_rgba(21,94,239,0.25)] transition hover:scale-[1.03]"
                >
                  <RefreshCcw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div
              id="admin-load-error"
              className="rounded-2xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-sm font-semibold text-[#a73737]"
            >
              {error}
            </div>
          )}

          <AdministratorAuditTransactions
            transactions={snapshot?.transactions ?? []}
            loading={loading}
          />

          <section
            id="admin-overview-metrics"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 stagger"
          >
            {metrics.map(
              ([Icon, label, value, detail, targetPage]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onNavigate?.(targetPage);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="card-3d rounded-[20px] bg-white p-5 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8295af]">
                      {label}
                    </span>
                    <Icon size={19} className="text-[#155eef]" />
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-[#102a56]">
                    {loading ? "—" : value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#7b8fa9]">
                    {detail}
                  </p>
                  <span className="mt-3 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]">
                    View details &rarr;
                  </span>
                </button>
              ),
            )}
          </section>

          <div id="admin-overview-command" className="admin-command-center grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          {/* System Health Cards */}
          {healthItems.length > 0 && (
            <section className="admin-health-panel card-3d rounded-[24px] bg-white p-5">
              <div className="mb-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">
                  Service Health
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">
                  Live system monitoring
                </h2>
                <p className="mt-1 text-xs text-[#8294ac]">
                  All services with live status indicators and response times.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {healthItems.map((item) => {
                  const tone = healthTone(item.status);
                  return (
                    <div
                      key={item.key ?? item.label}
                      className={`rounded-2xl border p-4 ${tone.card}`}
                    >
                      <div className="flex items-center gap-3">
                        <StatusPulse status={tone.pulse} />
                        <p className="font-extrabold text-[#17345f]">
                          {item.label}
                        </p>
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-extrabold ${tone.badge}`}
                        >
                          {tone.label}
                        </span>
                      </div>
                      {item.detail && (
                        <p className="mt-2 text-xs font-semibold text-[#7b8fa9]">
                          {item.detail}
                        </p>
                      )}
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8295af]">
                        Last checked · {lastCheckedLabel ?? "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="admin-tool-panel card-3d rounded-[24px] bg-white p-5">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]">
                Quick toolbar
              </p>
              <h2 className="text-lg font-extrabold text-[#102a56]">
                Jump to any tool
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-6">
              {(
                [
                  ["Items", "Items", Boxes, "from-[#155eef] to-[#4a7df0]"],
                  [
                    "User access",
                    "User access",
                    UsersRound,
                    "from-[#d47b08] to-[#f0a13a]",
                  ],
                  [
                    "System health",
                    "System health",
                    Activity,
                    "from-[#16865b] to-[#2fa97c]",
                  ],
                  [
                    "Add item",
                    "Add item",
                    PackageCheck,
                    "from-[#16865b] to-[#22aa78]",
                  ],
                  [
                    "Add user",
                    "Add user",
                    UserRound,
                    "from-[#7257d6] to-[#9678f2]",
                  ],
                  [
                    "Refresh data",
                    "Refresh",
                    RefreshCcw,
                    "from-[#455b78] to-[#6e86a5]",
                  ],
                ] as Array<
                  [string, string, typeof Boxes, string]
                >
              ).map(([action, label, ToolIcon, tone]) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    if (action === "Add item") {
                      onNavigate?.("Items");
                      setEditingProduct(null);
                      setShowProductForm(true);
                      setProductMessage("");
                      setProductError(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      return;
                    }
                    if (action === "Add user") {
                      onNavigate?.("User access");
                      setEditingSystemUser(null);
                      setShowUserForm(true);
                      setUserMessage("");
                      return;
                    }
                    if (action === "Refresh data") {
                      void load();
                      return;
                    }
                    onNavigate?.(action);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group relative flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-3 text-left transition hover:-translate-y-1 hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] transition group-hover:scale-110`}
                  >
                    <ToolIcon size={18} />
                  </span>
                  <span className="mt-2 text-xs font-extrabold text-[#24466f]">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>
          </div>
        </>
      )}

      {managerMode && error && (
        <div
          id="admin-load-error"
          className="rounded-2xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-sm font-semibold text-[#a73737]"
        >
          {error}
        </div>
      )}

      {/* Items section */}
      {(!managerMode || page === "Catalog") && (
        <section
          id={managerMode ? "admin-warehouse-setup" : "admin-items"}
          className="card-3d scroll-mt-28 rounded-[24px] bg-white"
        >
          <div className="flex flex-col gap-5 border-b border-[#e8eef6] p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">
                Item master
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-[#102a56]">
                Items and stock control
              </h3>
              <p className="mt-1 text-sm text-[#7489a6]">
                Track items, check availability, edit inventory rules.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-[#d5e1f0] bg-[#f8fafc] px-3">
                <Search size={16} className="text-[#8295af]" />
                <input
                  value={itemSearch}
                  onChange={(event) => setItemSearch(event.target.value)}
                  placeholder="Search item or SKU"
                  aria-label="Search items"
                  className="w-56 bg-transparent text-xs font-semibold outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                  setProductMessage("");
                  setProductError(false);
                }}
                className="h-11 rounded-xl bg-[#155eef] px-4 text-sm font-extrabold text-white"
              >
                + Add item
              </button>
            </div>
          </div>

          {productMessage && (
            <div
              role="status"
              className={`mx-6 mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${
                productError
                  ? "border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]"
                  : "border-[#cfe0f8] bg-[#eef6ff] text-[#244f86]"
              }`}
            >
              {productMessage}
            </div>
          )}

          {showProductForm && (
            <form
              key={editingProduct?.id ?? "new-admin-item"}
              onSubmit={saveProduct}
              className="mx-6 mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="sm:col-span-2 xl:col-span-4">
                <p className="font-extrabold text-[#17345f]">
                  {editingProduct
                    ? `Edit ${editingProduct.name}`
                    : "Add a new item"}
                </p>
                <p className="mt-1 text-xs text-[#7b8fa9]">
                  Item details and reorder settings.
                </p>
              </div>
              <label className="text-xs font-extrabold text-[#49617f]">
                SKU
                <input
                  name="sku"
                  required
                  defaultValue={editingProduct?.sku ?? nextSku}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Name
                <input
                  name="name"
                  required
                  defaultValue={editingProduct?.name ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Unit
                <input
                  name="unit"
                  required
                  defaultValue={editingProduct?.unit ?? "unit"}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Safety stock
                <input
                  name="safetyStock"
                  type="number"
                  min="0"
                  required
                  defaultValue={editingProduct?.safetyStock ?? 10}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Reorder qty
                <input
                  name="reorderQuantity"
                  type="number"
                  min="0"
                  required
                  defaultValue={editingProduct?.reorderQuantity ?? 20}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <div className="flex items-end gap-2 sm:col-span-2">
                <button
                  disabled={savingProduct}
                  className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {savingProduct
                    ? "Saving..."
                    : editingProduct
                      ? "Save changes"
                      : "Add item"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                  className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!managerMode && adjustingBalance && (
            <form
              key={adjustingBalance.id}
              onSubmit={saveBalanceAdjustment}
              className="mx-6 mt-5 grid gap-4 rounded-2xl border border-[#f1c978] bg-[#fffaf0] p-5 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="sm:col-span-2 xl:col-span-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#b36d0c]">
                  Administrator-only adjustment
                </p>
                <h4 className="mt-1 text-lg font-extrabold text-[#17345f]">
                  Adjust {adjustingBalance.product.name} stock
                </h4>
                <p className="mt-1 text-xs text-[#7b8fa9]">
                  Available quantity and status are calculated automatically after saving.
                </p>
              </div>
              <label className="text-xs font-extrabold text-[#49617f]">
                Location
                <select
                  value={adjustingBalance.id}
                  onChange={(event) => {
                    const selected = (snapshot?.balances ?? []).find(
                      (balance) => balance.id === event.target.value,
                    );
                    if (selected) setAdjustingBalance(selected);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#dfc589] bg-white px-3 text-sm font-semibold"
                >
                  {(snapshot?.balances ?? [])
                    .filter((balance) => balance.product.id === adjustingBalance.product.id)
                    .map((balance) => (
                      <option key={balance.id} value={balance.id}>
                        {balance.location.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                On-hand quantity
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={adjustingBalance.quantity}
                  className="mt-2 h-11 w-full rounded-xl border border-[#dfc589] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Reserved quantity
                <input
                  name="reservedQuantity"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={adjustingBalance.reservedQuantity}
                  className="mt-2 h-11 w-full rounded-xl border border-[#dfc589] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Adjustment reason
                <input
                  name="reason"
                  required
                  minLength={5}
                  maxLength={500}
                  placeholder="Example: Physical recount correction"
                  className="mt-2 h-11 w-full rounded-xl border border-[#dfc589] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
                <button
                  disabled={savingBalanceAdjustment}
                  className="h-11 rounded-xl bg-[#b36d0c] px-5 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {savingBalanceAdjustment ? "Saving adjustment..." : "Save stock adjustment"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustingBalance(null)}
                  className="h-11 rounded-xl border border-[#dfc589] bg-white px-4 text-sm font-bold text-[#617796]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto p-6">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-[0.12em] text-[#8295af]">
                  {[
                    "SKU",
                    "Item",
                    "Locations",
                    "On hand",
                    "Available",
                    "Safety",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3.5 font-extrabold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((product) => {
                  const balances = (snapshot?.balances ?? []).filter(
                    (b) => b.product.id === product.id,
                  );
                  const onHand = balances.reduce(
                    (t, b) => t + b.quantity,
                    0,
                  );
                  const reserved = balances.reduce(
                    (t, b) => t + b.reservedQuantity,
                    0,
                  );
                  const available = Math.max(0, onHand - reserved);
                  const status =
                    available <= 0
                      ? "Out of stock"
                      : available < product.safetyStock
                        ? "Low stock"
                        : "Available";
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-[#eef2f7] last:border-0 ${
                        trackedItemId === product.id ? "bg-[#f5f9ff]" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0f8] bg-[#f4f8ff] px-2.5 py-1.5 font-mono text-[11px] font-extrabold text-[#155eef]">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-extrabold text-[#17345f]">
                          {product.name}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-bold text-[#496482]">
                        {balances.length}
                      </td>
                      <td className="px-4 py-4 font-extrabold text-[#17345f]">
                        {onHand}
                      </td>
                      <td className="px-4 py-4 text-lg font-black text-[#16865b]">
                        {available}
                      </td>
                      <td className="px-4 py-4 font-bold text-[#496482]">
                        {product.safetyStock}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${
                            status === "Available"
                              ? "bg-[#eaf8f1] text-[#16865b]"
                              : status === "Low stock"
                                ? "bg-[#fff4df] text-[#b36d0c]"
                                : "bg-[#ffe8e8] text-[#c43f3f]"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setTrackedItemId(product.id)}
                            className="rounded-lg border border-[#b9d0f8] px-3 py-2 text-xs font-extrabold text-[#155eef]"
                          >
                            Track
                          </button>
                          {!managerMode && balances.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingBalance(balances[0]);
                                setProductMessage("");
                                setProductError(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="rounded-lg border border-[#dfc589] bg-[#fffaf0] px-3 py-2 text-xs font-extrabold text-[#9a5d08]"
                            >
                              Adjust stock
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setShowProductForm(true);
                              setProductMessage("");
                              setProductError(false);
                            }}
                            className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#496482]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingProductId === product.id}
                            onClick={() => void handleDeleteProduct(product)}
                            className="rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] disabled:opacity-50"
                          >
                            {deletingProductId === product.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredItems.length && (
              <div className="py-12 text-center">
                <Boxes size={28} className="mx-auto text-[#9aabc1]" />
                <p className="mt-3 text-sm font-extrabold text-[#496482]">
                  No items match your search
                </p>
              </div>
            )}
          </div>

          {/* Tracked item detail */}
          {trackedItem && (
            <div className="border-t border-[#e8eef6] bg-[#f8fbff] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">
                    Item tracking
                  </p>
                  <h4 className="mt-1 text-lg font-extrabold text-[#102a56]">
                    {trackedItem.name}
                    <span className="text-sm text-[#8295af]">
                      {" "}
                      ({trackedItem.sku})
                    </span>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackedItemId(null)}
                  className="rounded-lg border border-[#d5e1f0] bg-white px-3 py-2 text-xs font-bold text-[#617796]"
                >
                  Close
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {trackedBalances.map((balance) => {
                  const available =
                    balance.quantity - balance.reservedQuantity;
                  return (
                    <article
                      key={balance.id}
                      className="rounded-2xl border border-[#dce6f3] bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-[#17345f]">
                          {balance.location.code}
                        </p>
                        <Warehouse size={17} className="text-[#155eef]" />
                      </div>
                      <p className="mt-3 text-2xl font-black text-[#16865b]">
                        {available}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8295af]">
                        Available
                      </p>
                      <div className="mt-3 flex justify-between text-xs font-semibold text-[#647b99]">
                        <span>On hand {balance.quantity}</span>
                        <span>Reserved {balance.reservedQuantity}</span>
                      </div>
                    </article>
                  );
                })}
                {!trackedBalances.length && (
                  <article className="rounded-2xl border border-dashed border-[#cbd8e8] bg-white p-5 text-sm font-semibold text-[#7b8fa9]">
                    No location assignments found.
                  </article>
                )}
              </div>
              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dce6f3] bg-white">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e8eef6] bg-[#f7f9fc] text-[10px] uppercase tracking-wider text-[#8295af]">
                      {["Date", "Action", "Qty", "Location", "Status"].map(
                        (h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {trackedTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-[#eef2f7] last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-[#7186a3]">
                          {new Intl.DateTimeFormat("en", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(tx.createdAt))}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-[#496482]">
                          {tx.action.replaceAll("_", " ")}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#17345f]">
                          {tx.quantity}
                        </td>
                        <td className="px-4 py-3 text-[#647b99]">
                          {tx.sourceLocation?.code ??
                            tx.destinationLocation?.code ??
                            "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[#eaf8f1] px-2.5 py-1 text-[10px] font-extrabold text-[#16865b]">
                            {tx.status.replaceAll("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!trackedTransactions.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-sm font-semibold text-[#7b8fa9]"
                        >
                          No transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {managerMode && page === "Locations" && (
        <section
          id="admin-locations"
          className="card-3d scroll-mt-28 rounded-[24px] bg-white"
        >
          <div className="flex flex-col gap-3 border-b border-[#e8eef6] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">
                Warehouse master
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-[#102a56]">
                Locations
              </h3>
              <p className="mt-1 text-sm text-[#7489a6]">
                View every active storage area and the stock currently assigned to it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-sm font-extrabold text-[#155eef]"
              >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingLocation(null);
                  setShowLocationForm(true);
                  setLocationMessage("");
                  setLocationError(false);
                }}
                className="h-11 rounded-xl bg-[#155eef] px-4 text-sm font-extrabold text-white"
              >
                + Add location
              </button>
            </div>
          </div>

          {locationMessage && (
            <div role="status" className={`mx-6 mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${locationError ? "border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "border-[#cfe0f8] bg-[#eef6ff] text-[#244f86]"}`}>
              {locationMessage}
            </div>
          )}

          {showLocationForm && (
            <form
              key={editingLocation?.id ?? "new-location"}
              onSubmit={saveLocation}
              className="mx-6 mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <p className="font-extrabold text-[#17345f]">{editingLocation ? "Edit location" : "Add location"}</p>
                <p className="mt-1 text-xs text-[#7b8fa9]">Use a short code and a simple, voice-friendly location name.</p>
              </div>
              <label className="text-xs font-extrabold text-[#49617f]">
                Location code
                <input name="code" required maxLength={30} defaultValue={editingLocation?.code ?? ""} placeholder="STORAGE" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Location name
                <input name="name" required maxLength={80} defaultValue={editingLocation?.name ?? ""} placeholder="Storage" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f] md:col-span-2">
                Description
                <input name="description" maxLength={200} defaultValue={editingLocation?.description ?? ""} placeholder="Main available stock area" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button disabled={savingLocation} className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60">
                  {savingLocation ? "Saving..." : editingLocation ? "Save changes" : "Add location"}
                </button>
                <button type="button" onClick={() => { setShowLocationForm(false); setEditingLocation(null); }} className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {selectedLocationDetails && (
            <div id="selected-location-items" className="mx-6 mt-5 scroll-mt-28 overflow-hidden rounded-2xl border border-[#b9d0f8] bg-[#f7faff]">
              <div className="flex flex-col gap-3 border-b border-[#dce6f3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#155eef]">{selectedLocationDetails.code} · Location inventory</p>
                  <h4 className="mt-1 text-lg font-extrabold text-[#17345f]">Items stored in {selectedLocationDetails.name}</h4>
                  <p className="mt-1 text-xs text-[#7186a3]">{selectedLocationBalances.length} stocked item{selectedLocationBalances.length === 1 ? "" : "s"} with current quantities and availability.</p>
                </div>
                <button type="button" onClick={() => setSelectedLocationDetails(null)} aria-label="Close assigned items" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#cbd8e8] bg-white text-[#617796] transition hover:text-[#155eef]"><X size={17} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-white/70 text-[10px] uppercase tracking-[0.12em] text-[#8294ac]">
                    <tr>{["SKU", "Item", "Unit", "On hand", "Reserved", "Available", "Safety stock", "Status"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-extrabold">{heading}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4ebf4] text-xs">
                    {selectedLocationBalances.map((balance) => {
                      const available = Math.max(0, balance.quantity - balance.reservedQuantity);
                      const lowStock = available < balance.product.safetyStock;
                      return (
                        <tr key={balance.id} className="bg-white/45">
                          <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">{balance.product.sku}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#17345f]">{balance.product.name}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{balance.product.unit}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-[#29466f]">{balance.quantity}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-[#a8670d]">{balance.reservedQuantity}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#16865b]">{available}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-[#496482]">{balance.product.safetyStock}</td>
                          <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${lowStock ? "bg-[#fff4df] text-[#a8670d]" : "bg-[#eaf8f1] text-[#16865b]"}`}>{lowStock ? "Low stock" : "Available"}</span></td>
                        </tr>
                      );
                    })}
                    {!selectedLocationBalances.length && <tr><td colSpan={8} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No stock is currently stored in this location.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {loading && (
              <div className="col-span-full rounded-2xl border border-dashed border-[#cbd8e8] px-5 py-12 text-center text-sm font-semibold text-[#7b8fa9]">
                Loading warehouse locations...
              </div>
            )}
            {!loading && (snapshot?.locations ?? []).map((location) => {
              const locationBalances = (snapshot?.balances ?? []).filter(
                (balance) =>
                  balance.location.id === location.id &&
                  (balance.quantity > 0 || balance.reservedQuantity > 0),
              );
              const available = locationBalances.reduce(
                (total, balance) => total + Math.max(0, balance.quantity - balance.reservedQuantity),
                0,
              );
              return (
                <article
                  key={location.id}
                  className="rounded-2xl border border-[#dce6f3] bg-[#fbfdff] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#155eef]">
                        {location.code}
                      </p>
                      <h4 className="mt-1 text-lg font-extrabold text-[#17345f]">
                        {location.name}
                      </h4>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${location.active === false ? "bg-[#eef2f7] text-[#7186a3]" : "bg-[#eaf8f1] text-[#16865b]"}`}>
                      {location.active === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-[#7186a3]">
                    {location.description || "No description provided."}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#eef5ff] p-3">
                      <p className="text-xl font-black text-[#155eef]">{available}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7186a3]">Available units</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocationDetails(location);
                        window.requestAnimationFrame(() => document.getElementById("selected-location-items")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                      }}
                      className="rounded-xl bg-[#f3f7fb] p-3 text-left transition hover:bg-[#e8f1ff] focus:outline-none focus:ring-2 focus:ring-[#155eef]"
                      aria-label={`View ${locationBalances.length} stocked items in ${location.name}`}
                      aria-expanded={selectedLocationDetails?.id === location.id}
                    >
                      <p className="text-xl font-black text-[#17345f]">{locationBalances.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7186a3]">Stocked items · View</p>
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-[#cbdcf5] bg-[#f7faff] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]">Actual stock in this location</p>
                      {locationBalances.length > 0 && <button type="button" onClick={() => { setSelectedLocationDetails(location); window.requestAnimationFrame(() => document.getElementById("selected-location-items")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="text-[10px] font-extrabold text-[#155eef] hover:underline">View full details</button>}
                    </div>
                    <div className="mt-2 space-y-2">
                      {locationBalances.slice(0, 3).map((balance) => {
                        const itemAvailable = Math.max(0, balance.quantity - balance.reservedQuantity);
                        return (
                          <div key={balance.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-extrabold text-[#17345f]">{balance.product.name}</p>
                              <p className="text-[9px] font-bold text-[#8294ac]">{balance.product.sku} · On hand {balance.quantity} · Reserved {balance.reservedQuantity}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-black text-[#155eef]">{itemAvailable} {balance.product.unit}</p>
                              <p className="text-[9px] font-bold uppercase text-[#8294ac]">available</p>
                            </div>
                          </div>
                        );
                      })}
                      {locationBalances.length > 3 && <button type="button" onClick={() => setSelectedLocationDetails(location)} className="w-full rounded-lg bg-[#eaf2ff] px-3 py-2 text-center text-[10px] font-extrabold text-[#155eef]">+{locationBalances.length - 3} more items · View all</button>}
                      {!locationBalances.length && <p className="rounded-lg bg-white px-3 py-4 text-center text-xs font-semibold text-[#8294ac]">No stock is currently stored in this location.</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e7edf5] pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLocation(location);
                        setShowLocationForm(true);
                        setLocationMessage("");
                        setLocationError(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-lg border border-[#b9d0f8] px-3 py-2 text-xs font-extrabold text-[#155eef]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingLocationId === location.id}
                      onClick={() => void handleDeleteLocation(location)}
                      className="rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] disabled:opacity-50"
                    >
                      {deletingLocationId === location.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
            {!loading && !(snapshot?.locations.length ?? 0) && (
              <div className="col-span-full rounded-2xl border border-dashed border-[#cbd8e8] px-5 py-12 text-center">
                <Warehouse size={28} className="mx-auto text-[#9aabc1]" />
                <p className="mt-3 text-sm font-extrabold text-[#496482]">No locations have been added</p>
                <p className="mt-1 text-xs text-[#8295af]">Add a warehouse location before receiving or moving stock.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {false && managerMode && page === "Suppliers" && (
        <section
          id="admin-suppliers"
          className="card-3d scroll-mt-28 rounded-[24px] bg-white"
        >
          <div className="flex flex-col gap-3 border-b border-[#e8eef6] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">
                Purchasing master
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-[#102a56]">
                Suppliers
              </h3>
              <p className="mt-1 text-sm text-[#7489a6]">
                Review supplier contacts, lead times and linked products.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-sm font-extrabold text-[#155eef]"
              >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingSupplier(null);
                  setShowSupplierForm(true);
                  setSupplierMessage("");
                  setSupplierError(false);
                }}
                className="h-11 rounded-xl bg-[#155eef] px-4 text-sm font-extrabold text-white"
              >
                + Add supplier
              </button>
            </div>
          </div>

          {supplierMessage && (
            <div role="status" className={`mx-6 mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${supplierError ? "border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "border-[#cfe0f8] bg-[#eef6ff] text-[#244f86]"}`}>
              {supplierMessage}
            </div>
          )}

          {showSupplierForm && (
            <form
              key={editingSupplier?.id ?? "new-supplier"}
              onSubmit={saveSupplier}
              className="mx-6 mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2 xl:grid-cols-4"
            >
              <div className="md:col-span-2 xl:col-span-4">
                <p className="font-extrabold text-[#17345f]">{editingSupplier ? "Edit supplier" : "Add supplier"}</p>
                <p className="mt-1 text-xs text-[#7b8fa9]">Enter the purchasing contact and ordering rules.</p>
              </div>
              <label className="text-xs font-extrabold text-[#49617f]">
                Supplier code
                <input name="code" required maxLength={30} defaultValue={editingSupplier?.code ?? ""} placeholder="SUP-001" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Supplier name
                <input name="name" required maxLength={120} defaultValue={editingSupplier?.name ?? ""} placeholder="Metro Supply" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Contact person
                <input name="contactName" maxLength={120} defaultValue={editingSupplier?.contactName ?? ""} placeholder="Amit Shah" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Email
                <input name="email" type="email" maxLength={160} defaultValue={editingSupplier?.email ?? ""} placeholder="orders@example.com" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Phone
                <input name="phone" maxLength={40} defaultValue={editingSupplier?.phone ?? ""} placeholder="9876543210" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Lead time (days)
                <input name="leadTimeDays" type="number" required min="0" defaultValue={editingSupplier?.leadTimeDays ?? 3} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Minimum order quantity
                <input name="minimumOrderQuantity" type="number" required min="1" defaultValue={editingSupplier?.minimumOrderQuantity ?? 1} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <label className="text-xs font-extrabold text-[#49617f] md:col-span-2 xl:col-span-1">
                Address
                <input name="address" maxLength={240} defaultValue={editingSupplier?.address ?? ""} placeholder="Ahmedabad" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold" />
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
                <button disabled={savingSupplier} className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60">
                  {savingSupplier ? "Saving..." : editingSupplier ? "Save changes" : "Add supplier"}
                </button>
                <button type="button" onClick={() => { setShowSupplierForm(false); setEditingSupplier(null); }} className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto p-6">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#cbd8e8] px-5 py-12 text-center text-sm font-semibold text-[#7b8fa9]">
                Loading suppliers...
              </div>
            ) : suppliers.length ? (
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-[0.12em] text-[#8295af]">
                    {['Code', 'Supplier', 'Contact', 'Lead time', 'Minimum order', 'Products', 'Status', 'Actions'].map((heading) => (
                      <th key={heading} className="whitespace-nowrap px-4 py-3.5 font-extrabold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => {
                    const linkedProducts = (snapshot?.products ?? []).filter(
                      (product) => product.supplierId === supplier.id,
                    ).length;
                    return (
                      <tr key={supplier.id} className="border-b border-[#eef2f7] last:border-0">
                        <td className="px-4 py-4 font-mono text-xs font-extrabold text-[#155eef]">{supplier.code}</td>
                        <td className="px-4 py-4 font-extrabold text-[#17345f]">{supplier.name}</td>
                        <td className="px-4 py-4 text-[#647b99]">
                          <p className="font-semibold text-[#496482]">{supplier.contactName || 'Not provided'}</p>
                          <p className="mt-1 text-xs">{supplier.email || supplier.phone || 'No contact details'}</p>
                        </td>
                        <td className="px-4 py-4 font-bold text-[#496482]">{supplier.leadTimeDays} days</td>
                        <td className="px-4 py-4 font-bold text-[#496482]">{supplier.minimumOrderQuantity}</td>
                        <td className="px-4 py-4 font-extrabold text-[#17345f]">{linkedProducts}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${supplier.active ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#eef2f7] text-[#7186a3]"}`}>
                            {supplier.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSupplier(supplier);
                                setShowSupplierForm(true);
                                setSupplierMessage("");
                                setSupplierError(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="rounded-lg border border-[#b9d0f8] px-3 py-2 text-xs font-extrabold text-[#155eef]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingSupplierId === supplier.id}
                              onClick={() => void handleDeleteSupplier(supplier)}
                              className="rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] disabled:opacity-50"
                            >
                              {deletingSupplierId === supplier.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cbd8e8] px-5 py-12 text-center">
                <Boxes size={28} className="mx-auto text-[#9aabc1]" />
                <p className="mt-3 text-sm font-extrabold text-[#496482]">No suppliers have been added</p>
                <p className="mt-1 text-xs text-[#8295af]">Add supplier records before assigning products for purchasing.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* User Access section */}
      {!managerMode && (
        <section
          id="admin-user-access"
          className="card-3d scroll-mt-28 rounded-[22px] bg-white p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#102a56]">
                User access and permissions
              </h3>
              <p className="mt-1 text-sm text-[#7489a6]">
                Manage accounts, roles and access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSystemUser(null);
                setShowUserForm(true);
                setUserMessage("");
              }}
              className="rounded-xl bg-[#155eef] px-4 py-2.5 text-sm font-extrabold text-white"
            >
              + Add user
            </button>
          </div>

          {userMessage && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-[#cfe0f8] bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#244f86]"
            >
              {userMessage}
            </div>
          )}

          {showUserForm && (
            <form
              key={editingSystemUser?.id ?? "new-system-user"}
              onSubmit={saveSystemUser}
              className="mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2"
            >
              <label className="text-xs font-extrabold text-[#49617f]">
                Employee ID
                <input
                  name="employeeId"
                  required
                  defaultValue={editingSystemUser?.employeeId ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Full name
                <input
                  name="displayName"
                  required
                  defaultValue={editingSystemUser?.displayName ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editingSystemUser?.email ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Role
                <select
                  name="role"
                  required
                  defaultValue={editingSystemUser?.role ?? "WORKER"}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                >
                  <option value="WORKER">Warehouse Executive</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Shift
                <select
                  name="shift"
                  defaultValue={editingSystemUser?.shift ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                >
                  <option value="">Not assigned</option>
                  <option value="Day">Day</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </label>
              <label className="text-xs font-extrabold text-[#49617f]">
                Zone
                <input
                  name="warehouseZone"
                  defaultValue={editingSystemUser?.warehouseZone ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                />
              </label>
              {!editingSystemUser && (
                <label className="text-xs font-extrabold text-[#49617f]">
                  Temporary password
                  <input
                    name="temporaryPassword"
                    type="password"
                    required
                    minLength={8}
                    className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
                  />
                </label>
              )}
              <div className="flex items-end gap-2">
                <button
                  disabled={savingUser}
                  className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {savingUser
                    ? "Saving..."
                    : editingSystemUser
                      ? "Save"
                      : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingSystemUser(null);
                  }}
                  className="h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(
              [
                [Warehouse, "Warehouse Executive", "Voice entry and transactions"],
                [ClipboardCheck, "Manager", "Approvals and master data"],
                [Settings, "Administrator", "User access and system health"],
              ] as Array<[typeof Warehouse, string, string]>
            ).map(([Icon, title, desc]) => (
              <div
                key={title}
                className="rounded-2xl border border-[#e2e9f3] bg-[#f8fafc] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="font-extrabold text-[#17345f]">{title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#16865b]">
                      Keycloak controlled
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-[#7186a3]">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[#e8edf5] pt-5">
            <h4 className="font-extrabold text-[#17345f]">
              Real-time account controls
            </h4>
            <p className="mt-1 text-xs text-[#7b8fa9]">
              Deactivation signs the user out and blocks API access immediately.
            </p>

            {resetPasswordUser && (
              <form
                onSubmit={saveResetPassword}
                className="mt-4 rounded-2xl border border-[#f0cf8d] bg-[#fffaf0] p-4"
              >
                <label className="text-xs font-extrabold text-[#6f582b]">
                  New password for {resetPasswordUser.displayName}
                  <input
                    name="temporaryPassword"
                    type="password"
                    required
                    minLength={8}
                    className="mt-2 h-11 w-full rounded-xl border border-[#e4cf9e] bg-white px-3 text-sm font-semibold"
                  />
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={updatingUserId === resetPasswordUser.id}
                    className="rounded-xl bg-[#a46009] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(null)}
                    className="rounded-xl border border-[#dccda9] bg-white px-4 py-2.5 text-sm font-bold text-[#6f582b]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {systemUsers.map((user) => (
                <article
                  key={user.id}
                  className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-[#17345f]">
                        {user.displayName}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#7b8fa9]">
                        {user.employeeId} &middot;{" "}
                        {user.role.replaceAll("_", " ")}
                      </p>
                      {user.role === "WORKER" && (
                        <p className="mt-2 text-xs font-semibold text-[#55708f]">
                          {user.shift ?? "No shift"} &middot;{" "}
                          {user.warehouseZone ?? "No zone"}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                        user.active
                          ? "bg-[#eaf8f1] text-[#16865b]"
                          : "bg-[#eef1f5] text-[#75859b]"
                      }`}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {user.role === "ADMINISTRATOR" ? (
                    <p className="mt-4 text-xs font-extrabold text-[#7b8fa9]">
                      Protected Administrator account
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSystemUser(user);
                          setShowUserForm(true);
                          setUserMessage("");
                        }}
                        className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#155eef]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPasswordUser(user);
                          setUserMessage("");
                        }}
                        className="rounded-lg border border-[#e0c37e] px-3 py-2 text-xs font-extrabold text-[#915807]"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        disabled={updatingUserId === user.id}
                        onClick={() => void changeSystemUserStatus(user)}
                        className={`rounded-lg border px-3 py-2 text-xs font-extrabold disabled:opacity-50 ${
                          user.active
                            ? "border-[#efb5b5] text-[#b83f3f]"
                            : "border-[#b9decf] text-[#16865b]"
                        }`}
                      >
                        {updatingUserId === user.id
                          ? "Updating..."
                          : user.active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {!managerMode && (
        <section
          id="admin-system-health"
          className="card-3d scroll-mt-28 rounded-[22px] bg-white p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#102a56]">
                System health
              </h3>
              <p className="mt-1 text-sm text-[#7489a6]">
                Live monitoring for all application services.
              </p>
              {systemHealth && (
                <p
                  data-testid="health-last-checked"
                  className="mt-1.5 text-xs font-semibold text-[#8295af]"
                >
                  Last checked:{" "}
                  {new Intl.DateTimeFormat("en", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date(systemHealth.checkedAt))}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void refreshHealth()}
              disabled={healthLoading}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-[#c8d6e8] px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:border-[#155eef] hover:text-[#155eef] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={14}
                className={healthLoading ? "animate-spin" : ""}
              />
              {healthLoading ? "Checking..." : "Refresh health"}
            </button>
          </div>

          {healthError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[#efb5b5] bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[#a73737]"
            >
              {healthError}
            </div>
          )}

          {healthItems.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d5e1f0] bg-[#fbfcfe] px-5 py-8 text-center">
              <p className="text-sm font-extrabold text-[#24466f]">
                {loading || healthLoading
                  ? "Loading health data..."
                  : "System health data unavailable"}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {healthItems.map((item) => {
                const tone = healthTone(item.status);
                return (
                  <div
                    key={item.key ?? item.label}
                    className={`rounded-2xl border p-4 ${tone.card}`}
                  >
                    <div className="flex items-center gap-3">
                      <StatusPulse status={tone.pulse} />
                      <p className="font-extrabold text-[#17345f]">
                        {item.label}
                      </p>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-extrabold ${tone.badge}`}
                      >
                        {tone.label}
                      </span>
                    </div>
                    {item.detail && (
                      <p className="mt-2 text-xs font-semibold text-[#7b8fa9]">
                        {item.detail}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8295af]">
                      Last checked · {lastCheckedLabel ?? "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Manager-mode warehouse controls */}
      {managerMode && (
        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-sm font-semibold text-[#a73737]">
              {error}
            </div>
          )}

          <section
            id="admin-items"
            className="card-3d scroll-mt-28 rounded-[24px] bg-white"
          >
            <div className="flex flex-col gap-5 border-b border-[#e8eef6] p-6">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">
                  Warehouse controls
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-[#102a56]">
                  Products and locations
                </h3>
                <p className="mt-1 text-sm text-[#7489a6]">
                  Manage catalogue and warehouse locations.
                </p>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-8 text-center text-sm font-extrabold text-[#496482]">
                  Loading data...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-[#dce6f3] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]">
                        <PackageCheck size={19} />
                      </span>
                      <div>
                        <p className="font-extrabold text-[#17345f]">Products</p>
                        <p className="text-[10px] text-[#8295af]">
                          {snapshot?.products.length ?? 0} items
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#dce6f3] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]">
                        <Warehouse size={19} />
                      </span>
                      <div>
                        <p className="font-extrabold text-[#17345f]">Locations</p>
                        <p className="text-[10px] text-[#8295af]">
                          {snapshot?.locations.length ?? 0} active
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#dce6f3] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]">
                        <Truck size={19} />
                      </span>
                      <div>
                        <p className="font-extrabold text-[#17345f]">Suppliers</p>
                        <p className="text-[10px] text-[#8295af]">
                          {suppliers.filter((s) => s.active).length} active
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Truck({ size = 19, className = "" }: { size?: number; className?: string }) {
  return <Boxes size={size} className={className} />;
}
