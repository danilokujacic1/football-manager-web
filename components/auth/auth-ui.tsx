"use client"

import Link from "next/link"
import { useState, type CSSProperties, type ReactNode } from "react"
import { PhoneFrame } from "@/components/gaffer/phone-frame"
import { API_BASE_URL } from "@/lib/api/client"

/**
 * Shared building blocks for the /login and /register screens.
 * Styling mirrors the GAFFER design language (dark shell, teal accent,
 * Archivo headings / Space Grotesk body, 16px-radius inputs & buttons).
 */

/** Full-screen auth shell: phone frame + logo header + heading + content. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <PhoneFrame>
      <div
        className="scrl"
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            minHeight: 850,
            padding: "70px 26px 40px",
            display: "flex",
            flexDirection: "column",
            background: "radial-gradient(120% 60% at 50% 0%, rgba(0,229,199,.14), transparent 55%)",
          }}
        >
          <BrandHeader />

          <div style={{ marginTop: 44 }}>
            <h1
              style={{
                fontFamily: "var(--font-archivo)",
                fontWeight: 800,
                fontSize: 30,
                lineHeight: 1.05,
                letterSpacing: "-.01em",
                color: "#fff",
                margin: 0,
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "10px 0 0", maxWidth: 300 }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </PhoneFrame>
  )
}

/** GAFFER wordmark + logo, links back to the start page. */
function BrandHeader() {
  return (
    <Link
      href="/"
      style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}
    >
      <div
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "linear-gradient(150deg,#00E5C7,#0F9C8B)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-archivo)",
          fontWeight: 900,
          color: "#062018",
          fontSize: 16,
        }}
      >
        G
      </div>
      <span
        style={{
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: ".02em",
          color: "#fff",
        }}
      >
        GAFFER
      </span>
    </Link>
  )
}

/** Labeled text input with teal focus ring. Supports an inline trailing slot. */
export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  trailing,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  trailing?: ReactNode
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#7C879B" }}>
        {label}
      </label>
      <div style={{ position: "relative", marginTop: 8 }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 16,
            background: "rgba(255,255,255,.05)",
            border: `1.5px solid ${focused ? "rgba(0,229,199,.55)" : "rgba(255,255,255,.12)"}`,
            padding: trailing ? "0 70px 0 18px" : "0 18px",
            color: "#fff",
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 500,
            fontSize: 15,
            outline: "none",
            transition: "border-color .15s",
          }}
        />
        {trailing ? (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{trailing}</div>
        ) : null}
      </div>
    </div>
  )
}

/** Inline "Show / Hide" toggle for password fields. */
export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        background: "none",
        border: 0,
        cursor: "pointer",
        color: "#7C879B",
        fontFamily: "var(--font-space-grotesk)",
        fontWeight: 600,
        fontSize: 12,
        padding: 4,
      }}
    >
      {shown ? "Hide" : "Show"}
    </button>
  )
}

/** Primary gradient submit button; dims when disabled. */
export function PrimaryButton({
  children,
  disabled,
  style,
}: {
  children: ReactNode
  disabled?: boolean
  style?: CSSProperties
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        width: "100%",
        height: 54,
        border: 0,
        borderRadius: 16,
        cursor: disabled ? "default" : "pointer",
        background: disabled ? "rgba(255,255,255,.07)" : "linear-gradient(150deg,#00E5C7,#0AAE9B)",
        color: disabled ? "#5E6878" : "#062018",
        fontFamily: "var(--font-archivo)",
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: ".01em",
        boxShadow: disabled ? "none" : "0 10px 24px rgba(0,229,199,.32)",
        transition: "all .2s",
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/**
 * "Continue with Google" button. Starts the backend OIDC flow, which redirects
 * to Google and ultimately back to our /auth/openid/callback route.
 */
export function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href={`${API_BASE_URL}/auth/google`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 11,
        width: "100%",
        height: 54,
        borderRadius: 16,
        background: "#fff",
        border: "1px solid rgba(255,255,255,.14)",
        color: "#1F2430",
        fontFamily: "var(--font-space-grotesk)",
        fontWeight: 600,
        fontSize: 15,
        textDecoration: "none",
      }}
    >
      <GoogleGlyph />
      {label}
    </a>
  )
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

/** "or" divider between OAuth and the email form. */
export function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0" }}>
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#677085" }}>or</span>
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
    </div>
  )
}

/** Bottom prompt to switch between login / register. */
export function SwitchPrompt({ text, linkLabel, href }: { text: string; linkLabel: string; href: string }) {
  return (
    <p style={{ textAlign: "center", fontSize: 13, color: "#7C879B", margin: "22px 0 0" }}>
      {text}{" "}
      <Link
        href={href}
        style={{
          color: "#00E5C7",
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {linkLabel}
      </Link>
    </p>
  )
}

/** Inline form error message. */
export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      style={{
        margin: "0 0 12px",
        fontSize: 13,
        color: "#FF6B6B",
        fontFamily: "var(--font-space-grotesk)",
      }}
    >
      {message}
    </p>
  )
}
