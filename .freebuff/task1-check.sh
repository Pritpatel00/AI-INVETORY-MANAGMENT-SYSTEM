#!/usr/bin/env bash
echo "=== user auto-provisioning in API auth/keycloak ==="
grep -rn 'user.create\|user.upsert\|ensureUser\|provision\|findFirst.*user\|findUnique.*user' services/api/src/ --include='*.ts' | grep -v '.spec.' | head -10
echo
echo "=== auth.controller / keycloak guard user handling ==="
grep -rn 'user' services/api/src/auth/keycloak-auth.guard.ts | head -10
echo
echo "=== voice spec beforeAll needs (seed/product) ==="
grep -n -B2 -A8 'beforeAll\|seed\|balance\|product' tests/e2e/voice-capture-flow.spec.ts | head -40
echo
echo "=== who calls db:seed / seed-catalog / seed.ts anywhere ==="
grep -rn 'db:seed\|seed-catalog\|seed-warehouse\|seed-test' --include='*.json' --include='*.md' --include='*.ts' --include='*.mjs' --include='*.ps1' . 2>/dev/null | grep -v node_modules | grep -v '.freebuff' | head -20
echo
echo "=== seed-suppliers.ts referenced by any script? ==="
grep -rn 'seed-suppliers' services/api/package.json package.json infrastructure/ tests/ 2>/dev/null | head -5
echo "(empty = orphaned)"
