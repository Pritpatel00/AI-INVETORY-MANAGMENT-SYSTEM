import { Settings, ShieldCheck, Warehouse } from "lucide-react";
import type { Role } from "../types";

interface RoleSelectorProps {
  role: Role;
  setRole: (role: Role) => void;
}

export function RoleSelector({ role, setRole }: RoleSelectorProps) {
  return (
    <div className="role-selector grid gap-3 sm:grid-cols-3" aria-label="Select account role">
      <button
        type="button"
        onClick={() => setRole("worker")}
        aria-pressed={role === "worker"}
        className={`role-card rounded-2xl border p-4 text-left transition ${
          role === "worker"
            ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]"
            : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <Warehouse size={18} />
          Warehouse Executive
        </span>
        <span className="mt-1 block text-[11px] font-semibold leading-4 opacity-80">Count and move stock</span>
      </button>
      <button
        type="button"
        onClick={() => setRole("administrator")}
        aria-pressed={role === "administrator"}
        className={`role-card rounded-2xl border p-4 text-left transition ${
          role === "administrator"
            ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]"
            : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <Settings size={18} />
          Administrator
        </span>
        <span className="mt-1 block text-[11px] font-semibold opacity-75">Configure access and system controls</span>
      </button>
      <button
        type="button"
        onClick={() => setRole("manager")}
        aria-pressed={role === "manager"}
        className={`role-card rounded-2xl border p-4 text-left transition ${
          role === "manager"
            ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]"
            : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <ShieldCheck size={18} />
          Manager
        </span>
        <span className="mt-1 block text-[11px] font-semibold leading-4 opacity-80">Review and approve</span>
      </button>
    </div>
  );
}