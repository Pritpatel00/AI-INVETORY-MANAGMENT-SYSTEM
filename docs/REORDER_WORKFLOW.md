# Purchase Items Workflow

## Automatic low-stock detection

After a stock movement is posted, the backend checks every affected product and
location:

```text
Available stock = Quantity - Reserved quantity
Low stock = Available stock < Safety stock
```

When stock is low, the product appears on the manager's **Purchase Items** page.

## Suggested purchase quantity

The suggested purchase quantity is the larger of:

- the product's configured reorder quantity;
- the amount needed to restore stock above the safety level; or
- the approved supplier's minimum order quantity.

The calculation lives in the fixed backend rules engine (`evaluateReorder`) and
is applied by the inventory service when it syncs reorder drafts:

```text
suggestedQuantity = max(reorderQuantity, safetyStock - available, supplier.minimumOrderQuantity)
```

The supplier minimum is applied automatically: if the calculated suggestion is
below the supplier's minimum order quantity, the draft is stored with the
supplier minimum instead, so every purchase request respects the supplier's
minimum-order rule.

## Duplicate prevention

Each product and location can have only one active draft. Repeated balance
checks update that draft rather than creating another one. The database enforces
the active key (`productId:locationId`) as unique.

## Automatic removal when stock recovers

As soon as available stock returns to the safety level, the draft is cancelled
automatically and disappears from the Purchase Items page. No manager action is
required.

## Manager workflow

The manager dashboard displays a clean table with:

- item name and SKU;
- supplier name (when assigned);
- available quantity;
- safety-stock quantity;
- suggested purchase quantity; and
- low-stock status (low stock or out of stock).

The page supports:

- searching by product name or SKU;
- filtering by all, low-stock or out-of-stock items;
- sorting by shortage severity (or item name);
- a refresh button to re-check current balances.

When nothing is low, the page shows the empty state:

```text
No products currently require purchasing.
```

There are no email, approval or purchase-order controls on the page. The manager
reviews the available and required quantities and prepares the order outside
this system.

## Out of scope

The legacy supplier-email and purchase-order approval workflow was removed:

- approve / cancel reorder-draft endpoints;
- queue / retry supplier-email endpoints;
- Nodemailer delivery and BullMQ jobs;
- email-delivery status handling and retry logic;
- purchase-order email templates.

No supplier email is created or sent by this workflow.

## Verification

Run:

```powershell
npm run reorder:verify
```

The automated verification confirms:

1. Low stock creates a draft.
2. Rechecking stock creates no duplicate.
3. The suggested quantity follows the configured rules.
4. An item disappears when stock recovers.
5. Reorder actions do not change inventory stock.
6. No supplier email is created or sent.
