# PWA and Temporary Offline Work

## What this milestone provides

The worker website is now installable as a Progressive Web App. A service worker
caches the application shell and static files, while IndexedDB keeps temporary
worker-confirmed updates on the current device when the network disappears.

PostgreSQL remains the official inventory record. IndexedDB is only a temporary
outbox and is never treated as the current stock balance.

## Safe offline workflow

```text
AI proposal is ready
        |
Worker confirms
        |
Network unavailable?
   | No                 | Yes
   v                    v
Normal protected API    Save proposal + permanent request ID in IndexedDB
   |                    |
Stock rule executes     No stock changes
                        |
                  Connection returns
                        |
                  Same worker is signed in
                        |
                  Submit through protected API
                        |
                  Backend duplicate check
                        |
                  Confirm once and remove from device queue
```

## Safety controls

- Only a complete proposal that the worker explicitly confirms can be queued.
- Every saved update keeps its original `clientRequestId`.
- Queue records are separated by the authenticated Keycloak user ID.
- Synchronization runs only for the signed-in Worker workspace.
- Updates are synchronized in order.
- Synchronization stops after an error and retries later.
- The API remains responsible for permissions, stock availability and duplicate
  prevention.
- Closing or retrying the app cannot apply the same request twice.
- No inventory stock changes inside IndexedDB or the service worker.

## Important limitation

Voice transcription and AI extraction require the local backend services. The
offline queue protects a proposal that has already been prepared and confirmed
when the connection is interrupted. For security, a user who completely closes
the application may need connectivity to Keycloak before reopening and
synchronizing it.

## Install the web application

1. Open the inventory website in Chrome or Edge.
2. Sign in normally.
3. Use the browser menu and select **Install app** or **Apps → Install Nirka AI
   Voice Inventory**.
4. On a phone, select **Add to Home Screen**.

The local development URL can be installed because `localhost` is treated as a
secure development origin.

## Manual offline test

1. Sign in to the Worker workspace.
2. Complete a voice statement until **Confirm inventory update** is available.
3. In browser developer tools, change the network setting to **Offline**.
4. Select **Confirm inventory update**.
5. Confirm that the page says the update is saved on the device and that no
   stock changed.
6. Return the network setting to **Online**.
7. Confirm the header shows synchronization and then **Saved updates
   synchronized**.
8. Open the worker history or Manager audit view and confirm the transaction
   exists once.

Do not stop PostgreSQL to simulate an offline browser. Use the browser network
setting so the server remains available when connectivity is restored.
