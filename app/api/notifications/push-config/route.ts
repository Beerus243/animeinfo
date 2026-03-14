import { NextResponse } from "next/server";

import { getWebPushPublicKey, isWebPushConfigured } from "@/lib/webPush";

export async function GET() {
  const configured = isWebPushConfigured();

  return NextResponse.json({
    configured,
    publicKey: configured ? getWebPushPublicKey() : "",
  });
}