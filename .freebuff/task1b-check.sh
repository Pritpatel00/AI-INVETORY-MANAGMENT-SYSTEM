#!/usr/bin/env bash
EX="--exclude-dir=node_modules --exclude-dir=build --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git --exclude-dir=.freebuff"

echo "=== auto-provisioning: user.create/upsert in api src ==="
grep -rn $EX -e 'user.create' -e 'user.upsert' -e 'ensureUser' -e 'provision' services/api/src --include='*.ts' | grep -v '.spec.' | head -8
echo
echo "=== keycloak-auth.guard user handling ==="
grep -n $EX -e 'user' services/api/src/auth/keycloak-auth.guard.ts | head -8
echo
echo "=== voice spec beforeAll (seed/product/balance refs) ==="
grep -n -e 'seed' -e 'balance' -e 'product' tests/e2e/voice-capture-flow.spec.ts | head -12
echo
echo "=== seed script references across repo (excl node_modules) ==="
grep -rn $EX -e 'db:seed' -e 'seed-catalog' -e 'seed-warehouse' -e 'seed-test' --include='*.json' --include='*.md' --include='*.ts' --include='*.mjs' --include='*.ps1' . 2>/dev/null | head -18
echo
echo "=== seed-suppliers referenced? ==="
grep -rn $EX 'seed-suppliers' . 2>/dev/null | head -4
echo "(empty = orphaned)"
