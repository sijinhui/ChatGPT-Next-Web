import { NextRequest, NextResponse } from "next/server";

async function getRealtimeAccessToken() {
  let uri = "https://login.microsoftonline.com/''/oauth2/token";
  const body = {
    grant_type: "client_credentials",
    client_id: "",
    client_secret: "",
    resource: "https://cognitiveservices.azure.com/",
  };
  let options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-cache",
    body: new URLSearchParams(body).toString(),
  };
  return await fetch(uri, options);
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const access_token_response = await getRealtimeAccessToken();
  const access_token = await access_token_response.json();
  console.log("access_token:", access_token);
  return NextResponse.json({
    token: access_token.access_token,
    expiresOnTimestamp: access_token.expires_on,
    refreshAfterTimestamp: access_token.not_before,
  });
}

export const GET = handle;

export const runtime = "edge";
