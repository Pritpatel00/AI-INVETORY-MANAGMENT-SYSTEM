"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Ban, CalendarClock, CheckCircle2, ClipboardList, Clock3, Eye, History, LockKeyhole, PackageCheck, RotateCcw, Send, ShoppingCart, Truck, UserCheck, X, type LucideIcon } from "lucide-react";
import { cancelStockRequest, createStockRequest, expireDueStockRequests, fetchInventorySnapshot, fetchStockRequests, fetchTaskAssignees, prepareReservationShipment, reassignInventoryTask, releaseStockReservation, reserveRecommendedStock, type ApiInventoryTask, type ApiProduct, type ApiReservationAllocation, type ApiStockRequest, type ApiStockReservation, type ApiTaskAssignee } from "../api/inventory-api";

const today = new Date().toISOString().slice(0, 10);

interface ShipmentModalState {
  reservation: ApiStockReservation;
  request: { referenceNumber: string; requestedFor: string };
  allocation: ApiReservationAllocation;
}

export function StockReservationsPage() {
  const [requests, setRequests] = useState<ApiStockRequest[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [assignees, setAssignees] = useState<ApiTaskAssignee[]>([]);
  const [tab, setTab] = useState<"requests" | "reservations">("requests");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const refreshInProgress = useRef(false);
  const [form, setForm] = useState({ requestType: "CUSTOMER_ORDER", requestedFor: "", requiredDate: today, productId: "", quantity: "", notes: "" });
  const [shipmentModal, setShipmentModal] = useState<ShipmentModalState | null>(null);
  const [shipmentForm, setShipmentForm] = useState({ quantity: "", dueDate: today, dueTime: "17:00", priority: "MEDIUM", instructions: "", assignmentMode: "AUTO" as "AUTO" | "MANUAL" | "UNASSIGNED", assignedToId: "" });
  const [releaseModal, setReleaseModal] = useState<ApiStockReservation | null>(null);
  const [releaseReason, setReleaseReason] = useState("");
  const [cancelModal, setCancelModal] = useState<{ id: string; reference: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  const [reassignWorkerId, setReassignWorkerId] = useState<string>("");

  const refresh = useCallback(async (silent = false) => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    try {
      const [stockRequests, snapshot, taskAssignees] = await Promise.all([fetchStockRequests(), fetchInventorySnapshot(), fetchTaskAssignees()]);
      setRequests(stockRequests); setProducts(snapshot.products); setAssignees(taskAssignees); setLastUpdatedAt(new Date());
    } catch (error) {
      if (!silent) throw error;
    } finally {
      refreshInProgress.current = false;
    }
  }, []);
  useEffect(() => {
    let active = true;
    const initialRefreshId = window.setTimeout(() => {
      void refresh()
        .catch((error) => {
          if (active) setMessage(error instanceof Error ? error.message : "Reservation data could not be loaded.");
        })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    const refreshWhenVisible = () => {
      if (active && document.visibilityState === "visible") void refresh(true);
    };
    const intervalId = window.setInterval(refreshWhenVisible, 5_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);
  const reservations = useMemo(() => requests.flatMap((request) => request.reservations.map((reservation) => ({ ...reservation, request }))), [requests]);
  const reservationMetrics = useMemo(() => ({
    openRequests: requests.filter((request) => !["COMPLETED", "CANCELLED", "EXPIRED"].includes(request.status)).length,
    reservedUnits: requests.reduce((total, request) => total + request.lines.reduce((lineTotal, line) => lineTotal + line.reservedQuantity, 0), 0),
    shippedUnits: requests.reduce((total, request) => total + request.lines.reduce((lineTotal, line) => lineTotal + line.shippedQuantity, 0), 0),
    overdueRequests: requests.filter((request) => new Date(request.requiredDate) < new Date() && !["COMPLETED", "CANCELLED", "EXPIRED"].includes(request.status)).length,
  }), [requests]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusyId("create"); setMessage("");
    try {
      await createStockRequest({ requestType: form.requestType, requestedFor: form.requestedFor, requiredDate: new Date(`${form.requiredDate}T17:00:00`).toISOString(), notes: form.notes || undefined, lines: [{ productId: form.productId, requiredQuantity: Number(form.quantity) }] });
      setForm({ requestType: "CUSTOMER_ORDER", requestedFor: "", requiredDate: today, productId: "", quantity: "", notes: "" });
      setShowForm(false); setMessage("Stock request confirmed. It is ready for reservation."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The stock request could not be saved."); } finally { setBusyId(null); }
  }
  async function reserve(id: string) {
    setBusyId(id); setMessage("");
    try { await reserveRecommendedStock(id); setMessage("Available stock was reserved. On-hand stock did not change."); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Stock could not be reserved."); } finally { setBusyId(null); }
  }
  function openShipmentModal(reservation: ApiStockReservation, request: { referenceNumber: string; requestedFor: string }, allocation: ApiReservationAllocation) {
    const remaining = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity;
    setShipmentForm({ quantity: String(remaining), dueDate: today, dueTime: "17:00", priority: "MEDIUM", instructions: "", assignmentMode: "AUTO", assignedToId: "" });
    setShipmentModal({ reservation, request, allocation });
  }
  async function submitShipment(event: FormEvent) {
    event.preventDefault();
    if (!shipmentModal) return;
    setBusyId("shipment"); setMessage("");
    try {
      const quantity = Number(shipmentForm.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Enter a valid shipment quantity.");
      if (shipmentForm.assignmentMode === "MANUAL" && !shipmentForm.assignedToId) {
        throw new Error("Select a Warehouse Executive to assign this shipment to.");
      }
      const result = await prepareReservationShipment(shipmentModal.reservation.id, {
        allocationId: shipmentModal.allocation.id,
        quantity,
        assignmentMode: shipmentForm.assignmentMode,
        ...(shipmentForm.assignmentMode === "MANUAL" && shipmentForm.assignedToId ? { assignedToId: shipmentForm.assignedToId } : {}),
        dueAt: new Date(`${shipmentForm.dueDate}T${shipmentForm.dueTime || "17:00"}`).toISOString(),
        priority: shipmentForm.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        instructions: shipmentForm.instructions.trim() || undefined,
      });
      setShipmentModal(null);
      setMessage(result.idempotent
        ? `A shipment task for this quantity already exists and is still open (${result.task.shipmentReference ?? "no reference"}). No duplicate was created and no new reference was used.`
        : result.task.assignedTo
          ? `Shipment ${result.task.shipmentReference} prepared and assigned to ${result.task.assignedTo.displayName}. Stock is unchanged until the worker confirms the shipment.`
          : `Shipment ${result.task.shipmentReference} prepared and left unassigned. Assign a Warehouse Executive from the reservation card. Stock is unchanged.`);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The shipment could not be prepared."); } finally { setBusyId(null); }
  }
  async function submitRelease(event: FormEvent) {
    event.preventDefault();
    if (!releaseModal || !releaseReason.trim()) return;
    setBusyId(releaseModal.id); setMessage("");
    try {
      const result = await releaseStockReservation(releaseModal.id, releaseReason.trim());
      setReleaseModal(null); setReleaseReason("");
      setMessage(`Reservation released. The stock is available again${result.cancelledShipmentTasks ? ` and ${result.cancelledShipmentTasks} open shipment task(s) were cancelled.` : "."}`);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Reservation could not be released."); } finally { setBusyId(null); }
  }
  async function submitCancelRequest(event: FormEvent) {
    event.preventDefault();
    if (!cancelModal || !cancelReason.trim()) return;
    setBusyId(cancelModal.id); setMessage("");
    try {
      await cancelStockRequest(cancelModal.id, cancelReason.trim());
      setCancelModal(null); setCancelReason("");
      setMessage("Stock request cancelled. Unused reserved stock is available again and open shipment tasks were cancelled.");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Stock request could not be cancelled."); } finally { setBusyId(null); }
  }
  async function expireDue() {
    setBusyId("expire"); setMessage("");
    try { const result = await expireDueStockRequests(); setMessage(result.expiredRequests ? `${result.expiredRequests} overdue request(s) expired and unused stock was released.` : "No overdue stock requests required expiry."); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Overdue requests could not be checked."); } finally { setBusyId(null); }
  }
  async function reassign(taskId: string) {
    if (!reassignWorkerId) { setMessage("Select a Warehouse Executive to assign this task to."); return; }
    setBusyId(taskId); setMessage("");
    try {
      await reassignInventoryTask(taskId, reassignWorkerId);
      setExpandedTaskId(null); setReassignWorkerId("");
      setMessage("Shipment task reassigned. The worker was notified.");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The task could not be reassigned."); } finally { setBusyId(null); }
  }

  return <section id="manager-reservations" className="space-y-5">
    <div className="rounded-[28px] border border-[#dce7f5] bg-white p-6 shadow-[0_18px_50px_rgba(27,70,130,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#2366e8]">Stock allocation</p><h2 className="mt-1 text-2xl font-extrabold text-[#102a56]">Requests and reservations</h2><p className="mt-1 text-sm text-[#7187a5]">Protect available stock for confirmed customer, internal, production or shipment demand.</p><p className="mt-2 text-[11px] font-bold text-[#10895e]">Live updates every 5 seconds{lastUpdatedAt ? ` · last checked ${lastUpdatedAt.toLocaleTimeString()}` : ""}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busyId === "expire"} onClick={() => void expireDue()} className="rounded-2xl border border-[#d4e0ef] bg-white px-4 py-3 text-sm font-extrabold text-[#49678f] disabled:opacity-50"><Clock3 className="mr-2 inline" size={16} />Check expired</button><button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-2xl bg-[#1763f6] px-5 py-3 text-sm font-extrabold text-white">{showForm ? "Close form" : "+ New stock request"}</button></div></div>
      <div className="mt-5 flex gap-2 rounded-2xl bg-[#f3f7fc] p-1.5"><button type="button" onClick={() => setTab("requests")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-extrabold ${tab === "requests" ? "bg-white text-[#175fe4] shadow-sm" : "text-[#6f84a3]"}`}>Stock requests ({requests.length})</button><button type="button" onClick={() => setTab("reservations")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-extrabold ${tab === "reservations" ? "bg-white text-[#175fe4] shadow-sm" : "text-[#6f84a3]"}`}>Reservations ({reservations.length})</button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {([
        [ClipboardList, "Open requests", reservationMetrics.openRequests, "Demand awaiting completion", "text-[#1763f6] bg-[#edf4ff]"],
        [LockKeyhole, "Reserved units", reservationMetrics.reservedUnits, "Protected from available stock", "text-[#7257d6] bg-[#f2efff]"],
        [Truck, "Fulfilled units", reservationMetrics.shippedUnits, "Posted shipment quantity", "text-[#10895e] bg-[#eaf8f1]"],
        [Clock3, "Overdue requests", reservationMetrics.overdueRequests, "Require expiry review", "text-[#bd6509] bg-[#fff4df]"],
      ] as Array<[LucideIcon, string, number, string, string]>).map(([Icon, label, value, detail, tone]) => <article key={label} className="rounded-[22px] border border-[#dce7f5] bg-white p-4 shadow-[0_12px_30px_rgba(27,70,130,.06)]"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#7c91ad]">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span></div><p className="mt-3 text-2xl font-extrabold text-[#102a56]">{loading ? "—" : value}</p><p className="mt-1 text-xs font-semibold text-[#7b8fa9]">{detail}</p></article>)}
    </div>
    {message && <div role="status" className="rounded-2xl border border-[#cfe0f8] bg-[#f2f7ff] px-5 py-4 text-sm font-bold text-[#28568f]">{message}</div>}
    {loading && <div className="rounded-[24px] border border-[#dce7f5] bg-white p-10 text-center text-sm font-bold text-[#7187a5]"><RotateCcw className="mx-auto mb-3 animate-spin text-[#1763f6]" />Loading requests, reservations and stock availability…</div>}
    {showForm && <form onSubmit={submit} className="grid gap-4 rounded-[28px] border border-[#dce7f5] bg-white p-6 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Request source"><select value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })} className="input"><option value="CUSTOMER_ORDER">Customer order</option><option value="INTERNAL_REQUEST">Internal request</option><option value="PRODUCTION_ORDER">Production order</option><option value="SCHEDULED_SHIPMENT">Scheduled shipment</option></select></Field>
      <Field label="Order / request number"><div className="input flex items-center gap-2 bg-[#f7f9fc] text-[#627995]" aria-label="Order or request number is generated automatically"><LockKeyhole size={14} className="text-[#2f5d9c]" />Generated automatically</div></Field>
      <Field label="Requested for"><input required value={form.requestedFor} onChange={(e) => setForm({ ...form, requestedFor: e.target.value })} className="input" placeholder="Customer or department" /></Field>
      <Field label="Required date"><input required type="date" min={today} value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} className="input" /></Field>
      <div className="md:col-span-2"><Field label="Item"><select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input"><option value="">Select item</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} — {product.sku}</option>)}</select></Field></div>
      <Field label="Required quantity"><input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" /></Field>
      <div className="md:col-span-2 xl:col-span-3"><Field label="Notes (optional)"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" maxLength={500} placeholder="Delivery instructions or internal purpose" /></Field></div>
      <button disabled={busyId === "create"} className="self-end rounded-xl bg-[#1763f6] px-5 py-3 font-extrabold text-white disabled:opacity-50">{busyId === "create" ? "Saving..." : "Confirm request"}</button>
    </form>}
    {!loading && (tab === "requests" ? <div className="grid gap-4 xl:grid-cols-2">{requests.map((request) => { const required = request.lines.reduce((sum, line) => sum + line.requiredQuantity, 0); const reserved = request.lines.reduce((sum, line) => sum + line.reservedQuantity, 0); const shipped = request.lines.reduce((sum, line) => sum + line.shippedQuantity, 0); const open = !["COMPLETED", "CANCELLED", "EXPIRED"].includes(request.status); return <article key={request.id} className="rounded-[24px] border border-[#dce7f5] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold text-[#1763f6]">{request.requestNumber}{request.referenceNumber !== request.requestNumber ? ` · ${request.referenceNumber}` : ""}</p><h3 className="mt-1 text-lg font-extrabold text-[#17345f]">{request.requestedFor}</h3><p className="mt-1 text-xs font-semibold text-[#7b8fa9]"><ShoppingCart className="mr-1 inline" size={13} />{request.requestType.replaceAll("_", " ")}</p></div><span className="rounded-full bg-[#edf4ff] px-3 py-1 text-[10px] font-extrabold text-[#2366e8]">{request.status.replaceAll("_", " ")}</span></div>{request.notes && <p className="mt-3 rounded-xl bg-[#f7f9fc] px-4 py-3 text-xs font-semibold text-[#627995]">{request.notes}</p>}<div className="mt-4 space-y-2">{request.lines.map((line) => <div key={line.id} className="flex justify-between rounded-xl bg-[#f7f9fc] px-4 py-3 text-sm"><span className="font-bold text-[#29476e]">{line.product.name}</span><span className="font-extrabold text-[#17345f]">{line.reservedQuantity} reserved · {line.shippedQuantity} shipped · {line.requiredQuantity} required</span></div>)}</div><div className="mt-4 flex items-center justify-between text-xs text-[#7187a5]"><span className="flex items-center gap-1"><CalendarClock size={15} /> Required {new Date(request.requiredDate).toLocaleDateString()}</span><span>{reserved} reserved · {shipped} shipped · {required} required</span></div>{open && <div className="mt-4 grid gap-2 sm:grid-cols-2">{reserved + shipped < required && <button type="button" disabled={busyId === request.id} onClick={() => void reserve(request.id)} className="rounded-xl bg-[#10895e] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"><LockKeyhole className="mr-2 inline" size={16} />{busyId === request.id ? "Working..." : "Reserve available stock"}</button>}<button type="button" disabled={busyId === request.id} onClick={() => setCancelModal({ id: request.id, reference: request.referenceNumber })} className="rounded-xl border border-[#efb5b5] bg-[#fff7f7] px-4 py-3 text-sm font-extrabold text-[#b83f3f] disabled:opacity-50"><Ban className="mr-2 inline" size={16} />Cancel request</button></div>}{request.auditEvents?.length ? <details className="mt-4 rounded-xl border border-[#e1e9f3] p-3"><summary className="cursor-pointer text-xs font-extrabold text-[#49678f]"><History className="mr-2 inline" size={15} />Audit history ({request.auditEvents.length})</summary><div className="mt-3 space-y-2">{request.auditEvents.map((event) => <div key={event.id} className="rounded-lg bg-[#f7f9fc] p-3 text-xs text-[#627995]"><strong className="text-[#29476e]">{event.action.replaceAll("_", " ")}</strong> · {event.actor.displayName} · {new Date(event.createdAt).toLocaleString()}<p className="mt-1">{event.details || "No additional details."}</p></div>)}</div></details> : null}</article>; })}{requests.length === 0 && <Empty icon={ClipboardList} title="No stock requests" detail="Create a request only after real demand is confirmed." />}</div>
    : <div className="grid gap-4 xl:grid-cols-2">{reservations.map(({ request, ...reservation }) => { const active = reservation.status === "ACTIVE" || reservation.status === "PARTIALLY_SHIPPED"; return <article key={reservation.id} className="rounded-[24px] border border-[#dce7f5] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-extrabold text-[#10895e]">{reservation.reservationNumber}</p><h3 className="mt-1 text-lg font-extrabold text-[#17345f]">{request.referenceNumber} · {request.requestedFor}</h3><span className="mt-2 inline-block rounded-full bg-[#edf4ff] px-3 py-1 text-[10px] font-extrabold text-[#2366e8]">{reservation.status.replaceAll("_", " ")}</span></div><CheckCircle2 className="text-[#20a475]" /></div><div className="mt-4 space-y-2">{reservation.allocations.map((allocation) => { const remaining = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity; const shipmentTasks = (reservation.shipmentTasks ?? []).filter((task) => task.product?.id === allocation.product.id && task.sourceLocation?.id === allocation.location.id); const openShipment = shipmentTasks.find((task) => ["OPEN", "IN_PROGRESS"].includes(task.status)); return <div key={allocation.id} className="rounded-xl bg-[#f4f8fd] px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2 text-sm font-extrabold text-[#24466f]"><span>{allocation.product.name}</span><span>{remaining} {allocation.product.unit} remaining</span></div><p className="mt-1 text-xs text-[#7187a5]">{allocation.location.name} · {allocation.shippedQuantity} shipped · {allocation.releasedQuantity} released</p>{active && remaining > 0 && <button type="button" disabled={busyId === `prepare-${allocation.id}`} onClick={() => openShipmentModal(reservation, { referenceNumber: request.referenceNumber, requestedFor: request.requestedFor }, allocation)} className="mt-3 rounded-xl bg-[#1763f6] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"><Send className="mr-2 inline" size={15} />Prepare shipment</button>}{shipmentTasks.length > 0 && <div className="mt-3 space-y-2">{shipmentTasks.slice(0, 3).map((task) => <ShipmentTaskRow key={task.id} task={task} expanded={expandedTaskId === task.id} onToggle={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} assignees={assignees} reassigning={reassigningTaskId === task.id} onReassign={async (workerId) => { setReassigningTaskId(task.id); setReassignWorkerId(workerId); await reassign(task.id); }} busyId={busyId} />)}</div>}{openShipment && <p className="mt-2 text-[10px] font-bold text-[#2f5d9c]">Open shipment: {openShipment.shipmentReference ?? "no reference"} · {openShipment.status.replaceAll("_", " ")}</p>}</div>; })}</div>{active && <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" disabled={busyId === reservation.id} onClick={() => setReleaseModal(reservation)} className="rounded-xl border border-[#d8e4f3] px-4 py-2.5 text-sm font-extrabold text-[#48678f] disabled:opacity-50"><RotateCcw className="mr-2 inline" size={15} />Release reservation</button></div>}</article>; })}{reservations.length === 0 && <Empty icon={PackageCheck} title="No reservations" detail="Reserved quantities will appear here by item and location." />}</div>
    )}

    {shipmentModal && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1c38]/60 p-4" role="dialog" aria-modal="true" aria-label="Prepare shipment">
      <form onSubmit={(event) => void submitShipment(event)} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#1763f6]">Prepare shipment</p><h3 className="mt-1 text-xl font-extrabold text-[#102a56]">Ship reserved stock</h3><p className="mt-1 text-sm text-[#7187a5]">A SHIP task is created with the assignment mode you choose below. The internal shipment reference is generated automatically and cannot be edited. Stock does not change until the worker confirms.</p></div><button type="button" onClick={() => setShipmentModal(null)} className="rounded-xl border border-[#d8e1ee] p-2 text-[#536b8b] hover:bg-[#f7f9fc]" aria-label="Close shipment modal"><X size={18} /></button></div>
        <div className="mt-4 grid gap-3 rounded-2xl bg-[#f4f8fd] p-4 sm:grid-cols-2">
          <div><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]">Item</p><p className="mt-1 text-sm font-extrabold text-[#29466f]">{shipmentModal.allocation.product.name} — {shipmentModal.allocation.product.sku}</p></div>
          <div><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]">Source location</p><p className="mt-1 text-sm font-extrabold text-[#29466f]">{shipmentModal.allocation.location.name}</p></div>
          <div><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]">Remaining reserved</p><p className="mt-1 text-sm font-extrabold text-[#29466f]">{shipmentModal.allocation.quantity - shipmentModal.allocation.shippedQuantity - shipmentModal.allocation.releasedQuantity} {shipmentModal.allocation.product.unit}</p></div>
          <div><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]">Order / customer</p><p className="mt-1 text-sm font-extrabold text-[#29466f]">{shipmentModal.request.referenceNumber} · {shipmentModal.request.requestedFor}</p></div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Quantity to ship"><input required type="number" min="1" max={shipmentModal.allocation.quantity - shipmentModal.allocation.shippedQuantity - shipmentModal.allocation.releasedQuantity} value={shipmentForm.quantity} onChange={(e) => setShipmentForm({ ...shipmentForm, quantity: e.target.value })} className="input" /></Field>
          <Field label="Shipment reference"><div className="input flex items-center gap-2 text-[#627995]" aria-label="Shipment reference is generated automatically"><LockKeyhole size={14} className="text-[#2f5d9c]" />Generated automatically</div></Field>
          <Field label="Due date"><input required type="date" min={today} value={shipmentForm.dueDate} onChange={(e) => setShipmentForm({ ...shipmentForm, dueDate: e.target.value })} className="input" /></Field>
          <Field label="Due time"><input required type="time" value={shipmentForm.dueTime} onChange={(e) => setShipmentForm({ ...shipmentForm, dueTime: e.target.value })} className="input" /></Field>
          <Field label="Priority"><select value={shipmentForm.priority} onChange={(e) => setShipmentForm({ ...shipmentForm, priority: e.target.value })} className="input"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></Field>
          <div className="sm:col-span-2"><Field label="Instructions (optional)"><textarea value={shipmentForm.instructions} onChange={(e) => setShipmentForm({ ...shipmentForm, instructions: e.target.value })} className="input" maxLength={500} rows={2} placeholder="e.g. Stage at the dispatch door before the carrier arrives" /></Field></div>
          <div className="sm:col-span-2">
            <p className="text-xs font-extrabold text-[#405d84]">Assign task to</p>
            <div className="mt-2 space-y-2">
              {([
                ["AUTO", "Auto assign", "The system will select the available executive with the fewest open tasks.", true],
                ["MANUAL", "Select Warehouse Executive", "Choose an active executive from the list below.", false],
                ["UNASSIGNED", "Leave unassigned", "The task stays unassigned and a manager assigns it from the reservation card later.", false],
              ] as Array<["AUTO" | "MANUAL" | "UNASSIGNED", string, string, boolean]>).map(([mode, label, hint]) => (
                <label key={mode} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${shipmentForm.assignmentMode === mode ? "border-[#1763f6] bg-[#f0f6ff]" : "border-[#dce7f5] bg-white"}`}>
                  <input type="radio" name="shipmentAssignmentMode" value={mode} checked={shipmentForm.assignmentMode === mode} onChange={() => setShipmentForm({ ...shipmentForm, assignmentMode: mode })} className="mt-0.5 accent-[#1763f6]" />
                  <span className="text-xs font-extrabold text-[#29466f]">{label}</span>
                  <span className="text-[10px] font-semibold leading-4 text-[#7187a5]">{hint}</span>
                </label>
              ))}
            </div>
            {shipmentForm.assignmentMode === "MANUAL" && (
              <select value={shipmentForm.assignedToId} onChange={(e) => setShipmentForm({ ...shipmentForm, assignedToId: e.target.value })} className="input mt-2" aria-label="Select Warehouse Executive">
                <option value="">Select an executive…</option>
                {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.displayName} ({assignee.employeeId}) · {assignee.openTaskCount ?? 0} open tasks</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setShipmentModal(null)} className="rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b]">Cancel</button><button disabled={busyId === "shipment"} className="flex items-center gap-2 rounded-xl bg-[#1763f6] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"><Send size={16} />{busyId === "shipment" ? "Preparing..." : "Prepare shipment"}</button></div>
      </form>
    </div>}

    {releaseModal && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1c38]/60 p-4" role="dialog" aria-modal="true" aria-label="Release reservation">
      <form onSubmit={(event) => void submitRelease(event)} className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#1763f6]">Release reservation</p><h3 className="mt-1 text-xl font-extrabold text-[#102a56]">{releaseModal.reservationNumber}</h3><p className="mt-1 text-sm text-[#7187a5]">Unused reserved stock becomes available again and any open shipment tasks are cancelled. Already-shipped stock is never changed.</p></div><button type="button" onClick={() => setReleaseModal(null)} className="rounded-xl border border-[#d8e1ee] p-2 text-[#536b8b] hover:bg-[#f7f9fc]" aria-label="Close release modal"><X size={18} /></button></div>
        <Field label="Release reason"><textarea required value={releaseReason} onChange={(e) => setReleaseReason(e.target.value)} className="input" maxLength={300} rows={3} placeholder="Why is this reservation being released?" /></Field>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setReleaseModal(null)} className="rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b]">Cancel</button><button disabled={busyId === releaseModal.id} className="flex items-center gap-2 rounded-xl bg-[#c04343] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"><RotateCcw size={16} />{busyId === releaseModal.id ? "Releasing..." : "Release reservation"}</button></div>
      </form>
    </div>}

    {cancelModal && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1c38]/60 p-4" role="dialog" aria-modal="true" aria-label="Cancel stock request">
      <form onSubmit={(event) => void submitCancelRequest(event)} className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#1763f6]">Cancel stock request</p><h3 className="mt-1 text-xl font-extrabold text-[#102a56]">{cancelModal.reference}</h3><p className="mt-1 text-sm text-[#7187a5]">All unused reserved stock is released and open shipment tasks are cancelled.</p></div><button type="button" onClick={() => setCancelModal(null)} className="rounded-xl border border-[#d8e1ee] p-2 text-[#536b8b] hover:bg-[#f7f9fc]" aria-label="Close cancel modal"><X size={18} /></button></div>
        <Field label="Cancellation reason"><textarea required value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input" maxLength={300} rows={3} placeholder="Why is this request being cancelled?" /></Field>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setCancelModal(null)} className="rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b]">Keep request</button><button disabled={busyId === cancelModal.id} className="flex items-center gap-2 rounded-xl bg-[#c04343] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"><Ban size={16} />{busyId === cancelModal.id ? "Cancelling..." : "Cancel request"}</button></div>
      </form>
    </div>}
  </section>;
}

function ShipmentTaskRow({ task, expanded, onToggle, assignees, reassigning, onReassign, busyId }: {
  task: ApiInventoryTask;
  expanded: boolean;
  onToggle: () => void;
  assignees: ApiTaskAssignee[];
  reassigning: boolean;
  onReassign: (workerId: string) => Promise<void>;
  busyId: string | null;
}) {
  const [selectedWorker, setSelectedWorker] = useState("");
  const statusTone = task.status === "COMPLETED"
    ? "bg-[#eaf8f1] text-[#16865b]"
    : task.status === "CANCELLED"
      ? "bg-[#f3e9e9] text-[#a04545]"
      : "bg-[#edf4ff] text-[#2366e8]";
  return <div className="rounded-xl border border-[#dce7f5] bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-[#17345f]">Shipment {task.shipmentReference ?? "no reference"} <span className={`ml-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${statusTone}`}>{task.status.replaceAll("_", " ")}</span></p>
        <p className="mt-0.5 text-[10px] font-semibold text-[#7187a5]">{task.quantity} {task.product?.unit ?? "unit"} · assigned to {task.assignedTo?.displayName ?? "unassigned"}{task.dueAt ? ` · due ${new Date(task.dueAt).toLocaleString()}` : ""}</p>
      </div>
      <button type="button" onClick={onToggle} className="inline-flex items-center gap-1 rounded-lg border border-[#d8e4f3] px-2.5 py-1.5 text-[10px] font-extrabold text-[#2f5d9c]"><Eye size={13} />{expanded ? "Hide" : "View task"}</button>
    </div>
    {expanded && <div className="mt-3 space-y-2 border-t border-[#edf1f6] pt-3">
      {task.description && <p className="rounded-lg bg-[#f7f9fc] px-3 py-2 text-[10px] font-semibold leading-4 text-[#627995] whitespace-pre-line">{task.description}</p>}
      <div className="grid gap-2 text-[10px] font-semibold text-[#627995] sm:grid-cols-2">
        <p>Priority: <strong className="text-[#29466f]">{task.priority}</strong></p>
        <p>Prepared by: <strong className="text-[#29466f]">{task.preparedBy?.displayName ?? "—"}</strong></p>
        <p>Product: <strong className="text-[#29466f]">{task.product?.name ?? "—"}</strong></p>
        <p>Source: <strong className="text-[#29466f]">{task.sourceLocation?.name ?? "—"}</strong></p>
        {task.reservation?.request?.referenceNumber && <p>Order: <strong className="text-[#29466f]">{task.reservation.request.referenceNumber}</strong></p>}
        {task.dueAt && <p>Due: <strong className="text-[#29466f]">{new Date(task.dueAt).toLocaleString()}</strong></p>}
      </div>
      {["OPEN", "IN_PROGRESS"].includes(task.status) && <div className="flex flex-wrap items-center gap-2 border-t border-[#edf1f6] pt-2">
        <UserCheck size={14} className="text-[#2f5d9c]" />
        <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)} className="rounded-lg border border-[#d9e5f4] px-2 py-1.5 text-xs font-bold text-[#29466f]" aria-label="Reassign worker">
          <option value="">Reassign to…</option>
          {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.displayName} ({assignee.employeeId})</option>)}
        </select>
        <button type="button" disabled={!selectedWorker || reassigning || busyId === task.id} onClick={() => void onReassign(selectedWorker)} className="rounded-lg bg-[#1763f6] px-3 py-1.5 text-[10px] font-extrabold text-white disabled:opacity-50">{reassigning ? "Reassigning..." : "Assign / reassign"}</button>
      </div>}
    </div>}
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="text-xs font-extrabold text-[#405d84]">{label}<div className="mt-2 [&_.input]:w-full [&_.input]:rounded-xl [&_.input]:border [&_.input]:border-[#d9e5f4] [&_.input]:p-3">{children}</div></label>; }
function Empty({ icon: Icon, title, detail }: { icon: typeof ClipboardList; title: string; detail: string }) { return <div className="rounded-[24px] border border-dashed border-[#cbdaf0] bg-white p-10 text-center xl:col-span-2"><Icon className="mx-auto text-[#7e98ba]" /><h3 className="mt-3 font-extrabold text-[#17345f]">{title}</h3><p className="mt-1 text-sm text-[#7187a5]">{detail}</p></div>; }
