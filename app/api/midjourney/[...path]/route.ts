import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth";
import { ModelProvider } from "@/app/constant";
import { requestLog } from "@/app/api/common";
import { getServerSideConfig } from "@/app/config/server";

// const BASE_URL = process.env.MIDJOURNEY_PROXY_URL ?? null;
// const MIDJOURNEY_PROXY_KEY = process.env.MIDJOURNEY_PROXY_KEY ?? null;

const serverConfig = getServerSideConfig();

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const p_params = await params;
  console.log("[Midjourney Route] params ", p_params);

  const customMjProxyUrl = req.headers.get("midjourney-proxy-url");
  let mjProxyUrl = serverConfig.baseUrl;
  if (
    customMjProxyUrl &&
    (customMjProxyUrl.startsWith("http://") ||
      customMjProxyUrl.startsWith("https://"))
  ) {
    mjProxyUrl = customMjProxyUrl;
  }

  if (!mjProxyUrl) {
    return NextResponse.json(
      {
        error: true,
        msg: "please set MIDJOURNEY_PROXY_URL in .env or set midjourney-proxy-url in config",
      },
      {
        status: 500,
      },
    );
  }
  let cloneBody, jsonBody;

  try {
    cloneBody = (await req.text()) as any;
    jsonBody = JSON.parse(cloneBody) as { model?: string };
  } catch (e) {
    jsonBody = {};
  }

  const authResult = auth(req, ModelProvider.Qwen);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  const reqPath = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/midjourney/",
    "",
  );

  if (reqPath.startsWith("mj/submit/")) {
    await requestLog(req, jsonBody, reqPath);
  }

  let fetchUrl = `${mjProxyUrl}/${reqPath}`;

  console.log("[MJ Proxy] ", fetchUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15 * 1000);

  const fetchOptions: RequestInit = {
    //@ts-ignore
    headers: {
      "Content-Type": "application/json",
      Authorization: serverConfig.apiKey,
      // "mj-api-secret": API_SECRET,
    },
    cache: "no-store",
    method: req.method,
    body: cloneBody == "" ? null : cloneBody,
    signal: controller.signal,
    //@ts-ignore
    // duplex: "half",
  };
  try {
    const res = await fetch(fetchUrl, fetchOptions);
    if (res.status !== 200) {
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
      });
    }
    // console.log('[mj res]', await res.json())
    return NextResponse.json(await res.json(), {
      status: res.status,
      statusText: res.statusText,
    });
  } catch (e) {
    console.log("[mj error]", e);
  } finally {
    clearTimeout(timeoutId);
  }
  return NextResponse.json({ error: "未知错误" }, { status: 400 });
}

export const GET = handle;
export const POST = handle;
