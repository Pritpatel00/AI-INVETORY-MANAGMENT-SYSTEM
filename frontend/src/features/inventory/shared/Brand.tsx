import { Warehouse } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup flex min-w-0 items-center gap-2.5">
      <div className="brand-mark grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#155eef] text-white">
        <Warehouse size={19} strokeWidth={2.2} aria-hidden="true" />
        <span className="brand-mark-glow" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-[14px] font-extrabold tracking-[-0.02em] text-[#101828]">Nirka</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#667085]">Inventory OS</p>
        </div>
      )}
    </div>
  );
}
