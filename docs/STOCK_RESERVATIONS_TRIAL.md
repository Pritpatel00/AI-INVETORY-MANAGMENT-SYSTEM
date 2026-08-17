# Stock Reservations

Status: retained and completed for the production workflow.

Reservations protect stock for confirmed customer orders, internal requests,
production demand or scheduled shipments. They are controlled by managers and
administrators; warehouse executives continue using the normal inventory and
task workflows.

## Complete lifecycle

1. A manager creates a stock request with a unique order/reference number,
   requester, required date, item and quantity.
2. **Reserve available stock** allocates available quantity by location inside
   one database transaction.
3. On-hand stock remains unchanged. Reserved increases and Available decreases.
4. Additional stock can be reserved later when the request is only partially
   reserved.
5. **Prepare shipment** creates one actionable SHIP task for the selected
   reserved allocation. The internal shipment reference (SHIP-001, SHIP-002,
   …) is generated automatically from a database-backed counter; it can never
   be typed or edited. Preparing a shipment never changes stock.
6. The shipment task is assigned according to the chosen mode:
   - **Auto assign (default)** — the active Warehouse Executive with the
     fewest open tasks is selected (deterministic employee-id tie-break).
   - **Select Warehouse Executive** — the manager picks an active executive;
     the backend re-validates the user.
   - **Leave unassigned** — the task is stored with no assignee and the
     managers are notified to assign it from the reservation card.
7. The assigned worker starts and completes the task (manually or by voice).
   Completion posts the Ship transaction atomically: on-hand and reserved
   decrease together, the reservation becomes Partially Shipped or Completed,
   and the task leaves the queue. Valid shipments never enter manager
   approval.
8. **Fulfil and ship** (alternative path) consumes all remaining quantity in a
   reservation directly: both on-hand and reserved decrease together and a
   posted Ship transaction is created per allocation.
9. **Release reservation** returns unused reserved quantity to Available
   without changing on-hand and cancels any open shipment tasks.
10. **Cancel request** releases all unused reservations and closes the request.
11. **Check expired** closes overdue open requests and releases unused reserved
    stock. It never changes already shipped quantities.
12. Every create, reserve, prepare, assign/reassign, complete, fulfil, release,
    cancellation and expiry operation is recorded in reservation audit history
    with the actor, date, action and note. Prepare records the assignment mode
    (automatic, manual or unassigned).

## Shipment references

- References are issued by the `shipment_reference_counters` single-row table
  using an atomic `UPDATE ... RETURNING` inside the same transaction that
  creates the task, so two concurrent prepares can never receive the same
  number and a failed prepare rolls back without consuming one.
- The counter is initialised from the highest existing numeric SHIP reference
  and only moves forward: SHIP-999 continues to SHIP-1000 and cancelled,
  released, completed or deleted tasks never have their reference reused.
- A partial unique index guarantees no numeric SHIP reference is ever issued
  twice.
- Repeating or double-clicking a prepare returns the existing task and its
  reference (idempotent) instead of creating a duplicate task, notification,
  audit record or reference. A partial unique index on open SHIP tasks per
  reservation and quantity makes this safe under concurrency.

## Statuses

- Request: Confirmed, Partially Reserved, Fully Reserved, Partially Fulfilled,
  Completed, Cancelled or Expired.
- Reservation: Active, Partially Shipped, Completed, Released, Cancelled or
  Expired.

## Safety rules

- Duplicate order/reference numbers are rejected.
- The same item cannot appear twice in one request.
- Reservation cannot exceed Available stock.
- Fulfilment refuses inconsistent on-hand or reserved balances.
- Completed requests cannot be cancelled.
- Closed reservations cannot be fulfilled or released again.
- All lifecycle changes are atomic database transactions.

## Feature setting

The feature is enabled by default. It can still be temporarily hidden for a
deployment by setting both of these values to `false`:

- Frontend: `NEXT_PUBLIC_STOCK_RESERVATIONS_ENABLED`
- Backend: `STOCK_RESERVATIONS_ENABLED`
