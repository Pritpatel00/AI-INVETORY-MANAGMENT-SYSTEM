# Inventory Transaction Engine

## Two-step transaction flow

1. The application validates the action, product, quantity and locations.
2. It creates a `PENDING` transaction in the audit ledger.
3. The worker reviews and confirms the transaction.
4. The engine either posts the movement or holds it for manager review.

Creating a transaction never changes stock by itself.

## Action rules

| Action | Required location | Confirmation result |
|---|---|---|
| Receive | Destination | Adds quantity and marks the transaction `POSTED` |
| Ship | Source | Subtracts quantity when sufficient stock exists |
| Transfer | Source and destination | Subtracts and adds in one database operation |
| Cycle count | Counted location | Records confirmation and stays `PENDING` |
| Damage | Source | Records confirmation and stays `PENDING` |

Different cycle counts and damage are intentionally held because they can create an
inventory discrepancy. A manager can approve, reject or request a recount.

## Manager decisions

- **Approve:** posts the adjustment atomically and records the manager and time.
- **Reject:** records `REJECTED`; stock remains unchanged.
- **Request recount:** records `RECOUNT_REQUESTED`; stock remains unchanged.
- Workers cannot use any manager decision endpoint.
- A manager cannot review a risky transaction until the worker has confirmed it.

For Cycle Count, the approved quantity becomes the physical balance. Approval
is blocked when that count is below already reserved stock. For Damage, the
approved quantity is subtracted only when enough available stock exists.

## Safety controls

- The API obtains the user from the signed Keycloak token.
- Workers can access only their own transactions.
- Managers and administrators can review all transactions.
- A client request id prevents duplicate submissions.
- Confirming an already posted transaction makes no second stock change.
- Shipping, usage and transfers cannot create negative available stock.
- Stock balances and transaction status are committed atomically.
- Serializable database transactions protect concurrent stock updates.

## Verified scenarios

- Duplicate receiving request returned the original transaction.
- Receiving increased the destination balance once.
- Repeated confirmation was idempotent.
- Shipping more than available stock returned `409 Conflict`.
- Rejected shipping left the balance unchanged.
- Ship and Transfer posted successfully.
- Cycle Count was routed to `PENDING_REVIEW`.
- Worker attempts to approve a manager-review transaction returned `403`.
- Manager approval posted a confirmed cycle count.
- Reject and Request Recount left the stock balance unchanged.
