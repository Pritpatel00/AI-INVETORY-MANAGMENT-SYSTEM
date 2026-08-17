# Supplier-Email and Purchase-Order Approval (Removed)

## Status

The supplier-email and purchase-order approval workflow has been **removed** in
favour of a simplified low-stock **Purchase Items** page.

The following were removed:

- approve / cancel reorder-draft endpoints;
- queue / retry supplier-email endpoints;
- Nodemailer purchasing delivery and BullMQ supplier-email jobs;
- email-delivery status handling and retry logic;
- purchase-order email templates;
- Mailpit purchasing inbox instructions.

## Current workflow

See [REORDER_WORKFLOW.md](./REORDER_WORKFLOW.md) for the current Purchase Items
workflow. The manager reviews available and required quantities directly from
live balances; no email is created or sent.

## Local services

Valkey and Mailpit are no longer required for the purchasing workflow and are
not started by any purchasing command. The `notifications:local:*` scripts were
removed.