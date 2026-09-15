import { useState } from "react";
import { ShieldCheck, LockKeyhole } from "lucide-react";

import { Brand } from "../shared/Brand";

interface ChangePasswordPageProps {
  displayName: string;
  onSubmit: (currentPassword: string, newPassword: string) => void;
  authError: string;
  isLoading: boolean;
}

export function ChangePasswordPage({
  displayName,
  onSubmit,
  authError,
  isLoading,
}: ChangePasswordPageProps) {
  const [validationError, setValidationError] = useState("");

  return (
    <main className="login-stage min-h-screen px-5 py-8 text-[#17345f] md:grid md:place-items-center">
      <section className="mx-auto w-full max-w-[520px] rounded-[30px] border border-white bg-white p-7 shadow-[0_30px_80px_rgba(15,45,85,0.14)] sm:p-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Brand />
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf4ff] text-[#155eef]">
            <LockKeyhole size={22} />
          </div>
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#155eef]">Password update required</p>
        <h1 className="mt-3 text-[30px] font-extrabold tracking-[-0.04em] text-[#102a56]">Create your private password</h1>
        <p className="mt-2 text-sm leading-6 text-[#7489a7]">
          Welcome, {displayName || "team member"}. Your temporary password must be replaced before you can open inventory workspaces.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const currentPassword = String(formData.get("currentPassword") ?? "");
            const newPassword = String(formData.get("newPassword") ?? "");
            const confirmPassword = String(formData.get("confirmPassword") ?? "");
            if (newPassword.length < 12) {
              setValidationError("Use at least 12 characters for your new password.");
              return;
            }
            if (newPassword !== confirmPassword) {
              setValidationError("The new passwords do not match.");
              return;
            }
            setValidationError("");
            onSubmit(currentPassword, newPassword);
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#29466f]">Current temporary password</span>
            <input
              aria-label="Current temporary password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 text-sm font-semibold text-[#17345f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#29466f]">New password</span>
            <input
              aria-label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className="h-12 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 text-sm font-semibold text-[#17345f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#29466f]">Confirm new password</span>
            <input
              aria-label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className="h-12 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 text-sm font-semibold text-[#17345f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
            />
          </label>
          {(validationError || authError) && (
            <div className="rounded-xl border border-[#ffd1d1] bg-[#fff2f2] px-4 py-3 text-sm font-semibold text-[#a73737]">
              {validationError || authError}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(21,94,239,0.26)] transition hover:bg-[#0f4fd4] disabled:cursor-wait disabled:opacity-65"
          >
            {isLoading ? "Updating password…" : "Save password and continue"}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#f4f8fd] px-4 py-3 text-center text-xs font-semibold text-[#6c82a2]">
          <ShieldCheck size={16} className="text-[#16865b]" />
          Passwords are hashed by the API and never stored in the browser.
        </div>
      </section>
    </main>
  );
}
