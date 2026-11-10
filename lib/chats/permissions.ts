// Lib/pure permission resolution for chat groups (Lot C).
// Kept pure (no DB) so it can be unit-tested.

export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export interface GroupPermissionConfig {
  whoCanSend?: "all" | "admins" | "owner";
  whoCanSendMedia?: "all" | "admins" | "owner";
  whoCanAddMembers?: "all" | "admins" | "owner";
  whoCanEditInfo?: "all" | "admins" | "owner";
  whoCanPin?: "all" | "admins" | "owner";
  whoCanDeleteMessages?: "all" | "admins" | "owner";
}

export interface MemberPermissionOverrides {
  canSend?: boolean;
  canSendMedia?: boolean;
  canAddMembers?: boolean;
  canEditInfo?: boolean;
  canPin?: boolean;
  canDeleteMessages?: boolean;
  whoCanSend?: "all" | "admins" | "owner";
  whoCanSendMedia?: "all" | "admins" | "owner";
  whoCanAddMembers?: "all" | "admins" | "owner";
  whoCanEditInfo?: "all" | "admins" | "owner";
  whoCanPin?: "all" | "admins" | "owner";
  whoCanDeleteMessages?: "all" | "admins" | "owner";
}

export interface ResolvedGroupPermissions {
  role: GroupRole | null;
  isMember: boolean;
  isReadOnly: boolean;
  canSend: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canEditInfo: boolean;
  canEditPermissions: boolean;
  canPin: boolean;
  canDeleteMessages: boolean;
}

const LEVEL_RANK: Record<string, number> = { owner: 3, admins: 2, all: 1 };

function resolveLevel(
  level: "all" | "admins" | "owner",
  role: GroupRole,
): boolean {
  const userRank = role === "OWNER" ? 3 : role === "ADMIN" ? 2 : 1;
  const requiredRank = LEVEL_RANK[level] ?? 1;
  return userRank >= requiredRank;
}

export function resolveGroupPermissions(
  role: GroupRole | null,
  isReadOnly: boolean,
  groupConfig: GroupPermissionConfig = {},
  memberOverrides: MemberPermissionOverrides = {},
): ResolvedGroupPermissions {
  const defaults: ResolvedGroupPermissions = {
    role,
    isMember: !!role,
    isReadOnly,
    canSend: false,
    canSendMedia: false,
    canAddMembers: false,
    canEditInfo: false,
    canEditPermissions: false,
    canPin: false,
    canDeleteMessages: false,
  };

  if (!role) return defaults;

  const isOwner = role === "OWNER";
  const isAdmin = role === "ADMIN" || isOwner;

  const whoCan = (key: keyof GroupPermissionConfig, fallback: string) => {
    const override = (memberOverrides as any)[key];
    if (override !== undefined) return override;
    const cfg = (groupConfig as any)[key];
    if (cfg !== undefined) return cfg;
    return fallback;
  };

  const applyOverride = (flag: keyof MemberPermissionOverrides, value: boolean) =>
    memberOverrides[flag] !== undefined ? !!memberOverrides[flag] : value;

  const canSendBase = resolveLevel(
    whoCan("whoCanSend", isReadOnly ? "owner" : "all") as any,
    role,
  );
  const canSendMediaBase = resolveLevel(
    whoCan("whoCanSendMedia", "all") as any,
    role,
  );
  const canAddMembersBase = resolveLevel(
    whoCan("whoCanAddMembers", "admins") as any,
    role,
  );
  const canEditInfoBase = resolveLevel(
    whoCan("whoCanEditInfo", "admins") as any,
    role,
  );
  const canPinBase = resolveLevel(whoCan("whoCanPin", "admins") as any, role);
  const canDeleteBase = resolveLevel(
    whoCan("whoCanDeleteMessages", "admins") as any,
    role,
  );

  const canSend = isReadOnly ? isOwner && canSendBase : canSendBase;
  const canSendMedia = isReadOnly ? isOwner && canSendMediaBase : canSendMediaBase;

  return {
    role,
    isMember: true,
    isReadOnly,
    canSend: applyOverride("canSend", canSend),
    canSendMedia: applyOverride("canSendMedia", canSendMedia),
    canAddMembers: applyOverride(
      "canAddMembers",
      isOwner ? true : canAddMembersBase,
    ),
    canEditInfo: applyOverride("canEditInfo", isOwner ? true : canEditInfoBase),
    canEditPermissions: isOwner,
    canPin: applyOverride("canPin", isOwner ? true : canPinBase),
    canDeleteMessages: applyOverride(
      "canDeleteMessages",
      isOwner ? true : canDeleteBase,
    ),
  };
}