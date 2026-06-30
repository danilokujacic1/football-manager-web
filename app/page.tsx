"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { GafferApp } from "@/components/gaffer/gaffer-app"
import { LoadingScreen } from "@/components/common/phone-screen"
import { fetchMe } from "@/lib/api/auth"

export default function Page() {
  const router = useRouter()

  const { data: me, isPending } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    // A 401 means "not logged in" — surface it immediately as the guest state.
    retry: false,
  })

  // Authenticated → straight to the leagues list.
  useEffect(() => {
    if (me) router.replace("/leagues")
  }, [me, router])

  // Checking the session, or already authenticated and redirecting.
  if (isPending || me) {
    return <LoadingScreen message="Loading your account…" />
  }

  // Not authenticated → the guest landing (with its Create account / Log in CTAs).
  return (
    <main>
      <GafferApp cardStyle="foil" />
    </main>
  )
}
