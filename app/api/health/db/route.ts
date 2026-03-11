import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

function sanitizeMongoUri(uri: string | undefined) {
  if (!uri) {
    return null;
  }

  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, "") || null;

    return {
      protocol: parsed.protocol,
      host: parsed.host,
      dbName,
      hasUsername: Boolean(parsed.username),
      hasPassword: Boolean(parsed.password),
      searchParams: Array.from(parsed.searchParams.keys()).sort(),
    };
  } catch {
    return {
      invalid: true,
    };
  }
}

export async function GET() {
  const mongoUri = process.env.MONGODB_URI;
  const siteUrl = process.env.SITE_URL;

  try {
    const connection = await connectToDatabase();
    const db = connection.connection.db;

    return NextResponse.json({
      ok: true,
      environment: process.env.VERCEL_ENV || "local",
      region: process.env.VERCEL_REGION || null,
      siteUrl: siteUrl || null,
      hasMongoUri: Boolean(mongoUri),
      mongoUri: sanitizeMongoUri(mongoUri),
      mongo: {
        readyState: connection.connection.readyState,
        dbName: db?.databaseName || null,
        host: connection.connection.host || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        environment: process.env.VERCEL_ENV || "local",
        region: process.env.VERCEL_REGION || null,
        siteUrl: siteUrl || null,
        hasMongoUri: Boolean(mongoUri),
        mongoUri: sanitizeMongoUri(mongoUri),
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 },
    );
  }
}