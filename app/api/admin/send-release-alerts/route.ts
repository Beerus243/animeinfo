import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { hasAnyReleaseDeliveryChannel, sendDueReleaseAlerts } from "@/lib/releaseAlerts";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAnyReleaseDeliveryChannel()) {
    return NextResponse.json({ error: "Missing email or web push notification configuration." }, { status: 400 });
  }

  const result = await sendDueReleaseAlerts();
  return NextResponse.json({ ok: true, ...result });
}