"use client";

/**
 * Worker "Active items" page — the read-only live inventory catalogue.
 *
 * This was previously only reachable from a quick-toolbar section that the
 * worker dashboard never rendered, so the page value "Active items" had no
 * screen. It is now a first-class page, wired in `ExecutiveDashboard.tsx`.
 *
 * Read-only: it renders the snapshot the rest of the worker workspace already
 * loads (`fetchInventorySnapshot`) and never calls the API itself.
 */

import { useMemo, useState } from "react";
import { ArrowLeft, Boxes, Search } from "lucide-react";
import { Alert, Badge, Button, StatusDot, TextInput } from "../shared/ui";
import type { InventorySnapshot } from "../api/inventory-api";

interface ExecutiveActiveItemsProps {
  snapshot: InventorySnapshot | null;
  onBack: () => void;
  /** Existing workspace message (refresh/error banner), shown when present. */
  message?: string;
}

type StockState = "in-stock" | "low-stock" | "out-of-stock";

const stockCopy: Record<StockState, { label: string; tone: "success" | "warning" | "danger"; glyph: string }> = {
  "in-stock": { label: "In stock", tone: "success", glyph: "✓" },
  "low-stock": { label: "At or below safety stock", tone: "warning", glyph: "!" },
  "out-of-stock": { label: "No available units", tone: "danger", glyph: "×" },
};

export function ExecutiveActiveItems({ snapshot, onBack, message }: ExecutiveActiveItemsProps) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const products = snapshot?.products ?? [];
    const balances = snapshot?.balances ?? [];
    return products.map((product) => {
      const productBalances = balances.filter((balance) => balance.product.id === product.id);
      const available = productBalances.reduce(
        (total, balance) => total + Math.max(0, balance.quantity - balance.reservedQuantity),
        0,
      );
      const state: StockState =
        available <= 0 ? "out-of-stock" : available <= product.safetyStock ? "low-stock" : "in-stock";
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        locationCodes: Array.from(new Set(productBalances.map((balance) => balance.location.code))),
        available,
        state,
      };
    });
  }, [snapshot]);

  const term = query.trim().toLowerCase();
  const visibleRows = useMemo(() => {
    if (!term) return rows;
    return rows.filter((row) =>
      `${row.sku} ${row.name} ${row.locationCodes.join(" ")}`.toLowerCase().includes(term),
    );
  }, [rows, term]);

  return (
    <div className="space-y-5" data-page="Active items">
      <header className="flex flex-col gap-3 border-b border-[#e4e7ec] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#667085]">
            Live inventory catalogue
          </p>
          <h1 className="mt-1 text-[20px] font-bold leading-tight text-[#101828] sm:text-[22px]">
            Active items
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[#475467]">
            Current on-hand information across every warehouse location — read-only. Availability
            already excludes reserved stock.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusDot tone={snapshot ? "healthy" : "unknown"} label={snapshot ? "Live inventory data" : "Loading inventory data"} />
            <Badge tone="neutral">
              {rows.length} active item{rows.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>
          Back to Overview
        </Button>
      </header>

      {message ? (
        <Alert tone="info" icon={Boxes} role="status" title="Workspace message">
          {message}
        </Alert>
      ) : null}

      <section
        aria-labelledby="active-items-table-title"
        className="overflow-hidden rounded-[16px] border border-[#e4e7ec] bg-white"
      >
        <div className="flex flex-col gap-3 border-b border-[#e4e7ec] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 id="active-items-table-title" className="text-[15px] font-bold text-[#101828]">
              Catalogue
            </h2>
            <p className="mt-0.5 text-[12px] leading-5 text-[#475467]">
              Search by SKU, product name or location code.
            </p>
          </div>
          <div className="w-full sm:w-[280px]">
            <label htmlFor="active-items-search" className="sr-only">
              Search active items
            </label>
            <div className="flex items-center gap-2 rounded-[10px] border border-[#e4e7ec] bg-[#f9fafb] px-3 transition focus-within:border-[#155eef] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d1e0ff]">
              <Search size={15} className="shrink-0 text-[#667085]" aria-hidden="true" />
              <TextInput
                id="active-items-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the catalogue…"
                className="min-h-[38px] border-0 bg-transparent px-0 shadow-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <caption className="sr-only">
              Active items with unit, storage locations and available quantity
            </caption>
            <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-[0.08em] text-[#667085]">
              <tr>
                {["SKU", "Product", "Unit", "Locations", "Available", "Stock status"].map((heading) => (
                  <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold sm:px-5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f7] text-[13px] text-[#344054]">
              {visibleRows.map((row) => (
                <tr key={row.id} className="hover:bg-[#f9fafb]">
                  <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                    <span className="rounded-[6px] border border-[#e4e7ec] bg-[#f9fafb] px-2 py-1 font-mono text-[12px] font-semibold text-[#344054]">
                      {row.sku}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#101828] sm:px-5">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[#475467] sm:px-5">{row.unit}</td>
                  <td className="px-4 py-3.5 sm:px-5">
                    {row.locationCodes.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {row.locationCodes.map((code) => (
                          <span
                            key={code}
                            className="rounded-full bg-[#eff4ff] px-2.5 py-1 text-[11px] font-semibold text-[#175cd3]"
                          >
                            {code}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[#667085]">No location</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[15px] font-bold tabular-nums text-[#101828] sm:px-5">
                    {row.available}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                    <Badge tone={stockCopy[row.state].tone}>
                      <span aria-hidden="true" className="font-bold">
                        {stockCopy[row.state].glyph}
                      </span>
                      {stockCopy[row.state].label}
                    </Badge>
                  </td>
                </tr>
              ))}

              {snapshot === null ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10">
                    <span role="status" aria-live="polite" className="flex items-center justify-center gap-3 text-[13px] font-semibold text-[#475467]">
                      <span className="ui-spinner text-[#155eef]" aria-hidden="true" />
                      Loading live inventory from the warehouse service…
                    </span>
                  </td>
                </tr>
              ) : null}

              {snapshot !== null && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-[14px] font-bold text-[#101828]">No active items yet</p>
                    <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-[#475467]">
                      Once products and opening balances exist, they appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : null}

              {snapshot !== null && rows.length > 0 && visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-[14px] font-bold text-[#101828]">
                      No items match “{query.trim()}”
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-[#475467]">
                      Check the SKU or try a shorter search term.
                    </p>
                    <div className="mt-3 flex justify-center">
                      <Button size="sm" onClick={() => setQuery("")}>
                        Clear search
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {term && visibleRows.length > 0 ? (
          <p role="status" aria-live="polite" className="border-t border-[#e4e7ec] px-5 py-3 text-[12px] font-semibold text-[#475467]">
            Showing {visibleRows.length} of {rows.length} active items.
          </p>
        ) : null}
      </section>
    </div>
  );
}
