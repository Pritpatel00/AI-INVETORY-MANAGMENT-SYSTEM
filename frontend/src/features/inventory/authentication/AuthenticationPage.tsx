import { useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserRound, Warehouse } from "lucide-react";
import { Brand } from "../shared/Brand";
import { Alert, Button, Field, TextInput } from "../shared/ui";

interface AuthenticationPageProps {
  onLogin: (identifier: string, password: string) => void;
  authError: string;
  isLoading: boolean;
}

export function AuthenticationPage({ onLogin, authError, isLoading }: AuthenticationPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const sessionExpired = /expired/i.test(authError);

  return (
    <main className="login-stage pitch-login-stage px-4 py-8 text-[#101828]">
      <div className="pitch-login-ambient" aria-hidden="true">
        <span className="pitch-login-orb pitch-login-orb-one" />
        <span className="pitch-login-orb pitch-login-orb-two" />
        <span className="pitch-login-orb pitch-login-orb-three" />
        <span className="pitch-login-grid" />
      </div>

      <section className="login-shell pitch-login-shell w-full max-w-[430px]">
        <div className="pitch-login-card">
          <div className="pitch-login-brand">
            <Brand />
          </div>

          <div className="pitch-login-intro">
            <span className="pitch-login-icon">
              <Warehouse size={19} aria-hidden="true" />
            </span>
            <p className="pitch-login-eyebrow">Warehouse operations</p>
            <h1>Welcome to Nirka</h1>
            <p className="pitch-login-description">
              Sign in to continue to your inventory workspace. Your account role opens the right tools automatically.
            </p>
          </div>

          <form
            className="pitch-login-form mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onLogin(
                String(formData.get("employeeId") ?? ""),
                String(formData.get("password") ?? ""),
              );
            }}
          >
            <Field label="Employee ID or email" htmlFor="login-employee-id">
              <div className="relative">
                <UserRound
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]"
                  aria-hidden="true"
                />
                <TextInput
                  id="login-employee-id"
                  aria-label="Employee ID or email"
                  name="employeeId"
                  autoComplete="username"
                  required
                  placeholder="worker1 or name@example.com"
                  className="ui-input-has-icon"
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <TextInput
                  id="login-password"
                  aria-label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#7a8da7] transition hover:bg-[#edf2ff] hover:text-[#3867ff]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {authError && (
              <Alert
                tone={sessionExpired ? "warning" : "danger"}
                role="alert"
                title={sessionExpired ? "Session expired" : "Sign-in could not be completed"}
              >
                {authError}
              </Alert>
            )}

            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="pitch-login-submit w-full">
              {isLoading ? "Signing in securely…" : "Continue to workspace"}
              {!isLoading && <ArrowRight size={16} aria-hidden="true" />}
            </Button>
          </form>

          <div className="auth-panel pitch-login-security mt-5 flex items-start gap-2.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#067647]" aria-hidden="true" />
            <span>Protected access. Your role determines the workspace and permissions available after sign-in.</span>
          </div>
        </div>
      </section>

      <p className="pitch-login-footer">Nirka Inventory OS · Secure warehouse operations</p>
    </main>
  );
}
