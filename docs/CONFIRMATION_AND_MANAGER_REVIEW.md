# Worker Confirmation and Manager Review

## Worker flow

1. The worker records an inventory statement.
2. Whisper transcribes it and AI extraction starts automatically.
3. Missing details are collected one question at a time.
4. The worker reviews the approved item, quantity, action and location.
5. **Hear full details** speaks the complete proposal.
6. **Correct details** returns to the editable transcript.
7. **Start another update** cancels the proposal without creating a transaction.
8. **Confirm inventory update** creates the pending audit transaction and
   applies the confirmation rules.

The transaction stores the reviewed transcript, worker identity, time and
linked voice evidence.

## Confirmation outcomes

| Action | Worker-confirmation outcome |
|---|---|
| Receive, Ship, Use, Transfer | Valid movement is posted atomically |
| Cycle Count, Damage, Loss | Remains pending for manager review |

Creating the pending record alone never changes stock.

## Manager flow

The manager dashboard shows only worker-confirmed Cycle Count, Damage and Loss
transactions.

- **Approve and post:** validates the current balance and posts the adjustment.
- **Request recount:** records `RECOUNT_REQUESTED`; no stock changes.
- **Reject:** records `REJECTED`; no stock changes.

Every decision records the manager identity, decision time and review note.
Manager endpoints reject worker access even if someone manually calls the API.

## Safety verification

Run:

```powershell
npm run workflow:verify
```

The verification confirms:

1. Worker confirmation produces `PENDING_REVIEW` for a cycle count.
2. A worker cannot approve the transaction.
3. Manager approval posts successfully.
4. Rejection does not change stock.
5. Request Recount does not change stock.
6. The final balance remains correct.
