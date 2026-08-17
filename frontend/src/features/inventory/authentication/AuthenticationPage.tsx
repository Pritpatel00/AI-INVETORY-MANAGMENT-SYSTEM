import { ChevronDown, ShieldCheck, Sparkles, UserRound, Warehouse } from "lucide-react";
import type { Role } from "../types";
import { Brand } from "../shared/Brand";
import { formatRoleLabel } from "../shared/helpers";
import { RoleSelector } from "./RoleSelector";

interface AuthenticationPageProps {
  role: Role;
  setRole: (role: Role) => void;
  onLogin: (employeeId: string) => void;
  authError: string;
  isLoading: boolean;
}

export function AuthenticationPage({ role, setRole, onLogin, authError, isLoading }: AuthenticationPageProps) {
  return (
    <main className="login-stage min-h-screen px-5 py-8 text-[#17345f] md:grid md:place-items-center">
      <div className="login-shell mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1120px] overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_30px_80px_rgba(15,45,85,0.14)] md:min-h-[680px] md:grid-cols-[1.05fr_0.95fr]">
        <section className="login-visual relative hidden overflow-hidden bg-[#0d3264] p-12 text-white md:flex md:flex-col md:justify-between">
          <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full border-[55px] border-white/5" />
          <div className="absolute -bottom-32 -left-28 h-96 w-96 rounded-full bg-[#155eef]/25 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#155eef]">
              <Warehouse size={23} />
            </div>
            <span className="text-lg font-extrabold">Inventory Management</span>
          </div>
          <div className="relative max-w-[470px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#bdd3ff]">
              <Sparkles size={14} />
              AI-enabled warehouse operations
            </div>
            <h1 className="text-[42px] font-extrabold leading-[1.08] tracking-[-0.045em]">
              Inventory updates,<br />spoken naturally.
            </h1>
            <p className="mt-5 max-w-[430px] text-base leading-7 text-[#c6d6ec]">
              Give warehouse teams a faster way to receive, move, count and report stock\u2014with confirmation and complete accountability.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {[
              ["Speak", "Natural voice entry"],
              ["Confirm", "Executive-controlled"],
              ["Audit", "Every action recorded"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <p className="text-sm font-extrabold">{title}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#adc3e0]">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-7 sm:p-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 md:hidden"><Brand /></div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#155eef]">Secure access</p>
            <h2 className="mt-3 text-[32px] font-extrabold tracking-[-0.04em] text-[#102a56]">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-[#7489a7]">Select your role, then sign in to open the correct workspace.</p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                onLogin(String(formData.get("employeeId") ?? ""));
              }}
            >
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-[#29466f]">Continue as</legend>
                <RoleSelector role={role} setRole={setRole} />
              </fieldset>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#29466f]">Employee ID</span>
                <div className="flex items-center gap-3 rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 focus-within:border-[#6f9cff] focus-within:ring-4 focus-within:ring-[#e7efff]">
                  <UserRound size={18} className="text-[#7890b0]" />
                  <input
                    aria-label="Employee ID"
                    name="employeeId"
                    placeholder="worker1, manager1 or admin1"
                    className="h-12 w-full bg-transparent text-sm font-semibold text-[#17345f] outline-none"
                  />
                </div>
              </label>
              {authError && (
                <div className="rounded-xl border border-[#ffd1d1] bg-[#fff2f2] px-4 py-3 text-sm font-semibold text-[#a73737]">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(21,94,239,0.26)] transition hover:bg-[#0f4fd4] disabled:cursor-wait disabled:opacity-65"
              >
                {isLoading ? "Checking secure access\u2026" : `Continue as ${formatRoleLabel(role)}`}
                <ChevronDown size={17} className="-rotate-90" />
              </button>
            </form>
            <div className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#f4f8fd] px-4 py-3 text-center text-xs font-semibold text-[#6c82a2]">
              <ShieldCheck size={16} className="text-[#16865b]" />
              Your password is entered securely in Keycloak and is never stored by this application.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}