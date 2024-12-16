import { NextRequest, NextResponse } from "next/server";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ action: string; key: string[] }> },
) {
  const p_params = await params;
  const requestUrl = new URL(req.url);
  const endpoint = requestUrl.searchParams.get("endpoint");

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }
  const [...key] = p_params.key;
  // only allow to request to *.upstash.io
  if (!endpoint || !new URL(endpoint).hostname.endsWith(".upstash.io")) {
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + p_params.key.join("/"),
      },
      {
        status: 403,
      },
    );
  }

  // only allow upstash get and set method
  if (p_params.action !== "get" && p_params.action !== "set") {
    console.log("[Upstash Route] forbidden action ", p_params.action);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + p_params.action,
      },
      {
        status: 403,
      },
    );
  }

  const targetUrl = `${endpoint}/${p_params.action}/${p_params.key.join("/")}`;

  const method = req.method;
  const shouldNotHaveBody = ["get", "head"].includes(
    method?.toLowerCase() ?? "",
  );

  const fetchOptions: RequestInit = {
    headers: {
      authorization: req.headers.get("authorization") ?? "",
    },
    body: shouldNotHaveBody ? null : req.body,
    method,
    // @ts-ignore
    duplex: "half",
  };

  console.log("[Upstash Proxy]", targetUrl, fetchOptions);
  const fetchResult = await fetch(targetUrl, fetchOptions);

  console.log("[Any Proxy]", targetUrl, {
    status: fetchResult.status,
    statusText: fetchResult.statusText,
  });

  return fetchResult;
}

export const POST = handle;
export const GET = handle;
export const OPTIONS = handle;

// export const runtime = "edge";
