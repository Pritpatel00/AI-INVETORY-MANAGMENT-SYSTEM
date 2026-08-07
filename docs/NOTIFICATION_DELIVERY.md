# Reorder Notification Delivery

## Purpose

This step turns an approved low-stock purchase-order draft into a traceable
supplier email. Email delivery runs in the background so the manager dashboard
does not freeze while the mail server is processing a message.

## Local workflow

```text
Manager approves draft
        |
Manager queues email
        |
PostgreSQL records QUEUED
        |
BullMQ adds a job to Valkey
        |
Nodemailer sends through SMTP
        |
Mailpit captures the test message
        |
PostgreSQL records SENT
```

If SMTP is temporarily unavailable, the worker tries up to three times with an
increasing delay. After the final failure, PostgreSQL records `FAILED`, the
attempt count and the latest error. Only a manager or administrator can use
**Retry email**.

## Delivery states

| State | Meaning | Manager action |
|---|---|---|
| Not queued | Draft is approved but not submitted for delivery | Queue email |
| Email queued | The background worker is processing the message | Wait |
| Delivery failed | All automatic attempts failed | Review error and retry |
| Email sent | SMTP accepted the message | No action required |

Inventory stock is never changed by queueing, sending or retrying an email.

## Start local services

```powershell
npm run notifications:local:start
```

Open the local test inbox:

```text
http://localhost:8025
```

Stop the services when they are not required:

```powershell
npm run notifications:local:stop
```

## Configuration

The API reads these values from `services/api/.env`:

```text
VALKEY_HOST=127.0.0.1
VALKEY_PORT=6379
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=Nirka Inventory <inventory@nirka.local>
```

The local settings point to Mailpit and never send outside the development
computer. Before production, use the approved company SMTP/Postfix details,
verified sender identity and verified supplier addresses. Store any SMTP
password in the production secret manager, not in source control.

## Verification

```powershell
npm run notifications:verify
```

The test:

1. Delivers one approved draft to Mailpit.
2. Temporarily stops only Mailpit.
3. Confirms three failed attempts and a stored error.
4. Confirms a Worker cannot retry.
5. Restarts Mailpit and confirms a Manager retry succeeds.
6. Confirms inventory balances did not change.
7. Restores the temporary Keycloak test setting and leaves Mailpit running.
