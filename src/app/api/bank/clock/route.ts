import { NextResponse } from "next/server";
import { advanceBusinessClock } from "@/lib/clock";

/**
 * The "bank clock" endpoint. Point a real scheduler (Render cron, Event
 * Scheduler, etc.) at this to run the batch on a schedule; pages also call it
 * on load so the demo always looks fresh.
 */
export async function GET() {
  const result = await advanceBusinessClock();
  return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
}
