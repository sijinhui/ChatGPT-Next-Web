import { ApiPath, ModelProvider } from "@/app/constant";
import { NextRequest, NextResponse } from "next/server";
import { handle as openaiHandler } from "../../openai";
import { handle as azureHandler } from "../../azure";
import { handle as googleHandler } from "../../google";
import { handle as anthropicHandler } from "../../anthropic";
import { handle as baiduHandler } from "../../baidu";
import { handle as bytedanceHandler } from "../../bytedance";
import { handle as alibabaHandler } from "../../alibaba";
import { handle as moonshotHandler } from "../../moonshot";
import { handle as stabilityHandler } from "../../stability";
import { handle as iflytekHandler } from "../../iflytek";
import { handle as deepseekHandler } from "../../deepseek";
import { handle as siliconflowHandler } from "../../siliconflow";
import { handle as xaiHandler } from "../../xai";
import { handle as chatglmHandler } from "../../glm";
import { handle as proxyHandler } from "../../proxy";
import { requestLog } from "@/app/api/common";

async function handle(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  const apiPath = `/api/${params.provider}`;
  console.log(`[${params.provider} Route] params `, params);
  const reqClone = req.clone();
  // 从克隆的请求中读取请求体数据
  let reqData = {};
  try {
    reqData = await reqClone.json(); // 假设请求体是 JSON 格式
  } catch (error) {}

  let r: Promise<
    NextResponse<{ body: string }> | NextResponse<{ error: string }> | Response
  >;
  switch (apiPath) {
    case ApiPath.Azure:
      r = azureHandler(req, { params });
      break;
    case ApiPath.Google:
      r = googleHandler(req, { params });
      break;
    case ApiPath.Anthropic:
      r = anthropicHandler(req, { params });
      break;
    case ApiPath.Baidu:
      r = baiduHandler(req, { params });
      break;
    case ApiPath.ByteDance:
      r = bytedanceHandler(req, { params });
      break;
    case ApiPath.Alibaba:
      r = alibabaHandler(req, { params });
      break;
    // case ApiPath.Tencent: using "/api/tencent"
    case ApiPath.Moonshot:
      r = moonshotHandler(req, { params });
      break;
    case ApiPath.Stability:
      r = stabilityHandler(req, { params });
      break;
    case ApiPath.Iflytek:
      r = iflytekHandler(req, { params });
    case ApiPath.DeepSeek:
      r = deepseekHandler(req, { params });
      break;
    case ApiPath.XAI:
      r = xaiHandler(req, { params });
      break;
    case ApiPath.ChatGLM:
      r = chatglmHandler(req, { params });
      break;
    case ApiPath.SiliconFlow:
      r = siliconflowHandler(req, { params });
      break;
    case ApiPath.OpenAI:
      r = openaiHandler(req, { params });
      break;
    default:
      r = proxyHandler(req, { params });
  }

  // 当 r 解决后执行回调
  r.then((response) => {
    // 处理请求数据
    const url = req.nextUrl;
    requestLog(
      req,
      reqData,
      url.pathname,
      response.ok,
      params.provider as ModelProvider,
    );
  });

  return r;
}

export const GET = handle;
export const POST = handle;

// export const runtime = "edge";
export const preferredRegion = [
  "arn1",
  "bom1",
  "cdg1",
  "cle1",
  "cpt1",
  "dub1",
  "fra1",
  "gru1",
  "hnd1",
  "iad1",
  "icn1",
  "kix1",
  "lhr1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
];
