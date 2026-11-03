import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST as handleUpload } from "@/app/api/upload/route";
import { NextRequest } from "next/server";
import * as sessionModule from "@/lib/auth/session";
import fs from "fs";
import path from "path";

// Mock DB queries for chat tests
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      groupMembers: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      users: {
        findFirst: vi.fn().mockResolvedValue({ id: "target-user" }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      conversations: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      messages: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "msg-1", senderId: "sender-1", content: "test" }]),
        onConflictDoUpdate: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "msg-1" }]),
        }),
      }),
    }),
  },
}));

describe("Chat & Upload Security (TASK Vague 3: A2-01, A2-02, A3-01, A3-02, A3-03, P4-01)", () => {
  const uploadedFilesToClean: string[] = [];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Clean up real files created during test
    for (const filePath of uploadedFilesToClean) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }
  });

  describe("Upload API (/api/upload) - A3-01, A3-02, A3-03", () => {
    it("should return 401 when unauthenticated", async () => {
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", new File(["test-content"], "avatar.png", { type: "image/png" }));

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await handleUpload(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Non authentifié");
    });

    it("should reject disallowed MIME types with 400", async () => {
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        id: "user-1",
        email: "u1@test.com",
      } as any);

      const formData = new FormData();
      formData.append(
        "file",
        new File(["malicious script"], "exploit.exe", { type: "application/x-msdownload" })
      );

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await handleUpload(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Type de fichier non autorisé");
    });

    it("should reject files exceeding 5MB with 400", async () => {
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        id: "user-1",
        email: "u1@test.com",
      } as any);

      // Allocate > 5MB buffer
      const buffer = new Uint8Array(5.5 * 1024 * 1024);
      const bigFile = new File([buffer], "large.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", bigFile);

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await handleUpload(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("dépasse la limite maximale");
    });

    it("should accept valid file and save to disk with retrievable public url (A3-01 & A3-03)", async () => {
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      } as any);

      const fileContent = "valid-image-bytes-real-content";
      const validFile = new File([fileContent], "profile.webp", { type: "image/webp" });

      const formData = new FormData();
      formData.append("file", validFile);

      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await handleUpload(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.url).toMatch(/^\/uploads\/upload_.*\.webp$/);
      expect(json.mimeType).toBe("image/webp");
      expect(json.uploadedBy).toBe("user-123");

      // Verify file was physically written to public/uploads
      const diskPath = path.join(process.cwd(), "public", json.url.replace(/^\//, ""));
      uploadedFilesToClean.push(diskPath);

      expect(fs.existsSync(diskPath)).toBe(true);
      const savedContent = fs.readFileSync(diskPath, "utf8");
      expect(savedContent).toBe(fileContent);
    });
  });

  describe("Chat Permissions & Identity Protection - A2-01, A2-02, P4-01", () => {
    it("should reject message sent to group when sender is not a member (A2-01)", async () => {
      const { createMessage } = await import("@/actions/messages");
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        id: "intruder-user",
        role: "user",
        isAdmin: false,
      } as any);

      await expect(
        createMessage({
          content: "Hello secret group",
          groupId: "private-group-1",
        } as any)
      ).rejects.toThrow(/Accès refusé|membre/i);
    });

    it("should reject direct message sent to oneself (A2-02)", async () => {
      const { createMessage } = await import("@/actions/messages");
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        id: "self-user",
        role: "user",
        isAdmin: false,
      } as any);

      await expect(
        createMessage({
          content: "Self message",
          recipientId: "self-user",
        } as any)
      ).rejects.toThrow("Impossible d'envoyer un message privé à soi-même");
    });

    it("should prevent cross-user conversation listing IDOR (A2-01)", async () => {
      const { getConversationsForUser } = await import("@/actions/messages");
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        id: "user-alice",
        role: "user",
        isAdmin: false,
      } as any);

      // Alice tries to get Bob's conversations
      const result = await getConversationsForUser("user-bob");
      expect(result).toEqual([]);
    });

    it("should reset unreadCount when conversation is marked as read (P4-01, P4-02)", async () => {
      const { markConversationAsRead } = await import("@/actions/messages");
      const { db } = await import("@/lib/db");
      vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        id: "user-alice",
        role: "user",
        isAdmin: false,
      } as any);

      // markConversationAsRead should update conversations with unreadCount: 0
      await markConversationAsRead("dm:user-alice-user-bob", "user-alice");

      expect(db.update).toHaveBeenCalled();
    });
  });
});
