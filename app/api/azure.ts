import { ModelProvider } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { requestOpenai } from "./common";

export async function handle(
  req: NextRequest,
  // res: NextApiResponse,
  { params }: { params: { path: string[] } },
) {
  console.log("");
  console.log("[Azure Route] params ", params);
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" });
  }

  const subpath = params.path.join("/");

  const authResult = auth(req, ModelProvider.GPT);
  if (authResult.error) {
    return NextResponse.json(authResult, { status: 401 } as any);
  }

  try {
    return await requestOpenai(req);
  } catch (e) {
    console.error("[Azure] ", e);
    return NextResponse.json(prettyObject(e), { status: 500 });
  }
}
