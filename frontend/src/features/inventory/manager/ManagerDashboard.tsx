"use client";

import { Fragment, useState, useEffect, useMemo, type FormEvent } from "react";
import { AlertTriangle, ArrowRightLeft, Boxes, Camera, CheckCircle2, ChevronDown, ClipboardCheck, Download, Eye, Flag, PackageCheck, Search, Trash2, X } from "lucide-react";
import { mapLowStock, fetchInventorySnapshot, fetchInventoryTasks, fetchTaskAssignees, refreshReorderDrafts, cancelInventoryTransaction, approveInventoryTransaction, rejectInventoryTransaction, requestInventoryRecount, createInventoryTask, createCycleCountPlan, fetchCycleCountPlans, fetchCycleCountPlan, deleteInventoryTask, type ApiInventoryTask, type ApiTaskAssignee, type ApiReorderDraft, type ApiTransaction, type InventorySnapshot, type ApiCycleCountPlan, type ApiCycleCountPlanDetail } from "../api/inventory-api";
import { taskTypeLabel, formatTaskDue, formatClock, formatCountPeriod, resolveManagerPage, defaultTaskDue, priorityTone, taskStatusTone } from "../shared/helpers";
import { MetricCard } from "../shared/MetricCard";
import { WarehouseHero } from "../shared/WarehouseHero";
import { AdministratorDashboard } from "../administrator/AdministratorDashboard";
import { DiscrepanciesPage } from "./DiscrepanciesPage";
import { TransactionEvidence } from "./TransactionEvidence";

const currentCycleCountPeriod = new Date().toISOString().slice(0, 7);

function monthEndDueValue(periodMonth: string) {
  const [year, month] = periodMonth.split("-").map(Number);
  const finalDay = new Date(year, month, 0).getDate();
  return `${periodMonth}-${String(finalDay).padStart(2, "0")}T17:00`;
}

