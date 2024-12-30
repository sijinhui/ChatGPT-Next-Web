import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
import { ModelProvider, OPENAI_BASE_URL, ServiceProvider } from "../constant";
import { cloudflareAIGatewayUrl } from "../utils/cloudflare";
import { getModelProvider, isModelNotavailableInServer } from "../utils/model";

import { getIP } from "@/app/api/auth";
import { getSessionName } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTokenLength } from "@/lib/utils";

import { type LogEntry } from "@prisma/client";

interface CusLogEntry extends LogEntry {
  logEntry?: string;
  logResponseEntry?: string;
}

const serverConfig = getServerSideConfig();

export async function requestOpenai(
  req: NextRequest,
  // cloneBody: any,
  // isAzure: boolean,
  // current_model?: string,
) {
  const controller = new AbortController();

  const isAzure = req.nextUrl.pathname.includes("azure/deployments");

  var authValue,
    authHeaderName = "";
  if (isAzure) {
    authValue =
      req.headers
        .get("Authorization")
        ?.trim()
        .replaceAll("Bearer ", "")
        .trim() ?? "";

    authHeaderName = "api-key";
  } else {
    authValue = req.headers.get("Authorization") ?? "";
    authHeaderName = "Authorization";
  }
  // const authValue = req.headers.get("Authorization") ?? "";
  // const authHeaderName = isAzure ? "api-key" : "Authorization";

  let path = `${req.nextUrl.pathname}`.replaceAll("/api/openai/", "");

  let baseUrl =
    (isAzure ? serverConfig.azureUrl : serverConfig.baseUrl) || OPENAI_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // console.log("[Proxy] ", path);
  // console.log("[Base Url]", baseUrl);

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  if (isAzure) {
    const azureApiVersion =
      req?.nextUrl?.searchParams?.get("api-version") ||
      serverConfig.azureApiVersion;
    baseUrl = baseUrl.split("/deployments").shift() as string;
    path = `${req.nextUrl.pathname.replaceAll(
      "/api/azure/",
      "openai/",
    )}?api-version=${azureApiVersion}`;

    // Forward compatibility:
    // if display_name(deployment_name) not set, and '{deploy-id}' in AZURE_URL
    // then using default '{deploy-id}'
    if (serverConfig.customModels && serverConfig.azureUrl) {
      const modelName = path.split("/")[1];
      let realDeployName = "";
      serverConfig.customModels
        .split(",")
        .filter((v) => !!v && !v.startsWith("-") && v.includes(modelName))
        .forEach((m) => {
          const [fullName, displayName] = m.split("=");
          const [_, providerName] = getModelProvider(fullName);
          if (providerName === "azure" && !displayName) {
            const [_, deployId] = (serverConfig?.azureUrl ?? "").split(
              "deployments/",
            );
            if (deployId) {
              realDeployName = deployId;
            }
          }
        });
      if (realDeployName) {
        console.log("[Replace with DeployId", realDeployName);
        path = path.replaceAll(modelName, realDeployName);
      }
    }
  }

  const fetchUrl = cloudflareAIGatewayUrl(`${baseUrl}/${path}`);
  console.log("fetchUrl", fetchUrl);
  // const jsonBody = await req.json();
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: authValue,
      ...(serverConfig.openaiOrgId && {
        "OpenAI-Organization": serverConfig.openaiOrgId,
      }),
    },
    method: req.method,
    body: req.body,
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // console.log('4444444444444444', fetchUrl, req.body)
  // requestLog(req, jsonBody, path);
  // #1815 try to refuse gpt4 request
  if (serverConfig.customModels && req.body) {
    try {
      const clonedBody = await req.text();
      fetchOptions.body = clonedBody;

      const jsonBody = JSON.parse(clonedBody) as { model?: string };

      // not undefined and is false
      if (
        isModelNotavailableInServer(
          serverConfig.customModels,
          jsonBody?.model as string,
          [
            ServiceProvider.OpenAI,
            ServiceProvider.Azure,
            jsonBody?.model as string, // support provider-unspecified model
          ],
        )
      ) {
        return NextResponse.json(
          {
            error: true,
            message: `you are not allowed to use ${jsonBody?.model} model`,
          },
          {
            status: 403,
          },
        );
      }
    } catch (e) {
      console.error("[OpenAI] gpt4 filter", e);
    }
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // Extract the OpenAI-Organization header from the response
    const openaiOrganizationHeader = res.headers.get("OpenAI-Organization");

    // Check if serverConfig.openaiOrgId is defined and not an empty string
    if (serverConfig.openaiOrgId && serverConfig.openaiOrgId.trim() !== "") {
      // If openaiOrganizationHeader is present, log it; otherwise, log that the header is not present
      console.log("[Org ID]", openaiOrganizationHeader);
    } else {
      // console.log("[Org ID] is not set up.");
    }

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    // Conditionally delete the OpenAI-Organization header from the response if [Org ID] is undefined or empty (not setup in ENV)
    // Also, this is to prevent the header from being sent to the client
    if (!serverConfig.openaiOrgId || serverConfig.openaiOrgId.trim() === "") {
      newHeaders.delete("OpenAI-Organization");
    }

    // The latest version of the OpenAI API forced the content-encoding to be "br" in json response
    // So if the streaming is disabled, we need to remove the content-encoding header
    // Because Vercel uses gzip to compress the response, if we don't remove the content-encoding header
    // The browser will try to decode the response with brotli and fail
    newHeaders.delete("content-encoding");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestLog(
  req: NextRequest,
  jsonBody: any,
  url_path: string,
  responseStatus: boolean,
  modelProvider: ModelProvider,
) {
  // LOG
  try {
    if (url_path.startsWith("mj/") && !url_path.startsWith("mj/submit/")) {
      return;
    }
    const baseUrl = "http://localhost:3000";
    const ip = getIP(req);
    const getModel = (): string => {
      if (modelProvider.toLowerCase() === "google") {
        const regex = /\/models\/([^:]+)/;
        const match = url_path.match(regex);
        if (match) {
          return `${match[1]}@${modelProvider}`;
        }
      }
      if (url_path.startsWith("mj/")) {
        return `midjourney@${modelProvider}`;
      }
      if (modelProvider.toLowerCase() === "google") {
        // 使用正则表达式提取模型名称
        const regex = /(gemini-[\d.]+-pro-latest)/;
        const match = url_path.match(regex);
        if (match) {
          return `${match[1]}@${modelProvider}`;
        }
        return `undefined@${modelProvider}`;
      }
      return `${jsonBody?.model}@${modelProvider}`;
    };
    let { session, name } = await getSessionName();
    // console.log("[中文]", name, session, baseUrl);
    const logData: Partial<CusLogEntry> = {
      ip: ip,
      path: url_path,
      logEntry: JSON.stringify(jsonBody),
      // logResponseEntry: JSON.stringify(jsonResponseBody),
      responseStatus: responseStatus,
      model: getModel(), // 后面尝试请求是添加到参数
      userName: name,
      userID: session?.user?.id,
    };
    // console.log("33333333333333333", logData);
    saveLogs(logData);
  } catch (e) {
    console.log("[LOG]", e, "==========");
  }
}

const calLogMoney = (logData: Partial<CusLogEntry>): number => {
  // 尝试大概计算费用，单位美元

  // azure的先不收费
  if (logData?.path && logData.path.startsWith("openai/deployments/")) {
    return 0.0;
  }

  // 其它模型按照官方的提示补全的平均数计算
  const logToken = logData?.logToken || 0;
  if (logData?.model) {
    try {
      const [model, provider] = logData?.model.split("@");
      switch (model) {
        case "midjourney":
          return 0.2;
        case "o1-preview-all":
          return 0.06;
        case "o1-all":
          return 0.1;
        case "o1-pro-all":
          return 0.2;
        case "o1-preview-2024-09-12":
          return logToken * 0.0000375;
        case "moonshot-v1-8k":
          return logToken * 0.00002;
        case "claude-3-opus-20240229":
        case "claude-3-5-haiku-20241022":
        case "claude-3-5-sonnet-20240620":
        case "claude-3-5-sonnet-20241022":
          return logToken * 0.000004;
        case "deepseek-chat":
        case "deepseek-coder":
          return (logToken * 0.14) / 1000000;
        // 谷歌的本身就免费
        case "gemini-1.5-pro-latest":
        default:
          return 0.0;
      }
    } catch (error) {
      return 0.0;
    }
  }
  return 0.0;
};

export async function saveLogs(logData: Partial<CusLogEntry>) {
  try {
    if (logData?.logEntry) {
      const regex_message = /(?<="content":")(.*?)(?="}[,\]])/g;
      const matchAllMessage = logData.logEntry.match(regex_message);
      // console.log(matchAllMessage, "=====");
      if (matchAllMessage && matchAllMessage.length > 0) {
        logData.logToken =
          getTokenLength(matchAllMessage.join(" ")) +
          matchAllMessage.length * 3;
      }
      console.log("[debug log]----", logData);
      delete logData?.logEntry;
    }
    if (logData?.model == "midjourney") {
      logData.logToken = 1000;
    }
  } catch (e) {
    console.log("[LOG]", "logToken", e);
    logData.logToken = 0;
  }
  try {
    if (logData?.logResponseEntry) {
      const regex_message = /(?<="content":")(.*?)(?="}[,\]])/g;
      const matchAllMessage = logData.logResponseEntry.match(regex_message);
      // console.log(matchAllMessage, "=====");
      if (matchAllMessage && matchAllMessage.length > 0) {
        logData.logResponseToken =
          getTokenLength(matchAllMessage.join(" ")) + matchAllMessage.length;
      }
      // console.log("[debug log]----", logData);
      delete logData?.logResponseEntry;
    }
  } catch (e) {
    // console.log("[LOG]", "logToken", e);
    logData.logResponseToken = 0;
  }

  logData.logMoney = calLogMoney(logData);
  // 如果请求失败，这些都归零
  if (logData.responseStatus === false) {
    logData.logToken = logData.logResponseToken = logData.logMoney = 0;
  }
  // console.log("-----------------", logData);
  try {
    const result = await prisma.logEntry.create({
      data: logData,
    });
  } catch (e) {
    // console.log("-------[debug log2]", logData);
    delete logData?.userID;
    const result = await prisma.logEntry.create({
      data: logData,
    });
  }

  // console.log("result", result)
}
