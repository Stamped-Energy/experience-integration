"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StampedLogo } from "@/components/shell/StampedLogo";
import { useAuth } from "@/lib/auth-context";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.startsWith("/login")) return "/";
  return raw;
}

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn(email, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.replace(safeNext(searchParams.get("next")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forge-login">
      <div className="forge-login__panel">
        <div className="forge-login__brand">
          <StampedLogo size={40} />
          <div>
            <p className="forge-eyebrow" style={{ margin: 0 }}>
              Stamped Energy
            </p>
            <h1 className="forge-login__title">Sign in</h1>
          </div>
        </div>
        <p className="forge-login__lede">
          Plant overview, alarms, and prescriptions require a signed-in session.
          The BFF holds credentials; L2/L5 keys never reach the browser.
        </p>

        <form className="forge-login__form" onSubmit={onSubmit}>
          <label className="forge-login__label">
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="forge-login__input"
            />
          </label>
          <label className="forge-login__label">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={12}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="forge-login__input"
            />
          </label>
          {error ? (
            <p className="forge-login__error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="forge-login__submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="forge-login">
          <p style={{ color: "var(--forge-on-surface-variant)" }}>Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
