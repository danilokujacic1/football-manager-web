"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { FormError } from "@/components/auth/auth-ui"
import { AdminShell } from "@/components/admin/admin-shell"
import { Spinner } from "@/components/common/phone-screen"
import {
  fetchLeagueMembers,
  removeMember,
  updateMemberRole,
  type LeagueMember,
  type MembershipRole,
} from "@/lib/api/leagues"

export default function AdminMembersPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <AdminShell leagueId={id} title="Members" subtitle="Promote, demote or remove members.">
      <MembersList leagueId={id} />
    </AdminShell>
  )
}

function MembersList({ leagueId }: { leagueId: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: ["league-members", leagueId],
    queryFn: () => fetchLeagueMembers(leagueId),
    retry: false,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["league-members", leagueId] })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MembershipRole }) =>
      updateMemberRole(leagueId, userId, role),
    onSuccess: invalidate,
  })
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(leagueId, userId),
    onSuccess: invalidate,
  })

  if (isPending) {
    return (
      <div style={{ marginTop: 40 }}>
        <Spinner />
      </div>
    )
  }
  if (isError) {
    return <FormError message="Couldn't load members." />
  }

  const members = data ?? []
  const busy = roleMutation.isPending || removeMutation.isPending

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {roleMutation.isError || removeMutation.isError ? (
        <FormError message="That action failed. The owner's role can't be changed or removed." />
      ) : null}

      {members.map((m) => (
        <MemberRow
          key={m.user.id}
          member={m}
          busy={busy}
          onSetRole={(role) => roleMutation.mutate({ userId: m.user.id, role })}
          onRemove={() => removeMutation.mutate(m.user.id)}
        />
      ))}
    </div>
  )
}

function MemberRow({
  member,
  busy,
  onSetRole,
  onRemove,
}: {
  member: LeagueMember
  busy: boolean
  onSetRole: (role: MembershipRole) => void
  onRemove: () => void
}) {
  const isOwner = member.role === "OWNER"
  const name = member.user.displayName?.trim() || member.user.email

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          aria-hidden
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            flex: "none",
            background: "rgba(0,229,199,.12)",
            border: "1px solid rgba(0,229,199,.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            color: "#00E5C7",
            fontSize: 15,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 700, fontSize: 15, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: "#7C879B", marginTop: 1 }}>{member.role}</div>
        </div>
      </div>

      {!isOwner ? (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <RolePill
            label={member.role === "ADMIN" ? "Demote to member" : "Promote to admin"}
            disabled={busy}
            onClick={() => onSetRole(member.role === "ADMIN" ? "MEMBER" : "ADMIN")}
          />
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 12,
              cursor: busy ? "default" : "pointer",
              background: "rgba(255,107,107,.1)",
              border: "1px solid rgba(255,107,107,.35)",
              color: "#FF6B6B",
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: "#7C879B" }}>League owner — can&apos;t be changed.</div>
      )}
    </div>
  )
}

function RolePill({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        height: 40,
        borderRadius: 12,
        cursor: disabled ? "default" : "pointer",
        background: "rgba(0,229,199,.1)",
        border: "1px solid rgba(0,229,199,.35)",
        color: "#00E5C7",
        fontFamily: "var(--font-archivo)",
        fontWeight: 800,
        fontSize: 13,
      }}
    >
      {label}
    </button>
  )
}
