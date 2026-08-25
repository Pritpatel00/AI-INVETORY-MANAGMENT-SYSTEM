"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  History,
  ImagePlus,
  PackageMinus,
  PackagePlus,
  RefreshCcw,
  Scale,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  approveDiscrepancy,
  downloadDiscrepancyCsv,
  fetchDiscrepancies,
  fetchDiscrepancy,
  fetchDiscrepancyAudit,
  fetchDiscrepancyEvidence,
  fetchDiscrepancyReports,
  fetchDiscrepancySummary,
  fetchEvidenceObjectUrl,
  fetchInventorySnapshot,
  rejectDiscrepancy,
  requestDiscrepancyRecount,
  resolveDiscrepancyTransfer,
  uploadDiscrepancyEvidence,
  type ApiDiscrepancy,
  type ApiDiscrepancyAuditEvent,
  type ApiDiscrepancyReports,
  type ApiDiscrepancySummary,
  type ApiEvidence,
  type InventorySnapshot,
} from "../api/inventory-api";
import { formatClock } from "../shared/helpers";

type SummaryView =
  | "OPEN"
  | "AWAITING_RECOUNT"
  | "HIGH_PRIORITY"
  | "RESOLVED_TODAY"
  | "MISSING"
  | "EXTRA";

const severityTone: Record<string, string> = {
  NONE: "bg-[#eef2f7] text-[#7b8fa9]",
  MINOR: "bg-[#edf4ff] text-[#155eef]",
  MEDIUM: "bg-[#fff4df] text-[#b36d0c]",
  MAJOR: "bg-[#fff1e3] text-[#c56c08]",
  CRITICAL: "bg-[#ffecec] text-[#c04343]",
};

const statusTone: Record<string, string> = {
  OPEN: "bg-[#edf4ff] text-[#155eef]",
  AWAITING_REVIEW: "bg-[#fff4df] text-[#b36d0c]",
  RECOUNT_REQUESTED: "bg-[#f2efff] text-[#6349c1]",
  APPROVED: "bg-[#eaf8f1] text-[#16865b]",
  REJECTED: "bg-[#fff0f0] text-[#b83f3f]",
  RESOLVED_AS_TRANSFER: "bg-[#eaf8f1] text-[#16865b]",
  CLOSED: "bg-[#eef2f7] text-[#7b8fa9]",
};

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  AWAITING_REVIEW: "Awaiting review",
  RECOUNT_REQUESTED: "Recount requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RESOLVED_AS_TRANSFER: "Resolved as transfer",
  CLOSED: "Closed",
};

const auditActionMeta: Record<string, { label: string; tone: string }> = {
  CASE_CREATED: { label: "Case created", tone: "bg-[#edf4ff] text-[#155eef]" },
  WORKER_CONFIRMED: { label: "Worker confirmed", tone: "bg-[#f4f7fc] text-[#6c829f]" },
  REVIEW_OPENED: { label: "Review opened", tone: "bg-[#edf4ff] text-[#155eef]" },
  RECOUNT_REQUESTED: { label: "Recount requested", tone: "bg-[#f2efff] text-[#6349c1]" },
  RECOUNT_COMPLETED: { label: "Recount completed", tone: "bg-[#f2efff] text-[#6349c1]" },
  APPROVED: { label: "Approved", tone: "bg-[#eaf8f1] text-[#16865b]" },
  REJECTED: { label: "Rejected", tone: "bg-[#fff0f0] text-[#b83f3f]" },
  RESOLVED_AS_TRANSFER: { label: "Resolved as transfer", tone: "bg-[#eaf8f1] text-[#16865b]" },
  PHOTO_UPLOADED: { label: "Photo uploaded", tone: "bg-[#e0f7fb] text-[#0e7490]" },
  CASE_CLOSED: { label: "Case closed", tone: "bg-[#eef2f7] text-[#7b8fa9]" },
};

function formatDifference(quantity: number) {
  return quantity > 0 ? `+${quantity}` : String(quantity);
}

