import { Check, Settings, ShieldCheck, Warehouse } from "lucide-react";
import type { Role } from "../types";

interface RoleSelectorProps {
  role: Role;
  setRole: (role: Role) => void;
}

const options: Array<{ role: Role; label: string; detail: string; icon: typeof Warehouse }> = [
  { role: "worker", label: "Warehouse Executive", detail: "Count and move stock", icon: Warehouse },
  { role: "manager", label: "Manager", detail: "Review, approve and plan stock work", icon: ShieldCheck },
  { role: "administrator", label: "Administrator", detail: "Manage items, access and system health", icon: Settings },
];

export function RoleSelector({ role, setRole }: RoleSelectorProps) {
  return (
    <div className="grid gap-2" role="group" aria-label="Select account role">
      {options.map(({ role: value, label, detail, icon: Icon }) => {
        const selected = role === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => setRole(value)}
            className={`role-card flex items-center gap-3 p-3 text-left ${
              selected ? "role-card-active" : "role-card-idle border border-[#e4e7ec] bg-white"
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${
                selected ? "bg-white text-[#155eef]" : "bg-[#f2f4f7] text-[#475467]"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-bold ${selected ? "text-[#155eef]" : "text-[#101828]"}`}>{label}</span>
              <span className="mt-0.5 block text-[11px] font-medium leading-4 text-[#667085]">{detail}</span>
            </span>
            <span className="shrink-0" aria-hidden="true">
              {selected ? (
                <Check size={16} className="text-[#155eef]" />
              ) : (
                <span className="block h-4 w-4 rounded-full border border-[#d0d5dd]" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
