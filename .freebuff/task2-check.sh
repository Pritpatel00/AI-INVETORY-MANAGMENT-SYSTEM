#!/usr/bin/env bash
echo "=== worker Settings section content (2260-2320) ==="
sed -n '2260,2320p' src/features/inventory/InventoryApp.tsx
echo
echo "=== all 'page ===' conditionals in InventoryApp ==="
grep -n 'page ===' src/features/inventory/InventoryApp.tsx | head -25
echo
echo "=== worker dashboard page-content switch (grep for activePage/renderedPage) ==="
grep -n 'const renderedPage\|renderedPage\|page === "Overview"\|page === "Settings"' src/features/inventory/InventoryApp.tsx | head -10
