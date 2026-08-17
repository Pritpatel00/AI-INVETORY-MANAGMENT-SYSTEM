import { Warehouse } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-white shadow-[0_10px_30px_rgba(21,94,239,0.28)]">
        <Warehouse size={23} strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-[15px] font-extrabold tracking-[-0.02em] text-[#102a56]">Inventory Management</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7690b5]">Voice intelligence</p>
      </div>
    </div>
  );
}