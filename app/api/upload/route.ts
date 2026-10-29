import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Support multiple files under "files" or single file under "file"
    const filesList = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const filesToProcess = filesList.length > 0 ? filesList : (singleFile ? [singleFile] : []);

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch {
      // In some environments, mkdir might already exist or be restricted
    }

    const uploadedResults: {
      url: string;
      originalName: string;
      caption: string;
      size: number;
    }[] = [];

    for (const file of filesToProcess) {
      if (!file.type || !file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a supported image format.` },
          { status: 400 }
        );
      }

      // Max 15MB per file
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Image "${file.name}" exceeds the 15MB limit.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || ".jpg";
      const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-\s]/g, "").trim().slice(0, 40) || "image";
      const cleanCaption = cleanBase.replace(/[_-]+/g, " ").replace(/\s+/g, " ");

      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const fileName = `${cleanBase.replace(/\s+/g, "_")}_${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      let publicUrl = `/uploads/${fileName}`;

      try {
        await fs.writeFile(filePath, buffer);
      } catch (writeErr) {
        console.warn("Failed to write to public/uploads, falling back to data URL:", writeErr);
        // Resilient fallback: base64 data URL
        const base64 = buffer.toString("base64");
        publicUrl = `data:${file.type};base64,${base64}`;
      }

      uploadedResults.push({
        url: publicUrl,
        originalName: file.name,
        caption: cleanCaption,
        size: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      url: uploadedResults[0]?.url,
      caption: uploadedResults[0]?.caption,
    });
  } catch (error) {
    console.error("Error handling image upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process image upload." },
      { status: 500 }
    );
  }
}
