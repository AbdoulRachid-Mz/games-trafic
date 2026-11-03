import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // 1. Validation du type MIME (A3-02)
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé (${file.type}). Formats acceptés : JPG, PNG, WEBP, GIF, PDF.` },
        { status: 400 }
      );
    }

    // 2. Validation de la taille (A3-02)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La taille du fichier dépasse la limite maximale autorisée (5 Mo)." },
        { status: 400 }
      );
    }

    const extension = MIME_TO_EXT[file.type] || "bin";
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const safeFileName = `upload_${uniqueSuffix}.${extension}`;

    // 3. Stockage réel sur disque dans public/uploads/ (A3-01)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, safeFileName);
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    const publicUrl = `/uploads/${safeFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeFileName,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: currentUser.id,
    });
  } catch (error) {
    console.error("Erreur upload fichier:", error);
    return NextResponse.json(
      { error: "Échec du téléchargement du fichier" },
      { status: 500 }
    );
  }
}
