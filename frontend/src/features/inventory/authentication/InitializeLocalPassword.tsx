import { useState } from "react";
import { KeyRound } from "lucide-react";
import { initializeAdministratorPassword, type ApiAuthenticatedUser } from "../api/inventory-api";
import { Alert, Button, Card, CardHeader, Field, TextInput } from "../shared/ui";

export function InitializeLocalPassword({
  onInitialized,
}: {
  onInitialized: (user: ApiAuthenticatedUser) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <Card className="mb-5">
      <CardHeader
        eyebrow="One-time setup"
        title={
          <span className="flex items-center gap-2">
            <KeyRound size={16} className="text-[#155eef]" aria-hidden="true" />
            Set up your local administrator password
          </span>
        }
        description="You are signed in through legacy SSO. Choose a new local password. This does not change your SSO password. Afterwards, sign out and use the Administrator workspace to verify local login. Use User Management to initialize manager and worker temporary passwords."
      />
      <form
        className="space-y-4 p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const password = String(data.get("newPassword") ?? "");
          if (password !== data.get("confirmPassword")) {
            setMessage("Passwords do not match.");
            return;
          }
          setBusy(true);
          setMessage("");
          try {
            const user = await initializeAdministratorPassword(password);
            form.reset();
            onInitialized(user);
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Password setup failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New local password" hint="At least 12 characters." htmlFor="init-new-password">
            <TextInput
              id="init-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={200}
              required
              disabled={busy}
            />
          </Field>
          <Field label="Confirm local password" htmlFor="init-confirm-password">
            <TextInput
              id="init-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={200}
              required
              disabled={busy}
            />
          </Field>
        </div>

        {message && (
          <Alert tone="danger" role="alert">
            {message}
          </Alert>
        )}

        <Button type="submit" variant="primary" loading={busy}>
          {busy ? "Setting password…" : "Initialize my local password"}
        </Button>
      </form>
    </Card>
  );
}
