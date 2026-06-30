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
import { api } from "@/lib/api/client"
import { AxiosError } from "axios"

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordOk = password.length >= 8
  const canSubmit = emailOk && passwordOk && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!emailOk) {
      setError("Please enter a valid email address.")
      return
    }
    if (!passwordOk) {
      setError("Password must be at least 8 characters.")
      return
    }

    setSubmitting(true)
    try {
      // TODO: wire to the auth backend (creates a User with email + passwordHash;
      // displayName is optional). openIdSub stays null for local sign-ups.

      const res = await api.post("/auth/register",  {email,
          password,
        displayName: displayName.trim() || null
      })
      
      window.location.href = "/"
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 409) {
          setError("An account with this email already exists.")
        }
      } else {
        setError("Something went wrong. Please try again.")
      }

    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create your account." subtitle="Draft your dream XI and take on your mates in minutes.">
      <form onSubmit={handleSubmit} style={{ marginTop: 32 }} noValidate>
        <GoogleButton label="Sign up with Google" />
        <OrDivider />

        {error ? <FormError message={error} /> : null}

        <Field
          id="displayName"
          label="DISPLAY NAME (OPTIONAL)"
          value={displayName}
          onChange={setDisplayName}
          placeholder="The Gaffer"
          autoComplete="nickname"
        />
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
        />

        <PrimaryButton disabled={!canSubmit} style={{ marginTop: 8 }}>
          {submitting ? "Creating account…" : "Create account"}
        </PrimaryButton>

        <p style={{ textAlign: "center", fontSize: 11, color: "#677085", margin: "12px 0 0" }}>
          Free to play · No card required
        </p>

        <SwitchPrompt text="Already have an account?" linkLabel="Log in →" href="/login" />
      </form>
    </AuthShell>
  )
}
