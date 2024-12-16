import { NextRequest, NextResponse } from "next/server";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return NextResponse.json({});
}

export const GET = handle;
