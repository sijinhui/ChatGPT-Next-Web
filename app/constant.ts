export const OWNER = "Yidadaa";
export const REPO = "ChatGPT-Next-Web";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

export const DEFAULT_API_HOST = "https://api.nextchat.dev";
export const OPENAI_BASE_URL = "https://api.openai.com";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/";

export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",
  Auth = "/auth",
  Reward = "/reward",
}

export enum ApiPath {
  Cors = "",
  OpenAI = "/api/openai",
  Anthropic = "/api/anthropic",
}

export enum SlotID {
  AppBody = "app-body",
  CustomModel = "custom-model",
}

export enum FileName {
  Masks = "masks.json",
  Prompts = "prompts.json",
}

export enum StoreKey {
  Chat = "chat-next-web-store",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",
}

export const DEFAULT_SIDEBAR_WIDTH = 300;
export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const ACCESS_CODE_PREFIX = "nk-";

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "chatgpt-next-web";

export const REQUEST_TIMEOUT_MS = 120000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export enum ServiceProvider {
  OpenAI = "OpenAI",
  Azure = "Azure",
  Google = "Google",
  Anthropic = "Anthropic",
}

export enum ModelProvider {
  GPT = "GPT",
  GeminiPro = "GeminiPro",
  Claude = "Claude",
}

export const Anthropic = {
  ChatPath: "v1/messages",
  ChatPath1: "v1/complete",
  ExampleEndpoint: "https://api.anthropic.com",
  Vision: "2023-06-01",
};

export const OpenaiPath = {
  ChatPath: "v1/chat/completions",
  // Azure32kPath:
  //   "openai/deployments/gpt-4-32k/chat/completions?api-version=2023-05-15",
  // Azure32kPathCheck: "openai/deployments/gpt-4-32k/chat/completions",
  UsagePath: "dashboard/billing/usage",
  SubsPath: "dashboard/billing/subscription",
  ListModelPath: "v1/models",
};

export const Azure = {
  ExampleEndpoint: "https://{resource-url}/openai/deployments/{deploy-id}",
};

export const Google = {
  ExampleEndpoint: "https://generativelanguage.googleapis.com/",
  ChatPath: (modelName: string) => `v1beta/models/${modelName}:generateContent`,
  // VisionChatPath: (modelName: string) =>
  //   `v1beta/models/${modelName}:generateContent`,
};

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
// export const DEFAULT_SYSTEM_TEMPLATE = `
// You are ChatGPT, a large language model trained by {{ServiceProvider}}.
// Knowledge cutoff: {{cutoff}}
// Current model: {{model}}
// Current time: {{time}}
// Latex inline: $x^2$
// Latex block: $$e=mc^2$$
// `;
export const DEFAULT_SYSTEM_TEMPLATE = `
You are ChatGPT, a large language model trained by {{ServiceProvider}}.
Knowledge cutoff: {{cutoff}}
Current model: {{model}}
Current time: {{time}}
Latex inline: \\(x^2\\) 
Latex block: $$e=mc^2$$
`;

export const SUMMARIZE_MODEL = "gpt-4o";
export const GEMINI_SUMMARIZE_MODEL = "gemini-pro";

export const KnowledgeCutOffDate: Record<string, string> = {
  default: "2021-09",
  "gpt-4o": "2023-10",
  "gpt-4-turbo": "2023-12",
  "gpt-4-turbo-2024-04-09": "2023-12",
  "gpt-4-turbo-preview": "2023-12",
  "gpt-4o-2024-05-13": "2023-10",
  "gpt-4-vision-preview": "2023-04",
  // After improvements,
  // it's now easier to add "KnowledgeCutOffDate" instead of stupid hardcoding it, as was done previously.
  "gemini-pro": "2023-12",
  "gemini-pro-vision": "2023-12",
};

const openaiModels = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-0125",
  "gpt-4",
  "gpt-4-0613",
  "gpt-4-32k",
  "gpt-4-32k-0613",
  "gpt-4-turbo",
  "gpt-4-turbo-preview",
  "gpt-4o",
  "gpt-4o-2024-05-13",
  "gpt-4-vision-preview",
  "gpt-4-turbo-2024-04-09",
];

const googleModels = [
  "gemini-1.0-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
  "gemini-pro-vision",
];

