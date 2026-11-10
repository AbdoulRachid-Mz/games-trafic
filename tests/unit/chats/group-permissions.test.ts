import { describe, it, expect } from "vitest";
import { resolveGroupPermissions } from "@/lib/chats/permissions";

describe("resolveGroupPermissions (Lot C)", () => {
  it("returns all false for null role", () => {
    const r = resolveGroupPermissions(null, false);
    expect(r.isMember).toBe(false);
    expect(r.canSend).toBe(false);
    expect(r.canEditPermissions).toBe(false);
  });

  it("OWNER has full permissions", () => {
    const r = resolveGroupPermissions("OWNER", false);
    expect(r.canSend).toBe(true);
    expect(r.canSendMedia).toBe(true);
    expect(r.canAddMembers).toBe(true);
    expect(r.canEditInfo).toBe(true);
    expect(r.canEditPermissions).toBe(true);
    expect(r.canPin).toBe(true);
    expect(r.canDeleteMessages).toBe(true);
  });

  it("read-only disables send for MEMBER/ADMIN but owner can still send", () => {
    const member = resolveGroupPermissions("MEMBER", true);
    expect(member.canSend).toBe(false);
    expect(member.canSendMedia).toBe(false);
    const owner = resolveGroupPermissions("OWNER", true);
    expect(owner.canSend).toBe(true);
  });

  it("MEMBER respects whoCanSend admins config", () => {
    const r = resolveGroupPermissions("MEMBER", false, { whoCanSend: "admins" });
    expect(r.canSend).toBe(false);
    const admin = resolveGroupPermissions("ADMIN", false, { whoCanSend: "admins" });
    expect(admin.canSend).toBe(true);
  });

  it("member override canSend true grants send even when config denies", () => {
    const r = resolveGroupPermissions("MEMBER", false, { whoCanSend: "admins" }, { canSend: true });
    expect(r.canSend).toBe(true);
  });

  it("member override canSend false revokes send even for owner", () => {
    const r = resolveGroupPermissions("OWNER", false, {}, { canSend: false });
    expect(r.canSend).toBe(false);
  });

  it("ADMIN cannot edit permissions", () => {
    const r = resolveGroupPermissions("ADMIN", false);
    expect(r.canEditPermissions).toBe(false);
  });

  it("MEMBER cannot pin or delete", () => {
    const r = resolveGroupPermissions("MEMBER", false);
    expect(r.canPin).toBe(false);
    expect(r.canDeleteMessages).toBe(false);
  });
});