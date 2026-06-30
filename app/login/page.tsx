"use client"

import { useState } from "react"
import {
  AuthShell,
  Field,
  FormError,
  GoogleButton,
  OrDivider,
  PasswordToggle,
  PrimaryButton,
  SwitchPrompt,
} from "@/components/auth/auth-ui"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      // TODO: wire to the auth backend (verifies email + passwordHash).
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError("Incorrect email or password.")
        return
      }
      window.location.href = "/"
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back." subtitle="Log in to manage your squad and climb the table.">
      <form onSubmit={handleSubmit} style={{ marginTop: 32 }} noValidate>
        <GoogleButton label="Continue with Google" />
        <OrDivider />

        {error ? <FormError message={error} /> : null}

        <Field
          id="email"
          label="EMAIL"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Field
          id="password"
          label="PASSWORD"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
        />

        <PrimaryButton disabled={!canSubmit} style={{ marginTop: 8 }}>
          {submitting ? "Logging in…" : "Log in"}
        </PrimaryButton>

        <SwitchPrompt text="New to GAFFER?" linkLabel="Create an account →" href="/register" />
      </form>
    </AuthShell>
  )
}