export function ManagerDashboard({
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
  const [damageAdjustmentReasons, setDamageAdjustmentReasons] = useState<Record<string, string>>({});
  const [reorderActionId, setReorderActionId] = useState<string | null>(null);
  const [reorderMessage, setReorderMessage] = useState("");
  const [purchaseQuery, setPurchaseQuery] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [purchaseSort, setPurchaseSort] = useState<"severity" | "name">("severity");
  const [auditAction, setAuditAction] = useState("ALL");
  const [auditStatus, setAuditStatus] = useState("ALL");
  const [selectedAuditTransaction, setSelectedAuditTransaction] =
    useState<ApiTransaction | null>(null);
  const [cancellingTransactionId, setCancellingTransactionId] =
    useState<string | null>(null);
  const [managerTasks, setManagerTasks] = useState<ApiInventoryTask[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<ApiTaskAssignee[]>([]);
  const [taskMessage, setTaskMessage] = useState("");
  const [taskMessageTone, setTaskMessageTone] = useState<"info" | "error">("info");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [managerTaskView, setManagerTaskView] = useState<"OPEN" | "COMPLETED">("OPEN");
  const [taskDueValue, setTaskDueValue] = useState(defaultTaskDue);
  const [plannedTaskType, setPlannedTaskType] = useState("RECEIVE");
  const [plannedProductId, setPlannedProductId] = useState("");
  const [plannedLocationId, setPlannedLocationId] = useState("");
  const [plannedCycleLocationIds, setPlannedCycleLocationIds] = useState<string[]>([]);
  const [plannedTransferQuantity, setPlannedTransferQuantity] = useState("");
  const [plannedTransferSourceId, setPlannedTransferSourceId] = useState("");
  const [plannedTransferDestinationId, setPlannedTransferDestinationId] = useState("");
  const [schedulingTasks, setSchedulingTasks] = useState(false);
  const [scheduledLocationIds, setScheduledLocationIds] = useState<string[]>([]);
  const [blindCycleCount, setBlindCycleCount] = useState(true);
  const [cycleCountInstructions, setCycleCountInstructions] = useState("");
  const [cycleCountAssigneeId, setCycleCountAssigneeId] = useState("");
  const [cycleCountPeriod, setCycleCountPeriod] = useState(currentCycleCountPeriod);
  const [cycleCountDueValue, setCycleCountDueValue] = useState(() => monthEndDueValue(currentCycleCountPeriod));
  const [cycleCountPlans, setCycleCountPlans] = useState<ApiCycleCountPlan[]>([]);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [openPlanDetail, setOpenPlanDetail] = useState<ApiCycleCountPlanDetail | null>(null);
  const [loadingPlanDetail, setLoadingPlanDetail] = useState(false);
  const [healthMounted, setHealthMounted] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState("");
  const [auxiliaryWarning, setAuxiliaryWarning] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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

  function applyReorderDrafts(drafts: ApiReorderDraft[]) {
    setReorderDrafts(drafts);
  }

  function retryLiveData() {
    setSnapshotLoading(true);
    setSnapshotError("");
    setAuxiliaryWarning("");
    setReloadKey((value) => value + 1);
  }

  useEffect(() => {
    let active = true;
    void Promise.allSettled([
      fetchInventorySnapshot(),
      refreshReorderDrafts(),
      fetchInventoryTasks(),
      fetchTaskAssignees(),
      fetchCycleCountPlans(),
    ]).then(([inventory, drafts, tasks, assignees, plans]) => {
      if (!active) return;
      if (inventory.status === "fulfilled") {
        setSnapshot(inventory.value);
        setSnapshotError("");
      } else {
        setSnapshotError("Live inventory data could not be loaded. Check the API and PostgreSQL services, then retry.");
      }
      if (drafts.status === "fulfilled") applyReorderDrafts(drafts.value);
      if (tasks.status === "fulfilled") setManagerTasks(tasks.value);
      if (assignees.status === "fulfilled") setTaskAssignees(assignees.value);
      if (plans.status === "fulfilled") setCycleCountPlans(plans.value);
      const secondaryFailures = [drafts, tasks, assignees, plans].filter((result) => result.status === "rejected").length;
      setAuxiliaryWarning(secondaryFailures > 0 ? `${secondaryFailures} supporting data section${secondaryFailures === 1 ? " is" : "s are"} temporarily unavailable.` : "");
      setSnapshotLoading(false);
    });

    const refreshLiveData = async () => {
      if (!active || document.visibilityState === "hidden") return;
      const [tasks, inventory, drafts, plans] = await Promise.allSettled([
          fetchInventoryTasks(),
          fetchInventorySnapshot(),
          refreshReorderDrafts(),
          fetchCycleCountPlans(),
      ]);
      if (!active) return;
      if (tasks.status === "fulfilled") setManagerTasks(tasks.value);
      if (inventory.status === "fulfilled") {
        setSnapshot(inventory.value);
        setSnapshotError("");
        setAuxiliaryWarning("");
      } else {
        setAuxiliaryWarning("Automatic live refresh could not connect. The last successfully loaded data remains visible.");
      }
      if (drafts.status === "fulfilled") setReorderDrafts(drafts.value);
      if (plans.status === "fulfilled") setCycleCountPlans(plans.value);
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
  }, [reloadKey]);

  const stockHealth = useMemo(() => {
    const balances = snapshot?.balances ?? [];
    const productStock = new Map<string, { available: number; safety: number }>();
    for (const balance of balances) {
      const current = productStock.get(balance.product.id) ?? {
        available: 0,
        safety: balance.product.safetyStock,
      };
      current.available += Math.max(0, balance.quantity);
      productStock.set(balance.product.id, current);
    }
    let critical = 0;
    let low = 0;
    let healthy = 0;
    for (const { available, safety } of productStock.values()) {
      if (available <= Math.max(1, Math.floor(safety / 2))) critical += 1;
      else if (available < safety) low += 1;
      else healthy += 1;
    }
    const total = productStock.size || 1;
    return {
      critical,
      low,
      healthy,
      total: productStock.size,
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
  const displayedLowStock = snapshot ? mapLowStock(snapshot.balances) : [];
  const openTaskCount = managerTasks.filter((task) => task.status === "OPEN" || task.status === "IN_PROGRESS").length;
  const completedTaskCount = managerTasks.filter((task) => task.status === "COMPLETED").length;
  const displayedManagerTasks = managerTasks
    .filter((task) =>
      managerTaskView === "OPEN"
        ? task.status === "OPEN" || task.status === "IN_PROGRESS"
        : task.status === "COMPLETED",
    )
    .slice(0, 12);
  const transferSourceBalances = useMemo(() => {
    if (!snapshot || !plannedProductId) return [];
    return snapshot.balances
      .filter(
        (balance) =>
          balance.product.id === plannedProductId &&
          balance.quantity > 0,
      )
      .sort((left, right) =>
        left.location.name.localeCompare(right.location.name),
      );
  }, [snapshot, plannedProductId]);
  const plannedTaskLocationOptions = useMemo(() => {
    if (!snapshot || !plannedProductId) return [];

    const product = snapshot.products.find(
      (entry) => entry.id === plannedProductId,
    );
    if (!product) return [];

    return snapshot.locations
      .map((location) => {
        const balance = snapshot.balances.find(
          (entry) =>
            entry.product.id === plannedProductId &&
            entry.location.id === location.id,
        );
        return {
          location,
          available: Math.max(0, balance?.quantity ?? 0),
          unit: product.unit,
        };
      })
      .filter(
        (entry) =>
          plannedTaskType === "RECEIVE" || entry.available > 0,
      )
      .sort((left, right) =>
        left.location.name.localeCompare(right.location.name),
      );
  }, [snapshot, plannedProductId, plannedTaskType]);
  const selectedTransferSourceBalance = transferSourceBalances.find(
    (balance) => balance.location.id === plannedTransferSourceId,
  );
  const selectedTransferDestinationBalance = snapshot?.balances.find(
    (balance) =>
      balance.product.id === plannedProductId &&
      balance.location.id === plannedTransferDestinationId,
  );
  const selectedTransferProduct = snapshot?.products.find(
    (product) => product.id === plannedProductId,
  );
  const transferQuantity = Number(plannedTransferQuantity) || 0;
  const cycleCountPlanPreview = useMemo(() => {
    const balances = (snapshot?.balances ?? []).filter(
      (balance) => scheduledLocationIds.includes(balance.location.id) && balance.quantity > 0,
    );
    return {
      tasks: balances.length,
      locations: new Set(balances.map((balance) => balance.location.id)).size,
      items: new Set(balances.map((balance) => balance.product.id)).size,
    };
  }, [snapshot, scheduledLocationIds]);
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

  const lowStockDraftCount = reorderDrafts.filter(
    (draft) => draft.currentStock < draft.safetyStock,
  ).length;
  const visibleReorderDrafts = useMemo(() => {
    const query = purchaseQuery.trim().toLowerCase();
    return reorderDrafts
      .filter((draft) => draft.currentStock < draft.safetyStock)
      .filter((draft) => {
        if (query === "") return true;
        return (
          draft.product.name.toLowerCase().includes(query) ||
          draft.product.sku.toLowerCase().includes(query)
        );
      })
      .filter((draft) =>
        purchaseFilter === "ALL"
          ? true
          : purchaseFilter === "OUT"
            ? draft.currentStock <= 0
            : draft.currentStock > 0,
      )
      .sort((left, right) => {
        if (purchaseSort === "name") {
          return left.product.name.localeCompare(right.product.name);
        }
        const leftSeverity = left.currentStock / Math.max(1, left.safetyStock);
        const rightSeverity =
          right.currentStock / Math.max(1, right.safetyStock);
        return (
          leftSeverity - rightSeverity ||
          left.product.name.localeCompare(right.product.name)
        );
      });
  }, [reorderDrafts, purchaseQuery, purchaseFilter, purchaseSort]);
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
      if (transaction.action === "SHIP") day.outgoing += transaction.quantity;
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
  const isStockAdjustment = (transaction: ApiTransaction) =>
    transaction.referenceNumber?.startsWith("ADJUSTMENT-") === true ||
    transaction.notes?.startsWith("Administrator correction") === true ||
    transaction.action === "DAMAGE";
  const selectedAdjustmentReason = selectedAuditTransaction?.reviewNotes?.trim() ||
    (selectedAuditTransaction?.notes?.includes("Reason:")
      ? selectedAuditTransaction.notes.split("Reason:").slice(1).join("Reason:").trim()
      : "No reason recorded.");

  function exportAuditHistory() {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["Transaction ID", "Date", "Action", "Product", "Quantity", "Source", "Destination", "Status", "Created by", "Approved by", "Reference", "Notes", "Review notes"], ...auditTransactions.map((transaction) => [transaction.id, transaction.createdAt, transaction.action, transaction.product.name, transaction.quantity, transaction.sourceLocation?.name ?? "", transaction.destinationLocation?.name ?? "", transaction.status, transaction.createdBy?.displayName ?? "", transaction.approvedBy?.displayName ?? "", transaction.referenceNumber ?? "", transaction.notes ?? "", transaction.reviewNotes ?? ""])];
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
    const damageAdjustmentReason = damageAdjustmentReasons[transaction.id]?.trim() ?? "";
    if (transaction.action === "DAMAGE" && decision === "recount") {
      setManagerMessage("Damage transactions cannot be sent for recount. Approve with an adjustment reason or reject the transaction.");
      return;
    }
    if (transaction.action === "DAMAGE" && decision === "approve" && !damageAdjustmentReason) {
      setManagerMessage("Enter an adjustment reason before approving damaged stock.");
      return;
    }
    setReviewingId(transaction.id);
    setManagerMessage("");
    try {
      if (decision === "approve") {
        await approveInventoryTransaction(
          transaction.id,
          transaction.action === "DAMAGE"
            ? damageAdjustmentReason
            : "Approved after manager review.",
        );
        if (transaction.action === "DAMAGE") {
          setDamageAdjustmentReasons((current) => {
            const next = { ...current };
            delete next[transaction.id];
            return next;
          });
        }
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
    } catch (error) {
      setManagerMessage(
        error instanceof Error
          ? error.message
          : "The manager decision could not be completed. Refresh the inventory data and try again.",
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
      const taskInput = {
        type: plannedTaskType,
        priority: String(data.get("priority")),
        title: String(data.get("title")),
        description: String(data.get("description") ?? "") || undefined,
        dueAt: String(data.get("dueAt") ?? "") || undefined,
        assignedToId: String(data.get("assignedToId")),
        productId: plannedProductId || undefined,
        locationId:
          plannedTaskType === "TRANSFER"
            ? undefined
            : plannedLocationId || undefined,
        quantity:
          plannedTaskType === "TRANSFER" ? transferQuantity : undefined,
        sourceLocationId:
          plannedTaskType === "TRANSFER"
            ? plannedTransferSourceId
            : undefined,
        destinationLocationId:
          plannedTaskType === "TRANSFER"
            ? plannedTransferDestinationId
            : undefined,
      };
      if (plannedTaskType === "CYCLE_COUNT") {
        if (!plannedCycleLocationIds.length) {
          throw new Error("Select at least one stocked location for the cycle count.");
        }
        await Promise.all(
          plannedCycleLocationIds.map((locationId) =>
            createInventoryTask({ ...taskInput, locationId }),
          ),
        );
      } else {
        await createInventoryTask(taskInput);
      }
      setTaskMessage(
        plannedTaskType === "CYCLE_COUNT"
          ? `${plannedCycleLocationIds.length} cycle count task${plannedCycleLocationIds.length === 1 ? "" : "s"} assigned successfully.`
          : "Task assigned successfully and added to the Warehouse Executive queue.",
      );
      setTaskMessageTone("info");
      form.reset();
      setTaskDueValue(defaultTaskDue());
      setPlannedTaskType("RECEIVE");
      setPlannedProductId("");
      setPlannedLocationId("");
      setPlannedCycleLocationIds([]);
      setPlannedTransferQuantity("");
      setPlannedTransferSourceId("");
      setPlannedTransferDestinationId("");
      setManagerTasks(await fetchInventoryTasks());
    } catch (error) {
      setTaskMessageTone("error");
      setTaskMessage(
        error instanceof Error ? error.message : "Task could not be assigned.",
      );
    }
  }

  async function handleCancelTask(task: ApiInventoryTask) {
    if (!window.confirm(`Cancel “${task.title}”? The linked pending transaction will be cancelled without changing inventory. The audit record will be kept.`)) return;
    setDeletingTaskId(task.id);
    setTaskMessage("");
    try {
      await deleteInventoryTask(task.id);
      const refreshedTasks = await fetchInventoryTasks();
      setManagerTasks(refreshedTasks.filter((entry) => entry.status !== "CANCELLED"));
      setTaskMessageTone("info");
      setTaskMessage("Task cancelled. No inventory changed; the audit record was kept as CANCELLED.");
    } catch (error) {
      setTaskMessageTone("error");
      setTaskMessage(error instanceof Error ? error.message : "The task could not be cancelled.");
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function scheduleLocationCycleCounts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaskMessage("");
    setSchedulingTasks(true);
    const data = new FormData(event.currentTarget);
    const assigneeId = String(data.get("schedAssigneeId") ?? "");
    const dueAt = String(data.get("schedDueAt") ?? "");
    const priority = String(data.get("schedPriority") ?? "MEDIUM");
    const instructions = String(data.get("schedInstructions") ?? "").trim() || undefined;
    if (scheduledLocationIds.length === 0 || cycleCountPlanPreview.tasks === 0) {
      setTaskMessageTone("error");
      setTaskMessage(
        snapshot && scheduledLocationIds.length > 0
          ? "No products with stock were found at the selected locations."
          : "Stock data could not be loaded. Refresh the page and try again.",
      );
      setSchedulingTasks(false);
      return;
    }
    try {
      const result = await createCycleCountPlan({
        periodMonth: cycleCountPeriod,
        locationIds: scheduledLocationIds,
        assignedToId: assigneeId,
        priority,
        dueAt: dueAt || undefined,
        blindCount: blindCycleCount,
        instructions,
      });
      setTaskMessageTone("info");
      setTaskMessage(
        result.idempotent
          ? `${result.planNumber}: this exact plan already exists — no duplicate tasks were created.`
          : `${result.planNumber}: scheduled ${result.createdTasks} separate count task${result.createdTasks === 1 ? "" : "s"} across ${result.selectedLocations} location${result.selectedLocations === 1 ? "" : "s"}.${result.skippedDuplicates ? ` Skipped ${result.skippedDuplicates} duplicate task${result.skippedDuplicates === 1 ? "" : "s"} for this period.` : ""}`,
      );
      setScheduledLocationIds([]);
      setCycleCountAssigneeId("");
      setCycleCountInstructions("");
      const [tasks, plans] = await Promise.all([fetchInventoryTasks(), fetchCycleCountPlans()]);
      setManagerTasks(tasks);
      setCycleCountPlans(plans);
      setOpenPlanId(result.id);
      setOpenPlanDetail(null);
      window.scrollTo({ top: document.getElementById("manager-cycle-count-plans")?.offsetTop ?? 0, behavior: "smooth" });
    } catch (error) {
      setTaskMessageTone("error");
      setTaskMessage(
        error instanceof Error ? error.message : "Cycle counts could not be scheduled.",
      );
    } finally {
      setSchedulingTasks(false);
    }
  }

  async function openCycleCountPlan(planId: string) {
    if (openPlanId === planId && openPlanDetail) {
      setOpenPlanId(null);
      setOpenPlanDetail(null);
      return;
    }
    setOpenPlanId(planId);
    setLoadingPlanDetail(true);
    try {
      setOpenPlanDetail(await fetchCycleCountPlan(planId));
    } catch {
      setOpenPlanDetail(null);
    } finally {
      setLoadingPlanDetail(false);
    }
  }

  return (
    <div className="dashboard-content page-dashboard manager-dashboard" data-active-page={page}>
      {page === "Discrepancies" && (
        <DiscrepanciesPage />
      )}

      {snapshotError && (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#f0b8b8] bg-[#fff3f3] px-5 py-4 text-sm font-semibold text-[#9f3030] sm:flex-row sm:items-center sm:justify-between">
          <span>{snapshotError}</span>
          <button type="button" onClick={retryLiveData} className="w-fit rounded-xl bg-[#b63b3b] px-4 py-2 text-xs font-extrabold text-white">Retry live data</button>
        </div>
      )}
      {auxiliaryWarning && !snapshotError && (
        <div role="status" className="mb-5 rounded-2xl border border-[#ead59d] bg-[#fff9e9] px-5 py-3 text-sm font-semibold text-[#8b6008]">{auxiliaryWarning}</div>
      )}

      <section id="manager-overview-hero" className="manager-command-hero hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7">
        <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#bcd2ff]">AI warehouse command</p>
            <h1 className="mt-2 max-w-2xl text-[25px] font-black tracking-[-0.035em] sm:text-[32px]">Live inventory control, made visual.</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#c8d9f7]">Monitor stock, review exceptions and keep warehouse work moving from one clear workspace.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="command-chip"><span className="command-chip-dot" /> Live stock</span>
              <span className="command-chip">AI assisted</span>
              <span className="command-chip">Audit protected</span>
            </div>
          </div>
          <div className="manager-warehouse-visual">
            <WarehouseHero variant="manager" className="h-44 w-full" />
            <div className="manager-live-panel">
              <span className="manager-live-pulse" />
              <div><strong>{snapshotLoading ? "…" : snapshot ? snapshot.products.length : "—"}</strong><small>{snapshot ? "products monitored" : "live data unavailable"}</small></div>
            </div>
          </div>
        </div>
      </section>

      <div id="manager-overview-metrics" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Active items"
          value={snapshotLoading ? "…" : snapshot ? String(snapshot.products.length) : "—"}
          detail={snapshot ? "Loaded from PostgreSQL" : "Live inventory unavailable"}
          icon={Boxes}
          onClick={() => { onNavigate("Catalog"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
        <MetricCard
          label="Pending approvals"
          value={snapshotLoading ? "…" : snapshot ? String(pendingApprovals) : "—"}
          detail={snapshot ? "Warehouse Executive-confirmed transactions requiring review" : "Live transactions unavailable"}
          icon={ClipboardCheck}
          tone="amber"
          onClick={() => navigateToTransactions("needsReview")}
        />
        <MetricCard
          label="Low-stock items"
          value={snapshotLoading ? "…" : snapshot ? String(displayedLowStock.length) : "—"}
          detail={snapshot ? "Calculated from safety levels" : "Live stock levels unavailable"}
          icon={AlertTriangle}
          tone="violet"
          onClick={() => {
            onNavigate("Purchase Items");
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
          <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold ${snapshot ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#fff0f0] text-[#a73737]"}`}><span className={`h-2 w-2 rounded-full ${snapshot ? "animate-pulse bg-[#20ad76]" : "bg-[#d95c5c]"}`} />{snapshotLoading ? "Loading" : snapshot ? "Live data" : "Data unavailable"}</span>
        </div>
        {!snapshot ? (
          <div className="px-6 py-12 text-center">
            <AlertTriangle size={28} className="mx-auto text-[#c04a4a]" />
            <p className="mt-3 text-sm font-extrabold text-[#24466f]">Live stock data is unavailable</p>
            <p className="mt-1 text-xs text-[#8093ab]">The dashboard will not display false zero balances. Start or reconnect the API and PostgreSQL services.</p>
            <button type="button" onClick={retryLiveData} className="mt-4 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white">Retry live data</button>
          </div>
        ) : <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr_1.1fr]">
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
              <button type="button" onClick={() => onNavigate("Purchase Items")} className="rounded-lg border border-[#e0c37e] px-2.5 py-1.5 text-[10px] font-extrabold text-[#915807] transition hover:bg-[#fff4df]">View purchase items</button>
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
        </div>}
      </section>

      <section id="manager-overview-approvals" className="mt-6 overflow-hidden rounded-[24px] border border-[#e8d5a8] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
        <div className="flex flex-col gap-3 border-b border-[#f0e5cf] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#d47b08]">Action required</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Pending approvals</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Warehouse Executive-confirmed transactions waiting for your decision.</p>
          </div>
          <button type="button" disabled={!snapshot} onClick={() => navigateToTransactions("needsReview")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(212,123,8,0.25)] transition hover:bg-[#b86806] disabled:cursor-not-allowed disabled:opacity-50">Review all {snapshot ? pendingApprovals : "—"} <ChevronDown size={15} className="-rotate-90" /></button>
        </div>
        {!snapshot ? (
          <div className="px-6 py-10 text-center">
            <AlertTriangle size={26} className="mx-auto text-[#c04a4a]" />
            <p className="mt-3 text-sm font-extrabold text-[#24466f]">Approval data is unavailable</p>
            <p className="mt-1 text-xs text-[#8093ab]">No approval count is shown until live transaction data reconnects.</p>
          </div>
        ) : pendingReviewTransactions.length === 0 ? (
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
            <p className="mt-1 text-xs text-[#8294ac]">Assign receiving, transfers, stock checks, damage inspections, or a one-product cycle count. Use the month-end plan below for monthly and multi-location counts.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />Queue syncs live</span>
        </div>

        {taskMessage && (
          <div role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${taskMessageTone === "error" ? "bg-[#fff0f0] text-[#a73737]" : "bg-[#eef6ff] text-[#244f86]"}`}>
            {taskMessage}
          </div>
        )}

        <form onSubmit={savePlannedTask} className="mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-extrabold text-[#49617f]">Task type<select name="type" required value={plannedTaskType} onChange={(event) => { setPlannedTaskType(event.target.value); setPlannedProductId(""); setPlannedLocationId(""); setPlannedCycleLocationIds([]); setPlannedTransferQuantity(""); setPlannedTransferSourceId(""); setPlannedTransferDestinationId(""); }} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3">{["RECEIVE","PICK","TRANSFER","CYCLE_COUNT","STOCK_VERIFY","DAMAGE_INSPECTION"].map((value)=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Priority<select name="priority" required defaultValue="MEDIUM" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3">{["LOW","MEDIUM","HIGH","URGENT"].map((value)=><option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Assign to<select name="assignedToId" required defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="" disabled>Select executive</option>{taskAssignees.map((user)=><option key={user.id} value={user.id}>{user.displayName} — {[user.shift, user.warehouseZone].filter(Boolean).join(" · ") || user.employeeId}</option>)}</select></label>
          <label className="text-xs font-extrabold text-[#49617f]">Due date and time<input name="dueAt" type="datetime-local" value={taskDueValue} onChange={(event)=>setTaskDueValue(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
          <label className="text-xs font-extrabold text-[#49617f] md:col-span-2">Task title<input name="title" required maxLength={150} placeholder={plannedTaskType === "TRANSFER" ? "Move stock to another location" : plannedTaskType === "CYCLE_COUNT" ? "Count product at its storage location" : "Enter a clear task title"} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
          <label className="text-xs font-extrabold text-[#49617f]">Product<select name="productId" required={plannedTaskType === "TRANSFER" || plannedTaskType === "CYCLE_COUNT"} value={plannedProductId} onChange={(event) => { setPlannedProductId(event.target.value); setPlannedLocationId(""); setPlannedCycleLocationIds([]); setPlannedTransferQuantity(""); setPlannedTransferSourceId(""); setPlannedTransferDestinationId(""); }} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="">{plannedTaskType === "TRANSFER" || plannedTaskType === "CYCLE_COUNT" ? "Select product" : "Not required"}</option>{snapshot?.products.map((product)=><option key={product.id} value={product.id}>{product.sku} — {product.name}</option>)}</select></label>
          {plannedTaskType === "CYCLE_COUNT" ? <fieldset className="rounded-xl border border-[#cbdcf5] bg-white p-3 md:col-span-2 xl:col-span-2">
            <legend className="px-2 text-xs font-extrabold text-[#49617f]">Locations to count</legend>
            {!plannedProductId ? <p className="px-2 py-2 text-xs font-semibold text-[#8294ac]">Select a product first.</p> : plannedTaskLocationOptions.length === 0 ? <p className="px-2 py-2 text-xs font-semibold text-[#a73737]">This product has no available stock location.</p> : <div className="grid gap-2 sm:grid-cols-2">
              {plannedTaskLocationOptions.map((entry) => {
                const selected = plannedCycleLocationIds.includes(entry.location.id);
                return <label key={entry.location.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${selected ? "border-[#7257d6] bg-[#f6f1ff]" : "border-[#e2e9f3] hover:border-[#cbbbed]"}`}>
                  <input type="checkbox" checked={selected} onChange={() => setPlannedCycleLocationIds((current) => selected ? current.filter((id) => id !== entry.location.id) : [...current, entry.location.id])} className="h-4 w-4 accent-[#7257d6]" />
                  <span className="min-w-0 text-xs font-extrabold text-[#29466f]">{entry.location.code} — {entry.location.name}<span className="block text-[10px] font-semibold text-[#8294ac]">{entry.available} {entry.unit} available</span></span>
                </label>;
              })}
            </div>}
            <p className="mt-2 px-2 text-[10px] font-semibold text-[#8294ac]">A separate task is created for each selected location.</p>
          </fieldset> : plannedTaskType !== "TRANSFER" && <label className="text-xs font-extrabold text-[#49617f]">
            Location
            <select
              name="locationId"
              required={Boolean(plannedProductId)}
              value={plannedLocationId}
              onChange={(event) => setPlannedLocationId(event.target.value)}
              disabled={!plannedProductId}
              className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]"
            >
              <option value="">
                {!plannedProductId
                  ? "Select product first"
                  : plannedTaskLocationOptions.length === 0
                    ? "No location has available stock"
                    : plannedTaskType === "RECEIVE"
                      ? "Select destination location"
                      : "Select stocked location"}
              </option>
              {plannedTaskLocationOptions.map((entry) => (
                <option key={entry.location.id} value={entry.location.id}>
                  {entry.location.code} — {entry.location.name} — {entry.available} {entry.unit} available
                </option>
              ))}
            </select>
          </label>}
          {plannedTaskType === "TRANSFER" && <>
            <label className="text-xs font-extrabold text-[#49617f]">
              Transfer quantity
              <input
                name="quantity"
                type="number"
                min={1}
                max={selectedTransferSourceBalance ? selectedTransferSourceBalance.quantity : undefined}
                required
                value={plannedTransferQuantity}
                onChange={(event) => setPlannedTransferQuantity(event.target.value)}
                disabled={!plannedTransferSourceId}
                placeholder={plannedTransferSourceId ? "Enter quantity" : "Select pick-from location first"}
                className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]"
              />
            </label>
            <label className="text-xs font-extrabold text-[#49617f]">
              Pick from
              <select
                name="sourceLocationId"
                required
                value={plannedTransferSourceId}
                onChange={(event) => { setPlannedTransferSourceId(event.target.value); setPlannedTransferDestinationId(""); setPlannedTransferQuantity(""); }}
                disabled={!plannedProductId}
                className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]"
              >
                <option value="">{plannedProductId ? transferSourceBalances.length ? "Select stock location" : "No location has available stock" : "Select product first"}</option>
                {transferSourceBalances.map((balance) => <option key={balance.location.id} value={balance.location.id}>{balance.location.code} — {balance.location.name} — {balance.quantity} {balance.product.unit} available</option>)}
              </select>
            </label>
            <label className="text-xs font-extrabold text-[#49617f]">
              Transfer to
              <select
                name="destinationLocationId"
                required
                value={plannedTransferDestinationId}
                onChange={(event) => setPlannedTransferDestinationId(event.target.value)}
                disabled={!plannedTransferSourceId}
                className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]"
              >
                <option value="">{plannedTransferSourceId ? "Select destination" : "Select pick-from location first"}</option>
                {snapshot?.locations.filter((location) => location.id !== plannedTransferSourceId).map((location) => <option key={location.id} value={location.id}>{location.code} — {location.name}</option>)}
              </select>
            </label>
            {selectedTransferSourceBalance && plannedTransferDestinationId && transferQuantity > 0 && <div className="rounded-xl border border-[#bcd4f8] bg-white p-3 text-xs font-semibold text-[#49617f] md:col-span-2 xl:col-span-4">
              <p className="font-extrabold text-[#17345f]">Transfer preview — total inventory stays the same</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <span>Pick from: {selectedTransferSourceBalance.location.name} {selectedTransferSourceBalance.quantity} → {selectedTransferSourceBalance.quantity - transferQuantity}</span>
                <span>Transfer to: {snapshot?.locations.find((location) => location.id === plannedTransferDestinationId)?.name} {selectedTransferDestinationBalance?.quantity ?? 0} → {(selectedTransferDestinationBalance?.quantity ?? 0) + transferQuantity}</span>
                <span>Move: {transferQuantity} {selectedTransferProduct?.unit ?? "unit"}</span>
              </div>
            </div>}
          </>}
          <label className="text-xs font-extrabold text-[#49617f] md:col-span-2 xl:col-span-3">Instructions<input name="description" maxLength={500} placeholder="Clear instructions for the executive" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
          <div className="flex items-end"><button disabled={!taskAssignees.length} className="h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-50">Assign task</button></div>
        </form>

        <form onSubmit={scheduleLocationCycleCounts} className="mt-4 rounded-2xl border border-[#e0cbf5] bg-[#faf6ff] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7257d6]">Month-end cycle count</p>
              <h3 className="mt-1 text-sm font-extrabold text-[#17345f]">Schedule the monthly multi-location count plan</h3>
              <p className="mt-1 text-xs text-[#8294ac]">Use this section at month end. Choose one or more locations and the system creates a separate count task for every stocked item.</p>
            </div>
            <span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-[10px] font-extrabold text-[#6349c1]">CYCLE_COUNT</span>
          </div>
          <fieldset className="mt-4 rounded-xl border border-[#d9c9f0] bg-white p-4">
            <legend className="px-2 text-xs font-extrabold text-[#49617f]">Locations to count</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot?.locations.map((location) => {
                const stockedItems = snapshot.balances.filter((balance) => balance.location.id === location.id && balance.quantity > 0).length;
                const selected = scheduledLocationIds.includes(location.id);
                return <label key={location.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${selected ? "border-[#7257d6] bg-[#f6f1ff]" : "border-[#e2e9f3] hover:border-[#cbbbed]"}`}>
                  <input type="checkbox" checked={selected} onChange={() => setScheduledLocationIds((current) => selected ? current.filter((id) => id !== location.id) : [...current, location.id])} className="h-4 w-4 accent-[#7257d6]" />
                  <span className="min-w-0"><span className="block text-xs font-extrabold text-[#29466f]">{location.code} — {location.name}</span><span className="text-[10px] font-semibold text-[#8294ac]">{stockedItems} stocked item{stockedItems === 1 ? "" : "s"}</span></span>
                </label>;
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setScheduledLocationIds(snapshot?.locations.filter((location) => snapshot.balances.some((balance) => balance.location.id === location.id && balance.quantity > 0)).map((location) => location.id) ?? [])} className="rounded-lg border border-[#d9c9f0] px-3 py-1.5 text-[10px] font-extrabold text-[#6349c1]">Select all stocked locations</button>
              <button type="button" onClick={() => setScheduledLocationIds([])} className="rounded-lg border border-[#e2e9f3] px-3 py-1.5 text-[10px] font-extrabold text-[#7186a3]">Clear</button>
              <span className={`ml-auto rounded-full px-3 py-1 text-[10px] font-extrabold ${scheduledLocationIds.length > 0 ? "bg-[#f2efff] text-[#6349c1]" : "bg-[#eef2f7] text-[#7b8fa9]"}`}>
                {scheduledLocationIds.length} location{scheduledLocationIds.length === 1 ? "" : "s"} selected
              </span>
            </div>
          </fieldset>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs font-extrabold text-[#49617f]">Count period<input name="schedPeriod" type="month" required value={cycleCountPeriod} onChange={(event) => { setCycleCountPeriod(event.target.value); setCycleCountDueValue(monthEndDueValue(event.target.value)); }} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /><span className="mt-1 block text-[10px] font-semibold text-[#8294ac]">Select the month being physically verified.</span></label>
            <label className="text-xs font-extrabold text-[#49617f]">Assign to<select name="schedAssigneeId" required value={cycleCountAssigneeId} onChange={(event) => setCycleCountAssigneeId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"><option value="" disabled>Select executive</option>{taskAssignees.map((user)=><option key={user.id} value={user.id}>{user.displayName} — {[user.shift, user.warehouseZone].filter(Boolean).join(" · ") || user.employeeId}</option>)}</select></label>
            <label className="text-xs font-extrabold text-[#49617f]">Due date and time<input name="schedDueAt" type="datetime-local" required value={cycleCountDueValue} min={`${cycleCountPeriod}-01T00:00`} max={monthEndDueValue(cycleCountPeriod).replace("T17:00", "T23:59")} onChange={(event)=>setCycleCountDueValue(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /><span className="mt-1 block text-[10px] font-semibold text-[#8294ac]">Must be within the selected month.</span></label>
            <label className="text-xs font-extrabold text-[#49617f]">Priority<select name="schedPriority" defaultValue="MEDIUM" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3">{["LOW","MEDIUM","HIGH","URGENT"].map((value)=><option key={value}>{value}</option>)}</select></label>
            <label className="flex h-11 items-center gap-3 self-end rounded-xl border border-[#d9c9f0] bg-white px-3 text-xs font-extrabold text-[#49617f]"><input type="checkbox" checked={blindCycleCount} onChange={(event) => setBlindCycleCount(event.target.checked)} className="h-4 w-4 accent-[#7257d6]" /> Blind count</label>
            <label className="text-xs font-extrabold text-[#49617f] xl:col-span-2">Instructions<input name="schedInstructions" value={cycleCountInstructions} onChange={(event) => setCycleCountInstructions(event.target.value)} maxLength={1000} placeholder="Optional instructions for the executive" className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3" /></label>
          </div>
          <div className="mt-4 rounded-xl border border-[#e0cbf5] bg-white p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Plan preview</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Period</p><p className="mt-1 text-sm font-black text-[#3f3470]">{formatCountPeriod(cycleCountPeriod) || cycleCountPeriod}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Locations</p><p className="mt-1 text-sm font-black text-[#3f3470]">{cycleCountPlanPreview.locations}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Different items</p><p className="mt-1 text-sm font-black text-[#3f3470]">{cycleCountPlanPreview.items}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Tasks generated</p><p className="mt-1 text-sm font-black text-[#3f3470]">{cycleCountPlanPreview.tasks}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Assigned executive</p><p className="mt-1 text-sm font-black text-[#3f3470]">{taskAssignees.find((user) => user.id === cycleCountAssigneeId)?.displayName ?? "Not selected"}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Due date</p><p className="mt-1 text-sm font-black text-[#3f3470]">{cycleCountDueValue ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(cycleCountDueValue)) : "Not set"}</p></div>
              <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]">Blind count</p><p className="mt-1 text-sm font-black text-[#3f3470]">{blindCycleCount ? "Yes — system quantity hidden" : "No"}</p></div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a7bb0]">Selected period: {cycleCountPeriod}</span>
            <button type="button" onClick={()=>setCycleCountDueValue(monthEndDueValue(cycleCountPeriod))} className="rounded-lg border border-[#d9c9f0] bg-white px-3 py-2 text-[11px] font-extrabold text-[#6349c1] transition hover:bg-[#f2efff]">Use month-end 5:00 PM</button>
            <button disabled={!taskAssignees.length || schedulingTasks || cycleCountPlanPreview.tasks === 0} className="ml-auto h-11 rounded-xl bg-[#7257d6] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(114,87,214,0.2)] disabled:cursor-wait disabled:opacity-50">{schedulingTasks ? "Scheduling…" : `Schedule ${cycleCountPlanPreview.tasks} count tasks`}</button>
          </div>
        </form>

        <section id="manager-cycle-count-plans" className="mt-6 scroll-mt-24 rounded-2xl border border-[#e0cbf5] bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7257d6]">Month-End Cycle Count</p>
              <h3 className="mt-1 text-sm font-extrabold text-[#17345f]">Cycle Count Plans</h3>
              <p className="mt-1 text-xs text-[#8294ac]">Every generated multi-location count plan with live task and discrepancy status. Open a plan to see each task.</p>
            </div>
            <span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-[10px] font-extrabold text-[#6349c1]">{cycleCountPlans.length} plan{cycleCountPlans.length === 1 ? "" : "s"}</span>
          </div>
          {cycleCountPlans.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#d9c9f0] bg-[#faf7ff] px-5 py-8 text-center">
              <ClipboardCheck size={22} className="mx-auto text-[#a89ad6]" />
              <p className="mt-2 text-sm font-extrabold text-[#24466f]">No cycle count plans yet</p>
              <p className="mt-1 text-xs text-[#8294ac]">Scheduled plans appear here with their task progress.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#faf6ff] text-[10px] uppercase tracking-[0.12em] text-[#8a7bb0]">
                  <tr>
                    {["Plan", "Period", "Locations", "Assigned worker", "Total", "Open", "Completed", "Discrepancies", "Status", "Due date"].map((heading) => (
                      <th key={heading} className="whitespace-nowrap px-4 py-3 font-extrabold">{heading}</th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ebfb] text-xs">
                  {cycleCountPlans.map((plan) => {
                    const open = openPlanId === plan.id;
                    return (
                      <Fragment key={plan.id}>
                        <tr className="transition hover:bg-[#faf7ff]">
                          <td className="whitespace-nowrap px-4 py-3.5 font-extrabold text-[#6349c1]">{plan.planNumber}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-bold text-[#29466f]">{formatCountPeriod(plan.periodMonth)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[#6c829f]">{(plan.locations ?? []).map((location) => location.name).join(", ") || "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-bold text-[#496482]">{plan.assignedTo?.displayName ?? "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-extrabold text-[#3f3470]">{plan.totalTasks ?? 0}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-bold text-[#155eef]">{plan.openTasks ?? 0}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-bold text-[#16865b]">{plan.completedTasks ?? 0}</td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${(plan.discrepancyCount ?? 0) > 0 ? "bg-[#fff1e3] text-[#c56c08]" : "bg-[#eef2f7] text-[#7b8fa9]"}`}>{plan.discrepancyCount ?? 0}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${plan.status === "COMPLETED" ? "bg-[#eaf8f1] text-[#16865b]" : plan.status === "IN_PROGRESS" ? "bg-[#f2efff] text-[#6349c1]" : plan.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#edf4ff] text-[#155eef]"}`}>{(plan.status ?? "OPEN").replaceAll("_", " ")}</span></td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[#6c829f]">{plan.dueAt ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(plan.dueAt)) : "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <button type="button" onClick={() => void openCycleCountPlan(plan.id)} disabled={loadingPlanDetail && open} className="rounded-lg border border-[#d9c9f0] bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#6349c1] transition hover:bg-[#f2efff] disabled:opacity-50">
                              {loadingPlanDetail && open ? "Loading…" : open ? "Hide tasks" : "View tasks"}
                            </button>
                          </td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={11} className="bg-[#faf7ff] px-4 py-4">
                              {loadingPlanDetail && !openPlanDetail ? (
                                <p className="px-3 py-6 text-center text-xs font-semibold text-[#8a7bb0]">Loading plan tasks…</p>
                              ) : openPlanDetail && openPlanDetail.id === plan.id ? (
                                <PlanTaskList plan={openPlanDetail} />
                              ) : (
                                <p className="px-3 py-6 text-center text-xs font-semibold text-[#a73737]">The plan tasks could not be loaded. Try again.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
                      {task.cycleCountPlan && <span className="rounded-full bg-[#e9f7ff] px-2 py-0.5 text-[9px] font-extrabold text-[#0e7490]">{task.cycleCountPlan.planNumber} · {task.cycleCountPlan.tasks?.filter((entry) => entry.status === "COMPLETED").length ?? 0}/{task.cycleCountPlan.tasks?.length ?? 0}</span>}
                    </div>
                    <p className="mt-1 text-xs text-[#7b8fa9]">
                      {task.assignedTo?.displayName ?? "Unassigned"} · {task.type === "TRANSFER"
                        ? `${task.quantity ?? 0} ${task.product?.unit ?? "unit"} · ${task.sourceLocation?.name ?? "Source missing"} → ${task.destinationLocation?.name ?? "Destination missing"}`
                        : `${task.location?.name ?? "Any location"}${task.product ? ` · ${task.product.name}` : ""}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`inline-flex h-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${taskStatusTone(task.status)}`}>{task.status === "IN_PROGRESS" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7257d6]" />}{task.status.replaceAll("_", " ")}</span>
                    {(task.status === "OPEN" || task.status === "IN_PROGRESS") && (
                      <button
                        type="button"
                        disabled={deletingTaskId === task.id}
                        onClick={() => void handleCancelTask(task)}
                        aria-label={`Cancel task ${task.title}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#efb5b5] bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:cursor-wait disabled:opacity-50"
                      >
                        <Trash2 size={12} /> {deletingTaskId === task.id ? "Cancelling…" : "Cancel task"}
                      </button>
                    )}
                  </div>
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
              const countedLocationBalance =
                transaction.action === "CYCLE_COUNT" && transaction.sourceLocation
                  ? snapshot?.balances.find(
                      (balance) =>
                        balance.product.id === transaction.product.id &&
                        balance.location.id === transaction.sourceLocation?.id,
                    )
                  : undefined;
              const expectedAtCountedLocation =
                transaction.systemQuantityBefore ??
                countedLocationBalance?.quantity ??
                0;
              const stockAtOtherLocations =
                transaction.action === "CYCLE_COUNT" && transaction.sourceLocation
                  ? (snapshot?.balances ?? []).filter(
                      (balance) =>
                        balance.product.id === transaction.product.id &&
                        balance.location.id !== transaction.sourceLocation?.id &&
                        balance.quantity > 0,
                    )
                  : [];
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
                    {transaction.action === "CYCLE_COUNT" && (
                      <div className="mt-2 rounded-xl border border-[#f2d39a] bg-[#fffbf3] px-3 py-2.5 text-xs text-[#72501d]">
                        <p className="font-extrabold">
                          Location check: {location} has {expectedAtCountedLocation} {transaction.product.unit}; the executive counted {transaction.quantity}.
                        </p>
                        {stockAtOtherLocations.length > 0 && (
                          <p className="mt-1 font-semibold">
                            This item is also recorded at {stockAtOtherLocations
                              .map(
                                (balance) =>
                                  `${balance.location.name} (${balance.quantity} ${transaction.product.unit})`,
                              )
                              .join(", ")}.
                          </p>
                        )}
                        <p className="mt-1 text-[#8a6a37]">
                          An exact count posts automatically only when it matches the stock recorded at the same location.
                        </p>
                      </div>
                    )}
                    {(transaction._count?.evidence ?? 0) > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e0f7fb] px-2.5 py-1 text-[10px] font-extrabold text-[#0e7490]">
                          <Camera size={12} /> Photo evidence · {transaction._count?.evidence}
                        </span>
                        <TransactionEvidence
                          transactionId={transaction.id}
                          evidenceCount={transaction._count?.evidence ?? 0}
                        />
                      </div>
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
                {transaction.action === "DAMAGE" && (
                  <div className="mt-5 border-t border-[#f0f3f8] pt-5">
                    <label htmlFor={`damage-reason-${transaction.id}`} className="text-xs font-extrabold text-[#24466f]">
                      Adjustment reason <span className="text-[#c94b4b]">*</span>
                    </label>
                    <textarea
                      id={`damage-reason-${transaction.id}`}
                      value={damageAdjustmentReasons[transaction.id] ?? ""}
                      onChange={(event) => setDamageAdjustmentReasons((current) => ({
                        ...current,
                        [transaction.id]: event.target.value,
                      }))}
                      maxLength={500}
                      rows={3}
                      placeholder="Example: Product was damaged during warehouse handling."
                      className="mt-2 w-full resize-y rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-xs font-semibold text-[#29466f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
                    />
                    <p className="mt-1 text-[11px] font-semibold text-[#8294ac]">
                      Required before damaged stock can be adjusted and posted.
                    </p>
                  </div>
                )}
                <div className={`grid gap-2.5 ${transaction.action === "DAMAGE" ? "mt-3 sm:grid-cols-2" : "mt-5 border-t border-[#f0f3f8] pt-5 sm:grid-cols-3"}`}>
                  <button
                    type="button"
                    disabled={reviewingId === transaction.id || (transaction.action === "DAMAGE" && !(damageAdjustmentReasons[transaction.id]?.trim()))}
                    onClick={() => void reviewTransaction(transaction, "approve")}
                    className="rounded-xl bg-[#16865b] px-4 py-3 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.22)] disabled:opacity-60"
                  >
                    Approve and post
                  </button>
                  {transaction.action !== "DAMAGE" && (
                    <button
                      type="button"
                      disabled={reviewingId === transaction.id}
                      onClick={() => void reviewTransaction(transaction, "recount")}
                      className="rounded-xl border border-[#e0bd70] bg-[#fffaf0] px-4 py-2.5 text-xs font-extrabold text-[#b36d0c] disabled:opacity-60"
                    >
                      Request recount
                    </button>
                  )}
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
              <div key={day.key} className="flex h-full flex-1 flex-col justify-end gap-1 text-center" title={`${day.label}: received ${day.received}, shipped ${day.outgoing}`}>
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

      <section
        id="purchase-items"
        className="mt-6 scroll-mt-6 rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]"
      >
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7257d6]">
              Manager-only · low stock
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">
              Purchase Items
            </h2>
            <p className="mt-1 text-xs text-[#8294ac]">
              Only products below their safety level are shown. Use the purchase quantity when preparing the order outside this system.
            </p>
            <div className="mt-3"><span className="rounded-full bg-[#fff2d9] px-3 py-1 text-[10px] font-extrabold text-[#aa690d]">{lowStockDraftCount} low-stock item{lowStockDraftCount === 1 ? "" : "s"}</span></div>
          </div>
          <button
            type="button"
            onClick={() => {
              setReorderActionId("refresh");
              setReorderMessage("");
              refreshReorderDrafts()
                .then(setReorderDrafts)
                .catch(() =>
                  setReorderMessage("The purchase items could not be refreshed."),
                )
                .finally(() => setReorderActionId(null));
            }}
            disabled={reorderActionId === "refresh"}
            className="rounded-xl border border-[#c8d6e8] px-4 py-2.5 text-xs font-extrabold text-[#496482] disabled:opacity-60"
          >
            {reorderActionId === "refresh" ? "Checking stock…" : "Refresh stock"}
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#e9eef5] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-xs">
            <span className="sr-only">Search purchase items</span>
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8597af]" />
            <input
              type="search"
              value={purchaseQuery}
              onChange={(event) => setPurchaseQuery(event.target.value)}
              placeholder="Search item or SKU"
              className="h-10 w-full rounded-xl border border-[#d5e1f0] bg-white pl-9 pr-3 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[#d5e1f0] bg-[#f4f8ff] p-1">
              {(["ALL", "LOW", "OUT"] as const).map((option) => {
                const labels: Record<string, string> = { ALL: "All", LOW: "Low stock", OUT: "Out of stock" };
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={purchaseFilter === option}
                    onClick={() => setPurchaseFilter(option)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${purchaseFilter === option ? "bg-[#155eef] text-white shadow-[0_6px_14px_rgba(21,94,239,0.22)]" : "text-[#496482] hover:text-[#155eef]"}`}
                  >
                    {labels[option]}
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-[11px] font-extrabold text-[#49617f]">
              Sort
              <select
                value={purchaseSort}
                onChange={(event) => setPurchaseSort(event.target.value as "severity" | "name")}
                className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
              >
                <option value="severity">Shortage severity</option>
                <option value="name">Item name A–Z</option>
              </select>
            </label>
          </div>
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
              No products currently require purchasing.
            </p>
            <p className="mt-1 text-xs text-[#8093ab]">
              Every product is currently at or above its safety level.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
                <tr>
                  {["Item", "SKU", "Available quantity", "Safety stock", "Purchase quantity", "Status"].map((heading) => (
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
                {visibleReorderDrafts.map((draft) => {
                  const outOfStock = draft.currentStock <= 0;
                  return (
                    <tr key={draft.id}>
                      <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">
                        {draft.product.name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-[#6c829f]">
                        {draft.product.sku}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#c04b4b]">
                        {draft.currentStock}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">
                        {draft.safetyStock}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#7257d6]">
                        {draft.suggestedQuantity}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${outOfStock ? "bg-[#ffecec] text-[#c04343]" : "bg-[#fff4df] text-[#b36d0c]"}`}>
                          {outOfStock ? "Out of stock" : "Low stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section id="manager-audit-history" className="mt-6 scroll-mt-24 rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]" data-tx-tab="history" data-tx-tab-active={transactionTab === "history" ? "true" : "false"}>
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Controlled ledger</p><h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Inventory audit history</h2><p className="mt-1 text-xs text-[#8294ac]">All authorized stock transactions with creator, reviewer and references.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter audit action" value={auditAction} onChange={(event) => setAuditAction(event.target.value)} className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]"><option value="ALL">All actions</option>{["RECEIVE","SHIP","TRANSFER","CYCLE_COUNT","DAMAGE"].map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}</select><select aria-label="Filter audit status" value={auditStatus} onChange={(event) => setAuditStatus(event.target.value)} className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]"><option value="ALL">All statuses</option>{["PENDING","RECOUNT_REQUESTED","APPROVED","REJECTED","POSTED","CANCELLED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><button type="button" onClick={exportAuditHistory} disabled={!auditTransactions.length} className="flex h-10 items-center gap-2 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white disabled:opacity-50"><Download size={15} /> Export CSV</button></div></div>
        {selectedAuditTransaction && (
          <div className={`m-5 rounded-2xl border p-5 ${isStockAdjustment(selectedAuditTransaction) ? "border-[#efc36f] bg-[#fff9ec]" : "border-[#cfe0f7] bg-[#f7faff]"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#102a56]">Transaction details</h3>
                  {isStockAdjustment(selectedAuditTransaction) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2.5 py-1 text-[10px] font-extrabold text-white">
                      <Flag size={12} /> Stock adjustment
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[#6c829f]">TX-{selectedAuditTransaction.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button type="button" onClick={() => setSelectedAuditTransaction(null)} aria-label="Close transaction details" className="rounded-lg border border-[#d5e1f0] bg-white p-2 text-[#66809f] transition hover:text-[#155eef]">
                <X size={16} />
              </button>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Date and time", new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedAuditTransaction.createdAt))],
                ["Action", selectedAuditTransaction.action.replaceAll("_", " ")],
                ["Status", selectedAuditTransaction.status.replaceAll("_", " ")],
                ["Product", `${selectedAuditTransaction.product.name} (${selectedAuditTransaction.product.sku})`],
                ["Quantity", `${selectedAuditTransaction.quantity} ${selectedAuditTransaction.product.unit}`],
                ["From location", selectedAuditTransaction.sourceLocation?.name ?? "Not applicable"],
                ["To location", selectedAuditTransaction.destinationLocation?.name ?? "Not applicable"],
                ["Reference", selectedAuditTransaction.referenceNumber ?? "Not provided"],
                ["Created by", selectedAuditTransaction.createdBy?.displayName ?? "System"],
                ["Reviewed by", selectedAuditTransaction.approvedBy?.displayName ?? "Not reviewed"],
                ["Previous system quantity", selectedAuditTransaction.systemQuantityBefore ?? "Not recorded"],
                ["Difference", selectedAuditTransaction.discrepancyDifference ?? "Not applicable"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-white/80 bg-white/75 p-3">
                  <dt className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]">{label}</dt>
                  <dd className="mt-1 break-words text-xs font-bold text-[#24466f]">{value}</dd>
                </div>
              ))}
            </dl>
            {isStockAdjustment(selectedAuditTransaction) && (
              <div className="mt-4 rounded-xl border border-[#efc36f] bg-white p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#a8670d]">Adjustment reason</p>
                <p className="mt-1 text-sm font-bold text-[#704a12]">{selectedAdjustmentReason}</p>
              </div>
            )}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#e1e8f1] bg-white p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]">Audit notes</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]">{selectedAuditTransaction.notes ?? "No audit notes recorded."}</p>
              </div>
              <div className="rounded-xl border border-[#e1e8f1] bg-white p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]">Voice transcript</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]">{selectedAuditTransaction.transcript ?? "No voice transcript attached."}</p>
              </div>
            </div>
            <div className="mt-4">
              <TransactionEvidence
                transactionId={selectedAuditTransaction.id}
                evidenceCount={selectedAuditTransaction._count?.evidence ?? 0}
                inline
              />
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
              <tr>{["Date", "Transaction", "Action", "Product", "Quantity", "Location", "Created by", "Status", "Details", "Cancel"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-extrabold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6] text-xs">
              {auditTransactions.map((transaction) => {
                const adjustment = isStockAdjustment(transaction);
                return (
                  <tr
                    key={transaction.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`View transaction TX-${transaction.id.slice(0, 8).toUpperCase()}`}
                    onClick={() => setSelectedAuditTransaction(transaction)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedAuditTransaction(transaction);
                      }
                    }}
                    className={`cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#155eef] ${adjustment ? "bg-[#fff8e9] hover:bg-[#fff1d2]" : "hover:bg-[#f7faff]"}`}
                  >
                    <td className={`whitespace-nowrap px-5 py-4 text-[#6c829f] ${adjustment ? "border-l-4 border-[#e49a20]" : ""}`}>{new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(transaction.createdAt))}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">TX-{transaction.id.slice(0, 8).toUpperCase()}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-[#496482]">
                      <div className="flex flex-col items-start gap-1">
                        <span>{transaction.action.replaceAll("_", " ")}</span>
                        {adjustment && <span className="inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2 py-0.5 text-[9px] font-extrabold text-white"><Flag size={10} /> Adjusted stock</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">{transaction.product.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-[#29466f]">{transaction.quantity} {transaction.product.unit}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#496482]">{transaction.createdBy?.displayName ?? "System"}</td>
                    <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${transaction.status === "POSTED" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "REJECTED" ? "bg-[#fff0f0] text-[#b83b3b]" : transaction.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`}>{transaction.status.replaceAll("_", " ")}</span></td>
                    <td className="whitespace-nowrap px-5 py-4"><span className="inline-flex items-center gap-2 font-extrabold text-[#155eef]"><Eye size={14} /> View{(transaction._count?.evidence ?? 0) > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f7fb] px-1.5 py-0.5 text-[9px] font-extrabold text-[#0e7490]"><Camera size={10} /> {transaction._count?.evidence}</span>}</span></td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {["PENDING", "RECOUNT_REQUESTED", "APPROVED"].includes(transaction.status) ? (
                        <button type="button" disabled={cancellingTransactionId === transaction.id} onClick={(event) => { event.stopPropagation(); void handleCancelManagerTransaction(transaction); }} className="rounded-lg border border-[#efb5b5] px-2.5 py-1.5 text-[10px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{cancellingTransactionId === transaction.id ? "Cancelling…" : "Cancel"}</button>
                      ) : <span className="text-[#d3dbe6]">—</span>}
                    </td>
                  </tr>
                );
              })}
              {!auditTransactions.length && <tr><td colSpan={10} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No audit records match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>


      <AdministratorDashboard managerMode page={page} />
    </div>
  );
}

function PlanTaskList({ plan }: { plan: ApiCycleCountPlanDetail }) {
  return (
    <div className="rounded-xl border border-[#e0cbf5] bg-white p-4">
      <div className="flex flex-col gap-2 border-b border-[#f0ebfb] pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold text-[#3f3470]">{plan.title}</p>
          <p className="mt-0.5 text-[10px] font-bold text-[#8a7bb0]">{plan.planNumber} · Count period {formatCountPeriod(plan.periodMonth)}{plan.blindCount ? " · Blind count" : ""}</p>
        </div>
        <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold ${plan.status === "COMPLETED" ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#edf4ff] text-[#155eef]"}`}>{(plan.status ?? "OPEN").replaceAll("_", " ")}</span>
      </div>
      {plan.instructions && (
        <p className="mt-3 rounded-lg bg-[#faf6ff] px-3 py-2 text-[11px] font-semibold leading-5 text-[#5a4696]">Instructions: {plan.instructions}</p>
      )}
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {plan.tasks.map((task) => (
          <article key={task.id} className="rounded-xl border border-[#e9e2f7] bg-[#faf7ff] p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-xs font-extrabold text-[#29466f]">{task.product?.name ?? task.title}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${taskStatusTone(task.status)}`}>{task.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-1 text-[10px] font-semibold text-[#7b8fa9]">{task.location?.name ?? "Location missing"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {task.priority !== "MEDIUM" && <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${priorityTone(task.priority)}`}>{task.priority}</span>}
              {task.dueAt && <span className="rounded-full bg-[#fff5df] px-2 py-0.5 text-[9px] font-extrabold text-[#b36d0c]">{formatTaskDue(task.dueAt)}</span>}
            </div>
            {task.discrepancies.length > 0 && (
              <div className="mt-2 space-y-1">
                {task.discrepancies.map((entry) => (
                  <p key={entry.id} className="rounded-lg bg-[#fff1e3] px-2.5 py-1.5 text-[10px] font-bold text-[#c56c08]">
                    {entry.caseNumber} · {entry.status.replaceAll("_", " ")} · counted {entry.countedQuantity} vs expected {entry.expectedQuantity}
                  </p>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