const anthropicModels = [
  "claude-instant-1.2",
  "claude-2.0",
  "claude-2.1",
  "claude-3-sonnet-20240229",
  "claude-3-opus-20240229",
  "claude-3-haiku-20240307",
  "claude-3-5-sonnet-20240620",
];

// export const DEFAULT_MODELS = [
//   ...openaiModels.map((name) => ({
//     name,
//     available: true,
//     provider: {
//       id: "openai",
//       providerName: "OpenAI",
//       providerType: "openai",
//     },
//   })),
//   ...googleModels.map((name) => ({
//     name,
//     available: true,
//     provider: {
//       id: "google",
//       providerName: "Google",
//       providerType: "google",
//     },
//   })),
//   ...anthropicModels.map((name) => ({
//     name,
//     available: true,
//     provider: {
//       id: "anthropic",
//       providerName: "Anthropic",
//       providerType: "anthropic",
//     },
//   })),
// ] as const;

export const DEFAULT_MODELS = [
  {
    name: "gpt-3.5-turbo",
    describe: "GPT-3,质量一般,便宜",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4o",
    describe: "GPT-4o,最新版,全能,快速,推荐",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-turbo-2024-04-09",
    describe: "GPT-4,标准版",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  // {
  //   name: "gpt-35-turbo-0125",
  //   describe: "GPT-3,微软,备用",
  //   available: true,
  //   provider: {
  //     id: "openai",
  //     providerName: "OpenAI",
  //     providerType: "openai",
  //   },
  // },
  {
    name: "claude-3-5-sonnet-20240620",
    describe: "claude第三代模型最强版",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  // {
  //   name: "gpt-4o-2024-05-13",
  //   available: true,
  //   describe: "GPT-4多模态,原生代理",
  //   provider: {
  //     id: "openai",
  //     providerName: "OpenAI",
  //     providerType: "openai",
  //   },
  // },
  {
    name: "gemini-1.5-pro-latest",
    available: true,
    describe: "谷歌的,不要钱,质量还不错",
    provider: {
      id: "google",
      providerName: "Google",
      providerType: "google",
    },
  },
  {
    name: "gpt-4o-all",
    describe: "GPT-4,最新版,省着点用",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  // {
  //   name: "gpt-4-32k",
  //   describe: "GPT-4,聪明,慢,但是白嫖",
  //   available: false,
  // },
  // {
  //   name: "gpt-4-all",
  //   describe: "GPT-4全能版,联网绘图多模态,又慢又贵",
  //   available: false,
  // },
  // {
  //   name: "gpt-4v",
  //   describe: "GPT-4,官方网页版,最聪明,贵且慢",
  //   available: true,
  // },
  // {
  //   name: "net-gpt-4",
  //   describe: "GPT-4,联网版,最慢",
  //   available: true,
  // },
  {
    name: "midjourney",
    describe: "绘图用,不用选",
    available: false,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
] as const;

export const AZURE_MODELS: string[] = [
  //"gpt-35-turbo-0125",
  "gpt-4-turbo-2024-04-09",
  "gpt-4o",
];
// export const AZURE_PATH = AZURE_MODELS.map((m) => { m: `openai/deployments/${m}/chat/completions`});
// export const AZURE_PATH = AZURE_MODELS.map((m) => ({ m: `openai/deployments/${m}/chat/completions`} ));
export const AZURE_PATH = AZURE_MODELS.reduce(
  (acc, item) => ({
    ...acc,
    [item]: `openai/deployments/${item}/chat/completions`,
  }),
  {},
);
// console.log(AZURE_PATH);

export const DISABLE_MODELS = DEFAULT_MODELS.filter(
  (item) => !item.available,
).map((item2) => item2.name);

// console.log('========', DISABLE_MODELS)
export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;

// some famous webdav endpoints
export const internalAllowedWebDavEndpoints = [
  "https://dav.jianguoyun.com/dav/",
  "https://dav.dropdav.com/",
  "https://dav.box.com/dav",
  "https://nanao.teracloud.jp/dav/",
  "https://bora.teracloud.jp/dav/",
  "https://webdav.4shared.com/",
  "https://dav.idrivesync.com",
  "https://webdav.yandex.com",
  "https://app.koofr.net/dav/Koofr",
];
