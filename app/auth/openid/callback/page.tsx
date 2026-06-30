"use client"

import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"
import { exchangeOpenIdCode } from "@/lib/api/auth"
import { PhoneFrame } from "@/components/gaffer/phone-frame"

/**
 * OIDC redirect target. The IdP (Google) redirects the browser here with an
 * `?code=...` (authorization code) and `?state=...`. We forward that code to
 * the backend's /auth/openid/callback endpoint, which performs the real token
 * exchange and returns/sets the app session.
 */
export default function OpenIdCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell><Status state="working" /></CallbackShell>}>
      <CallbackInner />
    </Suspense>
  )
}

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Standard OIDC uses `code`; accept `authorization_code` as a fallback.
  const code = searchParams.get("code") ?? searchParams.get("authorization_code")
  const state = searchParams.get("state")
  // The IdP signals failures with `error` / `error_description`.
  const idpError = searchParams.get("error")
  const idpErrorDescription = searchParams.get("error_description")

  const mutation = useMutation({
    mutationFn: () => exchangeOpenIdCode({ code: code as string, state }),
    onSuccess: () => {
      router.replace("/")
    },
  })

  // Fire the exchange exactly once, after we've confirmed a code is present.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    if (idpError || !code) return
    started.current = true
    mutation.mutate()
  }, [code, idpError, mutation])

  if (idpError) {
    return (
      <CallbackShell>
        <Status
          state="error"
          message={idpErrorDescription ?? `Sign-in was cancelled or failed (${idpError}).`}
        />
      </CallbackShell>
    )
  }

  if (!code) {
    return (
      <CallbackShell>
        <Status state="error" message="No authorization code was provided by the identity provider." />
      </CallbackShell>
    )
  }

  if (mutation.isError) {
    return (
      <CallbackShell>
        <Status state="error" message="We couldn't complete your sign-in. Please try again." />
      </CallbackShell>
    )
  }

  return (
    <CallbackShell>
      <Status state="working" />
    </CallbackShell>
  )
}

/** Centered status layout inside the phone frame. */
function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <PhoneFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          background: "radial-gradient(120% 60% at 50% 0%, rgba(0,229,199,.14), transparent 55%)",
        }}
      >
        {children}
      </div>
    </PhoneFrame>
  )
}

function Status({ state, message }: { state: "working" | "error"; message?: string }) {
  if (state === "working") {
    return (
      <div style={{ textAlign: "center" }}>
        <Spinner />
        <h1
          style={{
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            fontSize: 22,
            color: "#fff",
            margin: "22px 0 6px",
          }}
        >
          Signing you in…
        </h1>
        <p style={{ fontSize: 14, color: "#9BA6BC", margin: 0 }}>Completing secure sign-in with Google.</p>
      </div>
    )
  }

  return (
    <div style={{ textAlign: "center", maxWidth: 300 }}>
      <div
        aria-hidden
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          margin: "0 auto",
          background: "rgba(255,107,107,.12)",
          border: "1px solid rgba(255,107,107,.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
        }}
      >
        ⚠️
      </div>
      <h1
        style={{
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 22,
          color: "#fff",
          margin: "20px 0 8px",
        }}
      >
        Sign-in failed
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "0 0 24px" }}>{message}</p>
      <Link
        href="/login"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 50,
          padding: "0 26px",
          borderRadius: 16,
          textDecoration: "none",
          background: "linear-gradient(150deg,#00E5C7,#0AAE9B)",
          color: "#062018",
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 15,
          boxShadow: "0 10px 24px rgba(0,229,199,.32)",
        }}
      >
        Back to login
      </Link>
    </div>
  )
}

function Spinner() {
  return (
    <div
      aria-hidden
      style={{
        width: 44,
        height: 44,
        margin: "0 auto",
        borderRadius: "50%",
        border: "3px solid rgba(255,255,255,.12)",
        borderTopColor: "#00E5C7",
        animation: "fl-spin .8s linear infinite",
      }}
    />
  )
}
