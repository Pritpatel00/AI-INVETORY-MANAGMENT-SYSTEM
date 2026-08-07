# Low-Stock Reorder Workflow

## Automatic threshold check

After a stock movement is posted, the backend checks every affected product and
location:

```text
Available stock = Quantity - Reserved quantity
Low stock = Available stock < Safety stock
```

When stock is low, the suggested reorder quantity is the larger of:

- the product's configured reorder quantity;
- the amount needed to return to the safety level; or
- the approved supplier's minimum order quantity.

The supplier minimum is applied automatically: if the calculated suggestion is
below the supplier's minimum order quantity, the draft is created with the
supplier minimum instead, so every purchase-order request respects the
supplier's minimum-order rule.

## Duplicate prevention

Each product and location can have only one active draft. Repeated balance
checks update that draft rather than creating another one. The database also
enforces the active key as unique.

If stock recovers while a draft is still unapproved, the draft is cancelled
automatically. Approved drafts remain active because procurement has already
made a decision.

## Manager workflow

The manager dashboard displays:

- product and warehouse location;
- available stock and safety level;
- suggested reorder quantity;
- supplier name and email;
- draft, approved, email-queued, delivery-failed or email-sent status;
- delivery attempt count and the latest error when delivery fails.

Available actions:

1. **Approve** records the manager and approval time.
2. **Cancel** closes the draft and clears its active key.
3. **Queue email** is available only after approval and only when the product
   has a configured supplier email.
4. **Retry email** is available after a final delivery failure.

## Expected receiving tasks

Approving a draft automatically creates an expected-receiving task in the
worker task queue, linked to the purchase order:

- task type `RECEIVE` with high priority;
- the product, warehouse location and approved order quantity;
- due at the end of the supplier's lead time (or today when no lead time is
  configured);
- unassigned at first: any available warehouse executive can claim it from the
  queue by starting it, and the claim is recorded on the task.

The unique purchase-order link guarantees exactly one task per approved order,
even when approval is retried. Cancelling a draft - manually or automatically
when stock recovers - closes the linked task unless it was already completed.

## Email delivery

Queueing an approved draft records `QUEUED` in PostgreSQL and submits a
background BullMQ job through Valkey. Nodemailer delivers the purchase-order
request through the configured SMTP server.

Each job can try three times with an increasing delay:

```text
APPROVED -> QUEUED -> SENT
                    -> FAILED -> manager retry -> QUEUED -> SENT
```

The draft stays approved when delivery fails. The manager can see the latest
error and retry without approving the draft again. A successful delivery marks
the draft `SENT` and closes its active duplicate-prevention key.

Local development uses Mailpit, which captures messages in a browser-accessible
test inbox instead of contacting a real supplier. Production must use the
company-approved SMTP/Postfix server and verified supplier addresses.

## Verification

Run:

```powershell
npm run reorder:verify
npm run notifications:verify
```

The automated verification confirms:

1. Low stock creates a draft.
2. Rechecking stock creates no duplicate.
3. The suggested quantity follows the configured rules.
4. Worker access is rejected.
5. Manager approval succeeds.
6. Supplier email is queued only after approval.
7. Approving a draft creates one expected-receiving task in the worker queue.
8. Re-approving the same draft does not create a second task.
9. Cancelling a draft closes its open receiving task.
10. Cancellation succeeds.
11. Reorder actions do not change inventory stock.
12. A queued message reaches the local test inbox.
13. Temporary SMTP failure is recorded after three attempts.
14. A worker cannot retry a failed supplier email.
15. A manager retry succeeds after SMTP recovers.
