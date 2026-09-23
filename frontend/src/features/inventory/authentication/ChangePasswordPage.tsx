import { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Brand } from "../shared/Brand";
import { Alert, Button, Field, TextInput } from "../shared/ui";

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
  const message = validationError || authError;

  return (
    <main className="login-stage grid place-items-center px-4 py-8 text-[#101828]">
      <section className="login-shell mx-auto w-full max-w-[520px] p-6 sm:p-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Brand />
          <span className="grid h-10 w-10 place-items-center rounded-[10px] border border-[#e4e7ec] bg-[#f9fafb] text-[#155eef]">
            <LockKeyhole size={19} aria-hidden="true" />
          </span>
        </div>

        <p className="ui-eyebrow">Password update required</p>
        <h1 className="mt-2 text-[24px] font-bold tracking-[-0.02em] text-[#101828]">Create your private password</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#475467]">
          Welcome, {displayName || "team member"}. Your temporary password must be replaced before warehouse workspaces open.
        </p>

        <form
          className="mt-7 space-y-5"
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
          <Field label="Current temporary password" htmlFor="current-password">
            <TextInput
              id="current-password"
              aria-label="Current temporary password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          <Field label="New password" hint="At least 12 characters." htmlFor="new-password">
            <TextInput
              id="new-password"
              aria-label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </Field>

          <Field label="Confirm new password" htmlFor="confirm-password">
            <TextInput
              id="confirm-password"
              aria-label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </Field>

          {message && (
            <Alert tone="danger" role="alert" title="Password not updated">
              {message}
            </Alert>
          )}

          <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
            {isLoading ? "Updating password…" : "Save password and continue"}
          </Button>
        </form>

        <div className="auth-panel mt-6 flex items-center gap-2.5">
          <ShieldCheck size={15} className="shrink-0 text-[#067647]" aria-hidden="true" />
          <span>Passwords are hashed by the API and never stored in the browser.</span>
        </div>
      </section>
    </main>
  );
}
