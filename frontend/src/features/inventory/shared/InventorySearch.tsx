import { Search, X, PackageCheck, Warehouse, FileClock, type LucideIcon } from "lucide-react";
import { useState, useMemo } from "react";
import type { Role } from "../types";
import { fetchInventorySnapshot, type InventorySnapshot } from "../api/inventory-api";

interface InventorySearchProps {
  role: Role;
  onNavigate: (page: string) => void;
}

export function InventorySearch({ role, onNavigate }: InventorySearchProps) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<InventorySnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function prepareSearch() {
    setOpen(true);
    if (data || loading) return;
    setLoading(true);
    try { setData(await fetchInventorySnapshot()); } catch { setData(null); }
    finally { setLoading(false); }
  }

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2 || !data) return [];
    const productSection = role === "administrator" || role === "manager" ? "admin-warehouse-setup" : "voice-entry";
    const locationSection = role === "administrator" || role === "manager" ? "admin-locations" : "voice-entry";
    const transactionSection = role === "manager" ? "manager-audit-history" : role === "administrator" ? "admin-items" : "worker-history";
    return [
      ...data.products.filter((item) => `${item.sku} ${item.name}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ id: `p-${item.id}`, title: item.name, detail: `${item.sku} · Product`, section: productSection, icon: PackageCheck as LucideIcon })),
      ...data.locations.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(term)).slice(0, 3).map((item) => ({ id: `l-${item.id}`, title: item.name, detail: `${item.code} · Location`, section: locationSection, icon: Warehouse as LucideIcon })),
      ...data.transactions.filter((item) => `${item.id} ${item.action} ${item.product.name} ${item.referenceNumber ?? ""}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ id: `t-${item.id}`, title: `${item.action.replaceAll("_", " ")} · ${item.product.name}`, detail: `TX-${item.id.slice(0, 8).toUpperCase()} · ${item.status}`, section: transactionSection, icon: FileClock as LucideIcon })),
    ].slice(0, 8);
  }, [data, query, role]);

  function selectResult(section: string) {
    setOpen(false); setQuery("");
    const pages: Record<string, string> = {
      "admin-warehouse-setup": "Catalog",
      "admin-locations": "Locations",
      "admin-items": "Items",
      "manager-audit-history": "Transactions",
      "voice-entry": "Voice entry",
      "worker-history": "History",
    };
    onNavigate(pages[section] ?? "Overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative hidden sm:block">
      <div className="flex items-center gap-2 rounded-[10px] border border-[#e4e7ec] bg-[#f9fafb] px-3 transition focus-within:border-[#155eef] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d1e0ff]">
        <Search size={15} className="text-[#667085]" aria-hidden="true" />
        <input
          value={query}
          onFocus={() => void prepareSearch()}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.currentTarget.blur(); } }}
          aria-label="Search inventory"
          placeholder="Search items, locations, TX&hellip;"
          className="h-9 w-44 bg-transparent text-[12px] font-semibold outline-none xl:w-60"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[#667085] hover:text-[#155eef]"><X size={14} aria-hidden="true" /></button>}
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-[12px] border border-[#e4e7ec] bg-white shadow-[0_12px_28px_rgba(16,24,40,0.12)]">
          {loading ? (
            <p className="px-5 py-6 text-center text-[12px] font-bold text-[#667085]">Searching inventory\u2026</p>
          ) : results.length ? (
            <div className="p-2">
              {results.map((result) => {
                const ResultIcon = result.icon;
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectResult(result.section)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left hover:bg-[#f9fafb]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#eff4ff] text-[#155eef]">
                      <ResultIcon size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-bold text-[#101828]">{result.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#667085]">{result.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-7 text-center">
              <Search size={20} className="mx-auto text-[#98a2b3]" aria-hidden="true" />
              <p className="mt-2 text-[12px] font-bold text-[#101828]">No matching inventory records</p>
              <p className="mt-1 text-[11px] text-[#667085]">Try a product name, SKU, location or transaction number.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}