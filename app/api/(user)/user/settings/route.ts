import { NextRequest } from "next/server";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string }> },
) {}

export const GET = handle;
export const POST = handle;