export function DiscrepanciesPage() {
  const [items, setItems] = useState<ApiDiscrepancy[]>([]);
  const [summary, setSummary] = useState<ApiDiscrepancySummary | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [differenceFilter, setDifferenceFilter] = useState("");
  const [summaryView, setSummaryView] = useState<SummaryView | null>(null);
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<ApiDiscrepancy | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "error">("info");
  const [actingId, setActingId] = useState<string | null>(null);
  const [action, setAction] = useState<
    "approve" | "recount" | "reject" | "transfer" | null
  >(null);
  const [actionNote, setActionNote] = useState("");
  const [inventorySnapshot, setInventorySnapshot] =
    useState<InventorySnapshot | null>(null);
  const [transferSource, setTransferSource] = useState("");
  const [transferDestination, setTransferDestination] = useState("");

  // Step 3 additions
  const [auditEvents, setAuditEvents] = useState<ApiDiscrepancyAuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string>>({});
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reports, setReports] = useState<ApiDiscrepancyReports | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<{ file: File; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function loadData(resetPage = false) {
    setLoading(true);
    try {
      const [list, summaryData, snapshot] = await Promise.all([
        fetchDiscrepancies({
          page: resetPage ? 1 : page,
          pageSize,
          status: statusFilter || undefined,
          severity: severityFilter || undefined,
          difference: (differenceFilter as "POSITIVE" | "NEGATIVE") || undefined,
          sort,
          order,
          view: summaryView || undefined,
        }),
        fetchDiscrepancySummary(),
        fetchInventorySnapshot().catch(() => null as InventorySnapshot | null),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setSummary(summaryData);
      if (resetPage) setPage(1);
      if (snapshot) setInventorySnapshot(snapshot);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Defer the initial load so the loading state never updates synchronously
    // inside the effect (avoids cascading renders on filter changes).
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, severityFilter, differenceFilter, sort, order, summaryView]);

  const filteredBySearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.caseNumber.toLowerCase().includes(q) ||
        item.product.name.toLowerCase().includes(q) ||
        item.product.sku.toLowerCase().includes(q),
    );
  }, [items, query]);

  async function openDetail(item: ApiDiscrepancy) {
    setDetailLoading(true);
    setSelected(item);
    setUploadPreview(null);
    setUploadFile(null);
    setUploadError("");
    setAuditEvents([]);
    try {
      const [fresh, audit] = await Promise.all([
        fetchDiscrepancy(item.id),
        fetchDiscrepancyAudit(item.id).catch(() => [] as ApiDiscrepancyAuditEvent[]),
      ]);
      setSelected(fresh);
      setAuditEvents(audit);
      setAuditLoading(false);
      // Load thumbnail object URLs for stored photos.
      void loadEvidenceUrls(fresh);
    } catch {
      setMessageTone("error");
      setMessage("The case details could not be loaded. Refresh and try again.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadEvidenceUrls(caseData: ApiDiscrepancy) {
    const evidence = await fetchDiscrepancyEvidence(caseData.id).catch(
      () => [] as ApiEvidence[],
    );
    const urls: Record<string, string> = {};
    await Promise.all(
      evidence.slice(0, 8).map(async (entry) => {
        try {
          urls[entry.id] = await fetchEvidenceObjectUrl(entry.id);
        } catch {
          // thumbnail unavailable
        }
      }),
    );
    setEvidenceUrls((current) => ({ ...current, ...urls }));
  }

  function closeDetail() {
    setSelected(null);
    setAction(null);
    setActionNote("");
    setTransferSource("");
    setTransferDestination("");
    setAuditEvents([]);
    setUploadPreview(null);
    setUploadFile(null);
  }

  async function refresh() {
    setMessage("");
    await loadData(true);
    setMessageTone("info");
    setMessage("Discrepancy cases refreshed from the live database.");
  }

  async function toggleReports() {
    const next = !reportsOpen;
    setReportsOpen(next);
    if (next && !reports) {
      setReportsLoading(true);
      try {
        setReports(await fetchDiscrepancyReports());
      } catch {
        setMessageTone("error");
        setMessage("Manager reports could not be loaded. Try again.");
      } finally {
        setReportsLoading(false);
      }
    }
  }

  async function exportCsv() {
    setExporting(true);
    setMessage("");
    try {
      await downloadDiscrepancyCsv({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        difference: differenceFilter || undefined,
      });
      setMessageTone("info");
      setMessage("The filtered discrepancy list was exported as a CSV file.");
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "The CSV export could not be completed.",
      );
    } finally {
      setExporting(false);
    }
  }

  function prepareUpload(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Only JPEG, PNG and WebP images are accepted.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("The photo must be 8 MB or smaller.");
      return;
    }
    setUploadError("");
    setUploadFile({ file, name: file.name || "evidence.jpg" });
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submitEvidence() {
    if (!selected || !uploadFile) return;
    setUploading(true);
    setUploadError("");
    try {
      await uploadDiscrepancyEvidence(selected.id, uploadFile.file, uploadFile.name);
      const fresh = await fetchDiscrepancy(selected.id);
      setSelected(fresh);
      setUploadPreview(null);
      setUploadFile(null);
      setMessageTone("info");
      setMessage("Photo evidence uploaded and linked to the case.");
      void loadEvidenceUrls(fresh);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "The photo could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function runDecision() {
    if (!selected || !action) return;
    setActingId(selected.id);
    setMessage("");
    try {
      if (action === "approve") {
        await approveDiscrepancy(selected.id, actionNote);
        setMessageTone("info");
        setMessage(
          `Case ${selected.caseNumber} approved. The stock balance was updated to the counted quantity.`,
        );
      } else if (action === "recount") {
        await requestDiscrepancyRecount(selected.id, actionNote, undefined);
        setMessageTone("info");
        setMessage(
          `A recount task was created for ${selected.caseNumber}. No stock was changed.`,
        );
      } else if (action === "reject") {
        await rejectDiscrepancy(selected.id, actionNote);
        setMessageTone("info");
        setMessage(
          `Case ${selected.caseNumber} was rejected. Stock stays unchanged.`,
        );
      } else if (action === "transfer") {
        await resolveDiscrepancyTransfer(selected.id, {
          sourceLocationId: transferSource,
          destinationLocationId: transferDestination,
          note: actionNote,
        });
        setMessageTone("info");
        setMessage(
          `Case ${selected.caseNumber} was resolved as a transfer. Stock moved between the two locations.`,
        );
      }
      setAction(null);
      setActionNote("");
      setTransferSource("");
      setTransferDestination("");
      await loadData();
      const fresh = await fetchDiscrepancy(selected.id).catch(() => null);
      if (fresh) {
        setSelected(fresh);
        const audit = await fetchDiscrepancyAudit(selected.id).catch(
          () => [] as ApiDiscrepancyAuditEvent[],
        );
        setAuditEvents(audit);
      }
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "The manager decision could not be completed. Try again.",
      );
    } finally {
      setActingId(null);
    }
  }

  const openCases = summary?.byStatus.AWAITING_REVIEW ?? 0;
  const recountCases = summary?.byStatus.RECOUNT_REQUESTED ?? 0;
  const majorCritical =
    (summary?.bySeverity.MAJOR ?? 0) + (summary?.bySeverity.CRITICAL ?? 0);
  const resolvedToday = items.filter(
    (item) =>
      item.resolvedAt &&
      new Date(item.resolvedAt).toDateString() === new Date().toDateString(),
  ).length;
  const missingQuantity = items
    .filter((item) => item.differenceQuantity < 0)
    .reduce((sum, item) => sum + Math.abs(item.differenceQuantity), 0);
  const extraQuantity = items
    .filter((item) => item.differenceQuantity > 0)
    .reduce((sum, item) => sum + item.differenceQuantity, 0);

  const selectSummaryView = (view: SummaryView) => {
    setSummaryView(view);
    setStatusFilter("");
    setSeverityFilter("");
    setDifferenceFilter("");
    setQuery("");
    setPage(1);
    window.setTimeout(() => {
      document.getElementById("discrepancy-case-list")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const transferQuantity = selected
    ? Math.abs(selected.differenceQuantity)
    : 0;
  const positiveLocationDifference =
    (selected?.differenceQuantity ?? 0) > 0;
  const transferSourceOptions = useMemo(() => {
    if (!selected || !inventorySnapshot || !positiveLocationDifference) {
      return [];
    }
    return inventorySnapshot.balances
      .filter(
        (balance) =>
          balance.product.id === selected.product.id &&
          balance.location.id !== selected.location.id &&
          balance.quantity >= transferQuantity,
      )
      .sort((left, right) =>
        left.location.name.localeCompare(right.location.name),
      );
  }, [inventorySnapshot, positiveLocationDifference, selected, transferQuantity]);
  const transferDestinationOptions = useMemo(() => {
    if (!selected || !inventorySnapshot || positiveLocationDifference) {
      return [];
    }
    return inventorySnapshot.locations
      .filter((location) => location.id !== selected.location.id)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [inventorySnapshot, positiveLocationDifference, selected]);
  const transferSourceBalance = inventorySnapshot?.balances.find(
    (balance) =>
      balance.product.id === selected?.product.id &&
      balance.location.id === transferSource,
  );
  const transferDestinationBalance = inventorySnapshot?.balances.find(
    (balance) =>
      balance.product.id === selected?.product.id &&
      balance.location.id === transferDestination,
  );
  const transferSourceBefore = transferSourceBalance?.quantity ?? 0;
  const transferDestinationBefore = transferDestinationBalance?.quantity ?? 0;
  const transferSourceAfter = transferSourceBefore - transferQuantity;
  const transferDestinationAfter = transferDestinationBefore + transferQuantity;
  const transferHasEnoughAvailable =
    transferSourceBefore >= transferQuantity;

  // A decision can never race an in-flight recount. The backend refuses
  // approve/reject/transfer while the recount task is OPEN or IN_PROGRESS;
  // the buttons mirror that guard (a completed or cancelled task no longer
  // blocks the decision).
  const recountInFlight =
    selected?.recountTask?.status === "OPEN" ||
    selected?.recountTask?.status === "IN_PROGRESS";
  const canDecide =
    selected !== null &&
    ["AWAITING_REVIEW", "OPEN"].includes(selected.status) &&
    !recountInFlight;

  const summaryCards = [
    {
      label: "Open",
      value: String(openCases),
      detail: "Awaiting manager review",
      icon: ClipboardCheck,
      tone: "text-[#155eef] bg-[#edf4ff]",
      view: "OPEN" as SummaryView,
      explanation: "Cases waiting for a manager to review the physical count and choose an action.",
    },
    {
      label: "Awaiting recount",
      value: String(recountCases),
      detail: "Recount tasks assigned",
      icon: RefreshCcw,
      tone: "text-[#6349c1] bg-[#f2efff]",
      view: "AWAITING_RECOUNT" as SummaryView,
      explanation: "Cases sent back to a Warehouse Executive for another physical count.",
    },
    {
      label: "Major and critical",
      value: String(majorCritical),
      detail: "High-priority cases",
      icon: AlertTriangle,
      tone: "text-[#c04343] bg-[#ffecec]",
      view: "HIGH_PRIORITY" as SummaryView,
      explanation: "Major and critical differences that need priority attention.",
    },
    {
      label: "Resolved today",
      value: String(summary?.resolvedToday ?? resolvedToday),
      detail: "Cases closed today",
      icon: CheckCircle2,
      tone: "text-[#16865b] bg-[#eaf8f1]",
      view: "RESOLVED_TODAY" as SummaryView,
      explanation: "Cases approved, rejected, closed or resolved as a transfer today.",
    },
    {
      label: "Missing quantity",
      value: String(summary?.missingQuantity ?? missingQuantity),
      detail: "Units short across open cases",
      icon: PackageMinus,
      tone: "text-[#b36d0c] bg-[#fff4df]",
      view: "MISSING" as SummaryView,
      explanation: "Open cases where the physical count is lower than the system quantity.",
    },
    {
      label: "Extra quantity",
      value: String(summary?.extraQuantity ?? extraQuantity),
      detail: "Units over system stock",
      icon: PackagePlus,
      tone: "text-[#0e7490] bg-[#e0f7fb]",
      view: "EXTRA" as SummaryView,
      explanation: "Open cases where the physical count is higher than the system quantity.",
    },
  ];

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const severityTotal = reports
    ? Object.values(reports.severityDistribution).reduce((sum, value) => sum + value, 0)
    : 0;

  return (
    <div id="manager-discrepancies" className="space-y-6">
      <section className="overflow-hidden rounded-[24px] border border-[#d8e5f7] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#c04343]">
              Manager-only · count accuracy
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">
              Discrepancies
            </h2>
            <p className="mt-1 text-xs text-[#8294ac]">
              Physical counts that differ from the system balance. Approve the
              count, request a recount, reject it, or resolve it as a transfer.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={exporting}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#c8d6e8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-60"
            >
              <FileDown size={15} />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
            <button
              type="button"
              onClick={() => void toggleReports()}
              disabled={reportsLoading}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#c8d6e8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-60"
            >
              <BarChart3 size={15} />
              {reportsOpen ? "Hide reports" : "Manager reports"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#c8d6e8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-60"
            >
              <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing…" : "Refresh cases"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {summaryCards.map((card, index) => (
            <button
              type="button"
              key={card.label}
              onClick={() => selectSummaryView(card.view)}
              aria-pressed={summaryView === card.view}
              aria-label={`Show ${card.label.toLowerCase()} discrepancy details`}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,45,82,0.08)] focus:outline-none focus:ring-2 focus:ring-[#155eef]/30 ${
                summaryView === card.view
                  ? "border-[#155eef] bg-[#f1f6ff] shadow-[0_10px_24px_rgba(21,94,239,0.12)]"
                  : "border-[#e2e9f3] bg-[#f9fbfd]"
              }`}
              style={{ animation: `dashboard-enter .5s ease ${index * 70}ms both` }}
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${card.tone}`}>
                  <card.icon size={17} />
                </span>
                <Scale size={14} className="text-[#c9d5e4]" />
              </div>
              <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#17345f]">
                {card.value}
              </p>
              <p className="mt-0.5 text-xs font-extrabold text-[#29466f]">
                {card.label}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#8294ac]">
                {card.detail}
              </p>
              <p className="mt-3 text-[10px] font-extrabold text-[#155eef]">
                View details →
              </p>
            </button>
          ))}
        </div>

        {reportsOpen && (
          <section className="border-t border-[#e9eef5] bg-[#fbfdff] px-6 py-6" aria-label="Manager discrepancy reports">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">
                  Reports · real database records only
                </p>
                <h3 className="mt-1 text-base font-extrabold text-[#102a56]">Discrepancy insights</h3>
              </div>
              {reports?.generatedAt && (
                <p className="text-[10px] font-semibold text-[#9aabc1]">
                  Generated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reports.generatedAt))}
                </p>
              )}
            </div>

            {reportsLoading ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="h-28 animate-pulse rounded-2xl bg-[#eef3f9]" />
                ))}
              </div>
            ) : reports ? (
              <div className="mt-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-[#e6edf5] bg-white p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]">Difference split</p>
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs font-bold text-[#0e7490]">Extra +{reports.differenceSplit.positive.units} units · {reports.differenceSplit.positive.cases} cases</p>
                      <p className="text-xs font-bold text-[#c04343]">Missing −{reports.differenceSplit.negative.units} units · {reports.differenceSplit.negative.cases} cases</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e6edf5] bg-white p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]">Severity distribution</p>
                    <div className="mt-2 space-y-1.5">
                      {Object.entries(reports.severityDistribution).filter(([, count]) => count > 0).map(([severity, count]) => (
                        <div key={severity} className="flex items-center gap-2">
                          <span className={`w-14 rounded px-1.5 py-0.5 text-center text-[9px] font-extrabold ${severityTone[severity]}`}>{severity}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef3f9]">
                            <div className="h-full rounded-full bg-[#155eef]" style={{ width: `${severityTotal ? Math.max(4, (count / severityTotal) * 100) : 0}%` }} />
                          </div>
                          <span className="w-6 text-right text-[10px] font-extrabold text-[#49617f]">{count}</span>
                        </div>
                      ))}
                      {severityTotal === 0 && <p className="text-xs text-[#9aabc1]">No cases recorded yet.</p>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e6edf5] bg-white p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]">Resolution & recounts</p>
                    <p className="mt-2 text-2xl font-black text-[#17345f]">{reports.averageResolutionHours ?? "—"}</p>
                    <p className="text-[10px] font-bold text-[#8295af]">avg resolution hours</p>
                    <p className="mt-2 text-sm font-extrabold text-[#6349c1]">{reports.recountFrequency} recounts</p>
                    <p className="mt-0.5 text-sm font-extrabold text-[#16865b]">{reports.approvedAdjustmentQuantity} units approved</p>
                  </div>
                  <div className="rounded-2xl border border-[#e6edf5] bg-white p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]">Stock accuracy trend</p>
                    <div className="mt-2 space-y-1.5">
                      {reports.stockAccuracyTrend.slice(-4).map((row) => (
                        <p key={row.month} className="flex items-center justify-between text-[11px] font-bold text-[#49617f]">
                          <span>{row.month}</span>
                          <span className={row.accuracy === null ? "text-[#9aabc1]" : row.accuracy >= 90 ? "text-[#16865b]" : "text-[#c56c08]"}>
                            {row.accuracy === null ? "no counts" : `${row.accuracy}% accurate`}
                          </span>
                        </p>
                      ))}
                      {reports.stockAccuracyTrend.length === 0 && <p className="text-xs text-[#9aabc1]">No cycle counts yet.</p>}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {[
                    { title: "By product", rows: reports.byProduct.slice(0, 6), render: (row: { name: string; cases: number }) => `${row.name} · ${row.cases} case${row.cases === 1 ? "" : "s"}` },
                    { title: "By location", rows: reports.byLocation.slice(0, 6), render: (row: { name: string; cases: number }) => `${row.name} · ${row.cases} case${row.cases === 1 ? "" : "s"}` },
                    { title: "By worker", rows: reports.byWorker.slice(0, 6), render: (row: { name: string; cases: number }) => `${row.name} · ${row.cases} case${row.cases === 1 ? "" : "s"}` },
                  ].map((panel) => (
                    <div key={panel.title} className="rounded-2xl border border-[#e6edf5] bg-white p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]">{panel.title}</p>
                      <div className="mt-2 space-y-1.5">
                        {panel.rows.length > 0 ? panel.rows.map((row) => (
                          <p key={row.name} className="truncate text-[11px] font-bold text-[#49617f]">{panel.render(row)}</p>
                        )) : <p className="text-xs text-[#9aabc1]">No data yet.</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {(reports.repeatedProducts.length > 0 || reports.repeatedLocations.length > 0) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {reports.repeatedProducts.length > 0 && (
                      <div className="rounded-2xl border border-[#ffe3b3] bg-[#fffaf0] p-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b36d0c]">Repeated problem products</p>
                        {reports.repeatedProducts.slice(0, 4).map((row) => (
                          <p key={row.productId} className="mt-1.5 truncate text-[11px] font-bold text-[#7a5410]">{row.name} · {row.cases} cases</p>
                        ))}
                      </div>
                    )}
                    {reports.repeatedLocations.length > 0 && (
                      <div className="rounded-2xl border border-[#ffe3b3] bg-[#fffaf0] p-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b36d0c]">Repeated problem locations</p>
                        {reports.repeatedLocations.slice(0, 4).map((row) => (
                          <p key={row.locationId} className="mt-1.5 truncate text-[11px] font-bold text-[#7a5410]">{row.name} · {row.cases} cases</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-[#fff4df] px-4 py-3 text-xs font-semibold text-[#7a5410]">
                The reports could not be generated from live data.
              </p>
            )}
          </section>
        )}

        <div id="discrepancy-case-list" className="scroll-mt-24 border-t border-[#e9eef5]">
          {summaryView && (
            <div className="mx-6 mt-5 flex flex-col gap-3 rounded-2xl border border-[#cbdcf6] bg-[#f3f7ff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="status">
              <div>
                <p className="text-sm font-extrabold text-[#17345f]">
                  Showing: {summaryCards.find((card) => card.view === summaryView)?.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#637b9b]">
                  {summaryCards.find((card) => card.view === summaryView)?.explanation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSummaryView(null); setPage(1); }}
                className="shrink-0 rounded-xl border border-[#b9cef0] bg-white px-4 py-2 text-xs font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]"
              >
                Show all cases
              </button>
            </div>
          )}

        <div className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-xs">
            <span className="sr-only">Search discrepancies</span>
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8597af]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search case, item or SKU"
              className="h-10 w-full rounded-xl border border-[#d5e1f0] bg-white pl-9 pr-3 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => { setSummaryView(null); setStatusFilter(event.target.value); setPage(1); }}
              aria-label="Filter by status"
              className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]"
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(event) => { setSummaryView(null); setSeverityFilter(event.target.value); setPage(1); }}
              aria-label="Filter by severity"
              className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]"
            >
              <option value="">All severities</option>
              {["MINOR", "MEDIUM", "MAJOR", "CRITICAL"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={differenceFilter}
              onChange={(event) => { setSummaryView(null); setDifferenceFilter(event.target.value); setPage(1); }}
              aria-label="Filter by difference direction"
              className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]"
            >
              <option value="">All differences</option>
              <option value="POSITIVE">Extra (counted above)</option>
              <option value="NEGATIVE">Missing (counted below)</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort by"
              className="h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]"
            >
              <option value="createdAt">Newest first</option>
              <option value="severity">Severity</option>
              <option value="differenceQuantity">Difference</option>
              <option value="differencePercentage">Difference %</option>
            </select>
            <button
              type="button"
              onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
              aria-pressed={order === "asc"}
              className="h-10 rounded-xl border border-[#d5e1f0] bg-[#f4f8ff] px-3 text-xs font-extrabold text-[#496482] transition hover:text-[#155eef]"
            >
              {order === "desc" ? "Newest ↓" : "Oldest ↑"}
            </button>
          </div>
        </div>
        </div>

        {message && (
          <div
            role="status"
            className={`mx-6 mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
              messageTone === "error"
                ? "bg-[#fff0f0] text-[#a73737]"
                : "bg-[#eef6ff] text-[#244f86]"
            }`}
          >
            {message}
          </div>
        )}

        {/* Mobile cards */}
        <div className="space-y-3 px-5 py-4 lg:hidden">
          {loading && items.length === 0 && (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-36 animate-pulse rounded-2xl border border-[#e6edf5] bg-[#f4f7fc]" />
              ))}
            </div>
          )}
          {!loading && filteredBySearch.length === 0 && (
            <div className="py-10 text-center">
              <CheckCircle2 size={26} className="mx-auto text-[#16865b]" />
              <p className="mt-3 text-sm font-extrabold text-[#24466f]">No discrepancy cases found</p>
              <p className="mt-1 text-xs text-[#7b8fa9]">
                {query || statusFilter || severityFilter
                  ? "No cases match the current search and filters."
                  : "Physical counts that differ from the system balance appear here."}
              </p>
            </div>
          )}
          {filteredBySearch.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void openDetail(item)}
              className="block w-full rounded-2xl border border-[#e2e9f3] bg-white p-4 text-left transition hover:border-[#b9d0f8] hover:bg-[#f8faff]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-extrabold text-[#155eef]">{item.caseNumber}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${severityTone[item.severity]}`}>{item.severity}</span>
              </div>
              <p className="mt-1.5 truncate text-sm font-extrabold text-[#24466f]">{item.product.name} · {item.product.sku}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#7186a3]">{item.location.name}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-bold text-[#29466f]">Expected {item.expectedQuantity} · Counted {item.countedQuantity}</span>
                <span className={`font-extrabold ${item.differenceQuantity < 0 ? "text-[#c04343]" : item.differenceQuantity > 0 ? "text-[#0e7490]" : "text-[#7b8fa9]"}`}>
                  {formatDifference(item.differenceQuantity)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusTone[item.status]}`}>{statusLabel[item.status]}</span>
                <span className="text-[10px] font-bold text-[#9aabc1]">
                  {new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-wider text-[#8295af]">
                <th className="px-5 py-3">Case</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3 text-right">Available Stock</th>
                <th className="px-5 py-3 text-right">Counted</th>
                <th className="px-5 py-3 text-right">Difference</th>
                <th className="px-5 py-3 text-right">%</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Worker</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Review</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 && (
                <tr>
                  <td colSpan={13}>
                    <div className="space-y-3 px-5 py-6">
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="h-10 animate-pulse rounded-xl bg-[#f0f4fa]" />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {filteredBySearch.map((item) => (
                <tr key={item.id} className="border-b border-[#eef2f7] last:border-0 transition hover:bg-[#f8faff]">
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">{item.caseNumber}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">
                    {new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">{item.product.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{item.product.sku}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{item.location.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-[#29466f]">{item.expectedQuantity}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-[#29466f]">{item.countedQuantity}</td>
                  <td className={`whitespace-nowrap px-5 py-4 text-right font-extrabold ${item.differenceQuantity < 0 ? "text-[#c04343]" : item.differenceQuantity > 0 ? "text-[#0e7490]" : "text-[#7b8fa9]"}`}>
                    {formatDifference(item.differenceQuantity)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-[#6c829f]">{item.differencePercentage}%</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${severityTone[item.severity]}`}>{item.severity}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{item.worker?.displayName ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusTone[item.status]}`}>{statusLabel[item.status]}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <button
                      type="button"
                      onClick={() => void openDetail(item)}
                      className="rounded-lg border border-[#c9d8ee] px-3 py-1.5 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#f4f8ff]"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBySearch.length === 0 && !loading && (
                <tr>
                  <td colSpan={13} className="px-6 py-14 text-center">
                    <CheckCircle2 size={26} className="mx-auto text-[#16865b]" />
                    <p className="mt-3 text-sm font-extrabold text-[#24466f]">No discrepancy cases found</p>
                    <p className="mt-1 text-xs text-[#7b8fa9]">
                      {query || statusFilter || severityFilter
                        ? "No cases match the current search and filters."
                        : "Physical counts that differ from the system balance appear here."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e9eef5] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-[#8295af]">
            {total} case{total === 1 ? "" : "s"} · page {page} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-[11px] font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              className="rounded-lg border border-[#c9d8ee] px-3 py-2 text-[11px] font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0b2343]/50 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label={`Case ${selected.caseNumber}`}>
          <div className="w-full max-w-3xl rounded-[26px] border border-[#d8e5f7] bg-white shadow-[0_24px_70px_rgba(11,35,67,0.35)]" style={{ animation: "dialog-in .3s ease both" }}>
            <div className="flex items-start justify-between gap-4 border-b border-[#e9eef5] px-6 py-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Discrepancy case</p>
                <h3 className="mt-1 text-lg font-extrabold text-[#102a56]">{selected.caseNumber}</h3>
              </div>
              <button type="button" onClick={closeDetail} aria-label="Close case details" className="rounded-lg p-2 text-[#6f84a3] transition hover:bg-[#f5f8fc]">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {detailLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="h-14 animate-pulse rounded-xl bg-[#f0f4fa]" />
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["Product", `${selected.product.name} (${selected.product.sku})`],
                      ["Location", selected.location.name],
                      ["Expected quantity", String(selected.expectedQuantity)],
                      ["Counted quantity", String(selected.countedQuantity)],
                      ["Difference", `${formatDifference(selected.differenceQuantity)} (${selected.differencePercentage}%)`],
                      ["Severity", selected.severity],
                      ["Severity rule", selected.severityRule ?? "Standard backend thresholds applied."],
                      ["Worker", selected.worker?.displayName ?? "—"],
                      ["Date and time", new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.createdAt))],
                      ["Status", statusLabel[selected.status]],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-3 py-3">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]">{label}</p>
                        <p className="mt-1 text-sm font-extrabold text-[#29466f]">{value}</p>
                      </div>
                    ))}
                  </div>

                  {selected.transaction?.transcript && (
                    <div className="rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8295af]">Voice transcript</p>
                      <p className="mt-1.5 text-sm font-semibold leading-6 text-[#3a5070]">“{selected.transaction.transcript}”</p>
                    </div>
                  )}

                  {selected.transaction && (
                    <div className="rounded-xl border border-[#b9d0f8] bg-[#f2f6ff] px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]">AI-understood details · related transaction</p>
                      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                        <p className="font-bold text-[#29466f]">TX-{selected.transactionId.slice(0, 8).toUpperCase()}</p>
                        <p className="font-semibold text-[#49617f]">{selected.transaction.action} · {selected.transaction.status}</p>
                        {selected.transaction.reviewReasons && (
                          <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#b36d0c] sm:col-span-2">
                            Flagged: {selected.transaction.reviewReasons}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(selected.workerNotes || selected.managerNotes) && (
                    <div className="space-y-2">
                      {selected.workerNotes && (
                        <div className="rounded-xl bg-[#f4f7fc] px-4 py-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#6c829f]">Worker note</p>
                          <p className="mt-1 text-sm font-semibold text-[#49617f]">{selected.workerNotes}</p>
                        </div>
                      )}
                      {selected.managerNotes && (
                        <div className="rounded-xl bg-[#fff4df] px-4 py-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#b36d0c]">Manager note</p>
                          <p className="mt-1 text-sm font-semibold text-[#7a5410]">{selected.managerNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photo evidence */}
                  <div className="rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0e7490]">
                        <Camera size={13} /> Photo evidence
                        {selected.evidence && selected.evidence.length > 0 && (
                          <span className="rounded-full bg-[#e0f7fb] px-2 py-0.5 text-[10px]">{selected.evidence.length}</span>
                        )}
                      </p>
                      {!uploadPreview && (
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer rounded-lg border border-[#b9d0f8] bg-[#f2f6ff] px-3 py-1.5 text-[10px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]">
                            <ImagePlus size={12} className="mr-1 inline" />
                            Choose file
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              onChange={(event) => prepareUpload(event.target.files?.[0])}
                            />
                          </label>
                          <label className="cursor-pointer rounded-lg border border-[#b9d0f8] bg-[#f2f6ff] px-3 py-1.5 text-[10px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]">
                            <Camera size={12} className="mr-1 inline" />
                            Camera
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="sr-only"
                              onChange={(event) => prepareUpload(event.target.files?.[0])}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {uploadPreview && (
                      <div className="mt-3 rounded-xl border border-[#d5e1f0] bg-white p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Blob URL from a local file upload cannot be optimized by next/image. */}
                        <img src={uploadPreview} alt="Evidence photo preview" className="mx-auto max-h-44 rounded-lg object-contain" />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="truncate text-[11px] font-bold text-[#49617f]">{uploadFile?.name}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setUploadPreview(null); setUploadFile(null); setUploadError(""); }}
                              className="flex items-center gap-1 rounded-lg border border-[#efb5b5] bg-[#fff6f6] px-3 py-1.5 text-[10px] font-extrabold text-[#b83f3f]"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => void submitEvidence()}
                              disabled={uploading}
                              className="rounded-lg bg-[#155eef] px-3 py-1.5 text-[10px] font-extrabold text-white disabled:opacity-60"
                            >
                              {uploading ? "Uploading…" : "Upload photo"}
                            </button>
                          </div>
                        </div>
                        {uploadError && <p className="mt-2 text-[11px] font-semibold text-[#a73737]">{uploadError}</p>}
                      </div>
                    )}

                    {selected.evidence && selected.evidence.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {selected.evidence.map((entry) => (
                          <div key={entry.id} className="overflow-hidden rounded-lg border border-[#d5e1f0] bg-white">
                            {evidenceUrls[entry.id] ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element -- Authenticated object URL requiring Authorization cannot be optimized by next/image. */}
                                <img src={evidenceUrls[entry.id]} alt={entry.originalFilename} className="h-16 w-full object-cover" />
                              </>
                            ) : (
                              <div className="grid h-16 w-full place-items-center bg-[#eef3f9] text-[#9aabc1]">
                                <ImagePlus size={16} />
                              </div>
                            )}
                            <p className="truncate px-1.5 py-1 text-[9px] font-bold text-[#6c829f]" title={entry.originalFilename}>
                              {entry.originalFilename}
                            </p>
                            <p className="px-1.5 pb-1.5 text-[9px] font-semibold text-[#9aabc1]">
                              {entry.uploadedBy?.displayName ?? "—"} · {formatClock(entry.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Append-only audit timeline */}
                  <div className="rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-4">
                    <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#6349c1]">
                      <History size={13} /> Audit history · append-only
                      {auditEvents.length > 0 && (
                        <span className="rounded-full bg-[#f2efff] px-2 py-0.5 text-[10px]">{auditEvents.length} events</span>
                      )}
                    </p>
                    {auditLoading ? (
                      <p className="mt-3 text-xs font-semibold text-[#9aabc1]">Loading audit history…</p>
                    ) : auditEvents.length === 0 ? (
                      <p className="mt-3 text-xs font-semibold text-[#9aabc1]">No audit events recorded for this case.</p>
                    ) : (
                      <ol className="mt-4 space-y-0">
                        {auditEvents.map((event, index) => {
                          const meta = auditActionMeta[event.action] ?? { label: event.action, tone: "bg-[#eef2f7] text-[#7b8fa9]" };
                          const actor = event.actorManager?.displayName ?? event.actorWorker?.displayName ?? null;
                          return (
                            <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                              {index < auditEvents.length - 1 && (
                                <span className="absolute left-[9px] top-5 h-full w-px bg-[#e2e9f3]" aria-hidden="true" />
                              )}
                              <span className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full ring-4 ring-white ${meta.tone.split(" ")[0]}`} aria-hidden="true" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${meta.tone}`}>{meta.label}</span>
                                  <span className="text-[9px] font-bold text-[#9aabc1]">
                                    {new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(event.createdAt))}
                                  </span>
                                  {actor && <span className="text-[10px] font-bold text-[#49617f]">{actor}</span>}
                                </div>
                                {(event.previousStatus || event.newStatus) && event.previousStatus !== event.newStatus && (
                                  <p className="mt-1 text-[10px] font-semibold text-[#7186a3]">
                                    {event.previousStatus ? statusLabel[event.previousStatus] ?? event.previousStatus : "Created"} → {statusLabel[event.newStatus ?? ""] ?? event.newStatus}
                                  </p>
                                )}
                                {event.differenceQuantity !== null && event.differenceQuantity !== undefined && (
                                  <p className="mt-0.5 text-[10px] font-bold text-[#29466f]">
                                    Expected {event.expectedQuantity} · Counted {event.countedQuantity} · {formatDifference(event.differenceQuantity)}
                                  </p>
                                )}
                                {event.severityRule && (
                                  <p className="mt-0.5 text-[10px] font-semibold text-[#49617f]">
                                    Rule: {event.severityRule}
                                  </p>
                                )}
                                {event.reason && <p className="mt-0.5 text-[11px] font-semibold text-[#6c829f]">{event.reason}</p>}
                                {event.rawTranscript && (
                                  <p className="mt-1 rounded-lg bg-[#f4f7fc] px-2.5 py-1.5 text-[10px] font-semibold italic leading-4 text-[#7186a3]">
                                    “{event.rawTranscript}”
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>

                  {selected.resolvedAt && (
                    <div className="rounded-xl border border-[#cde6d8] bg-[#f1faf5] px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#16865b]">Decision history · final resolution</p>
                      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                        <p className="font-bold text-[#24573f]">{statusLabel[selected.status]}</p>
                        <p className="font-semibold text-[#3a6b50]">{selected.resolvedBy?.displayName ?? "—"} · {formatClock(selected.resolvedAt)}</p>
                        {selected.resolutionTransaction && (
                          <p className="font-semibold text-[#3a6b50] sm:col-span-2">
                            Ledger TX-{selected.resolutionTransaction.id.slice(0, 8).toUpperCase()} · {selected.resolutionTransaction.action} · {selected.resolutionTransaction.status}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2.5 border-t border-[#eef2f7] pt-4 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                      type="button"
                      disabled={!canDecide || actingId !== null}
                      onClick={() => { setAction("approve"); setActionNote(""); }}
                      className="rounded-xl bg-[#16865b] px-4 py-3 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.22)] disabled:opacity-50"
                    >
                      Approve adjustment
                    </button>
                    <button
                      type="button"
                      disabled={!["AWAITING_REVIEW", "OPEN", "RECOUNT_REQUESTED"].includes(selected.status) || actingId !== null}
                      onClick={() => { setAction("recount"); setActionNote(""); }}
                      className="rounded-xl border border-[#cfc0f0] bg-[#faf6ff] px-4 py-2.5 text-xs font-extrabold text-[#6349c1] disabled:opacity-50"
                    >
                      Request recount
                    </button>
                    <button
                      type="button"
                      disabled={!canDecide || actingId !== null}
                      onClick={() => { setAction("reject"); setActionNote(""); }}
                      className="rounded-xl border border-[#efb5b5] bg-[#fff6f6] px-4 py-2.5 text-xs font-extrabold text-[#b83f3f] disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={!canDecide || actingId !== null}
                      onClick={() => {
                        setAction("transfer");
                        setActionNote("");
                        if (selected.differenceQuantity > 0) {
                          setTransferSource("");
                          setTransferDestination(selected.location.id);
                        } else {
                          setTransferSource(selected.location.id);
                          setTransferDestination("");
                        }
                      }}
                      className="rounded-xl border border-[#b9d0f8] bg-[#f2f6ff] px-4 py-2.5 text-xs font-extrabold text-[#155eef] disabled:opacity-50"
                    >
                      Resolve as transfer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {action && (
              <div className="border-t border-[#e9eef5] bg-[#f8faff] px-6 py-5">
                {action === "approve" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xl bg-[#fff4df] px-4 py-3">
                      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#b36d0c]" />
                      <p className="text-xs font-semibold leading-5 text-[#7a5410]">
                        Approving sets the balance to the counted quantity ({selected.countedQuantity}) and posts the ledger entry. This changes stock.
                      </p>
                    </div>
                    <label className="block text-xs font-extrabold text-[#49617f]">
                      Manager note (required)
                      <textarea
                        value={actionNote}
                        onChange={(event) => setActionNote(event.target.value)}
                        maxLength={500}
                        placeholder="Count confirmed against the shelf record."
                        className="mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
                      />
                    </label>
                  </div>
                )}
                {action === "recount" && (
                  <div className="space-y-3">
                    <p className="rounded-xl bg-[#f2efff] px-4 py-3 text-xs font-semibold text-[#5a4696]">
                      A recount task is created and assigned to the original worker. Stock is never changed.
                    </p>
                    <label className="block text-xs font-extrabold text-[#49617f]">
                      Instructions (required)
                      <textarea
                        value={actionNote}
                        onChange={(event) => setActionNote(event.target.value)}
                        maxLength={500}
                        placeholder="Count the full shelf again and call back the number."
                        className="mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
                      />
                    </label>
                  </div>
                )}
                {action === "reject" && (
                  <div className="space-y-3">
                    <p className="rounded-xl bg-[#fff0f0] px-4 py-3 text-xs font-semibold text-[#a73737]">
                      The count is rejected and the case is closed. Stock stays unchanged and history is preserved.
                    </p>
                    <label className="block text-xs font-extrabold text-[#49617f]">
                      Reason (required)
                      <textarea
                        value={actionNote}
                        onChange={(event) => setActionNote(event.target.value)}
                        maxLength={500}
                        placeholder="The counted quantity cannot be confirmed."
                        className="mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
                      />
                    </label>
                  </div>
                )}
                {action === "transfer" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xl bg-[#fff4df] px-4 py-3">
                      <ArrowRightLeft size={17} className="mt-0.5 shrink-0 text-[#b36d0c]" />
                      <p className="text-xs font-semibold leading-5 text-[#7a5410]">
                        Moves {transferQuantity} {selected.product.unit} between two locations in one posted transfer. The original Cycle Count is closed, and total inventory cannot increase.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-extrabold text-[#49617f]">
                        Source location
                        <select
                          value={transferSource}
                          onChange={(event) => setTransferSource(event.target.value)}
                          disabled={!positiveLocationDifference}
                          className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-bold text-[#17345f] disabled:bg-[#eef2f7] disabled:text-[#6f829a]"
                        >
                          <option value="">
                            {positiveLocationDifference
                              ? transferSourceOptions.length
                                ? "Select recorded stock location"
                                : "No location has enough available stock"
                              : `${selected.location.code} — ${selected.location.name}`}
                          </option>
                          {positiveLocationDifference && transferSourceOptions.map((balance) => (
                            <option key={balance.location.id} value={balance.location.id}>
                              {balance.location.code} — {balance.location.name} — {balance.quantity} {balance.product.unit} available
                            </option>
                          ))}
                          {!positiveLocationDifference && (
                            <option value={selected.location.id}>
                              {selected.location.code} — {selected.location.name}
                            </option>
                          )}
                        </select>
                      </label>
                      <label className="block text-xs font-extrabold text-[#49617f]">
                        Physical destination
                        <select
                          value={transferDestination}
                          onChange={(event) => setTransferDestination(event.target.value)}
                          disabled={positiveLocationDifference}
                          className="mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-bold text-[#17345f] disabled:bg-[#eef2f7] disabled:text-[#6f829a]"
                        >
                          <option value="">
                            {positiveLocationDifference
                              ? `${selected.location.code} — ${selected.location.name}`
                              : "Select physical destination"}
                          </option>
                          {positiveLocationDifference && (
                            <option value={selected.location.id}>
                              {selected.location.code} — {selected.location.name}
                            </option>
                          )}
                          {!positiveLocationDifference && transferDestinationOptions.map((location) => {
                            const balance = inventorySnapshot?.balances.find(
                              (entry) =>
                                entry.product.id === selected.product.id &&
                                entry.location.id === location.id,
                            );
                            return (
                              <option key={location.id} value={location.id}>
                                {location.code} — {location.name} — {balance?.quantity ?? 0} {selected.product.unit} recorded
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    </div>
                    {transferSource && transferDestination && (
                      <div className="rounded-2xl border border-[#cddcf2] bg-white p-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]">
                          Stock preview — total remains {transferSourceBefore + transferDestinationBefore} {selected.product.unit}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-[#fff6f0] p-3">
                            <p className="text-xs font-extrabold text-[#8b4b22]">
                              From {transferSourceBalance?.location.name ?? "source"}
                            </p>
                            <p className="mt-1 text-sm font-black text-[#17345f]">
                              {transferSourceBefore} → {transferSourceAfter}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold text-[#7f91a8]">
                              Available before: {transferSourceBefore}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#eef9f3] p-3">
                            <p className="text-xs font-extrabold text-[#246044]">
                              To {transferDestinationBalance?.location.name ?? selected.location.name}
                            </p>
                            <p className="mt-1 text-sm font-black text-[#17345f]">
                              {transferDestinationBefore} → {transferDestinationAfter}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold text-[#7f91a8]">
                              Total after: {transferSourceAfter + transferDestinationAfter}
                            </p>
                          </div>
                        </div>
                        {!transferHasEnoughAvailable && (
                          <p className="mt-3 rounded-lg bg-[#fff0f0] px-3 py-2 text-xs font-bold text-[#a73737]">
                            The source does not have enough available stock for this transfer.
                          </p>
                        )}
                      </div>
                    )}
                    <label className="block text-xs font-extrabold text-[#49617f]">
                      Resolution reason (required)
                      <textarea
                        value={actionNote}
                        onChange={(event) => setActionNote(event.target.value)}
                        maxLength={500}
                        placeholder="Stock was physically found in Storage 1 but recorded in Packing."
                        className="mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
                      />
                    </label>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setAction(null)} className="rounded-xl border border-[#c9d8ee] px-4 py-2.5 text-xs font-extrabold text-[#496482]">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      actingId !== null ||
                      (action === "approve" && !actionNote.trim()) ||
                      (action === "recount" && !actionNote.trim()) ||
                      (action === "reject" && !actionNote.trim()) ||
                      (action === "transfer" &&
                        (!transferSource ||
                          !transferDestination ||
                          !actionNote.trim() ||
                          !transferHasEnoughAvailable))
                    }
                    onClick={() => void runDecision()}
                    className={`rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] disabled:opacity-50 ${
                      action === "reject"
                        ? "bg-[#c04343]"
                        : action === "approve"
                          ? "bg-[#16865b]"
                          : action === "recount"
                            ? "bg-[#7257d6]"
                            : "bg-[#155eef]"
                    }`}
                  >
                    {actingId === selected.id
                      ? "Working…"
                      : action === "approve"
                        ? "Approve and post"
                        : action === "recount"
                          ? "Create recount task"
                          : action === "reject"
                            ? "Reject case"
                            : "Resolve transfer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
