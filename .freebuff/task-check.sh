#!/usr/bin/env bash
echo "=== voice spec: Blue Widget + Supplier X usage ==="
sed -n '60,120p' tests/e2e/voice-capture-flow.spec.ts
echo "..."
sed -n '360,395p' tests/e2e/voice-capture-flow.spec.ts
echo
echo "=== checkMicrophoneAccess / testSpeaker defs + callers ==="
grep -n 'checkMicrophoneAccess\|testSpeaker' src/features/inventory/InventoryApp.tsx
echo
echo "=== any manager-side 'Settings' nav/render (should be none) ==="
sed -n '2456,2456p' src/features/inventory/InventoryApp.tsx
sed -n '2456,4440p' src/features/inventory/InventoryApp.tsx | grep -n '"Settings"' | head -5
echo "(empty = manager dashboard has no Settings page)"
