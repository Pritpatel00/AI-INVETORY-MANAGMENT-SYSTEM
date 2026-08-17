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
      "worker-history": "My history",
    };
    onNavigate(pages[section] ?? "Overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative hidden sm:block">
      <div className="flex items-center gap-2 rounded-xl border border-[#dce5f1] bg-[#f8fafc] px-3 transition focus-within:border-[#8db0ea] focus-within:bg-white focus-within:shadow-[0_8px_24px_rgba(21,94,239,0.1)]">
        <Search size={16} className="text-[#8497b0]" />
        <input
          value={query}
          onFocus={() => void prepareSearch()}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.currentTarget.blur(); } }}
          aria-label="Search inventory"
          placeholder="Search items, locations, TX&hellip;"
          className="h-10 w-44 bg-transparent text-xs font-semibold outline-none xl:w-60"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[#8497b0] hover:text-[#155eef]"><X size={14} /></button>}
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-[0_18px_55px_rgba(16,45,82,0.18)]">
          {loading ? (
            <p className="px-5 py-6 text-center text-xs font-bold text-[#7b8fa9]">Searching inventory\u2026</p>
          ) : results.length ? (
            <div className="p-2">
              {results.map((result) => {
                const ResultIcon = result.icon;
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectResult(result.section)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f3f7ff]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#155eef]">
                      <ResultIcon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-extrabold text-[#17345f]">{result.title}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#8295af]">{result.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-7 text-center">
              <Search size={21} className="mx-auto text-[#9aabc1]" />
              <p className="mt-2 text-xs font-extrabold text-[#496482]">No matching inventory records</p>
              <p className="mt-1 text-[10px] text-[#8a9bb3]">Try a product name, SKU, location or transaction number.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}