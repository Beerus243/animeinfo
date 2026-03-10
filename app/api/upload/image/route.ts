import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { getCloudinaryUploadSignature } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signature = getCloudinaryUploadSignature("animeinfo/articles");
    return NextResponse.json(signature);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cloudinary signing failed." },
      { status: 500 },
    );
  }
}