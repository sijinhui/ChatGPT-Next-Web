import { getMessageTextContent, trimTopic } from "../utils";

import { indexedDBStorage } from "@/app/utils/indexedDB-storage";
import { nanoid } from "nanoid";
import { showToast } from "../components/ui-lib";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  ServiceProvider,
  StoreKey,
} from "../constant";
import Locale, { getLang } from "../locales";
import { isDalle3, safeLocalStorage } from "../utils";
import {
  getClientApi,
  getHeaders,
  useGetMidjourneySelfProxyUrl,
} from "../client/api";
import type {
  ClientApi,
  RequestMessage,
  MultimodalContent,
} from "../client/api";
import { ChatControllerPool } from "../client/controller";
import { prettyObject } from "../utils/format";
import { createPersistStore } from "../utils/store";
import { estimateTokenLength } from "../utils/token";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import { createEmptyMask, Mask } from "./mask";

const localStorage = safeLocalStorage();

export type ChatMessageTool = {
  id: string;
  index?: number;
  type?: string;
  function?: {
    name: string;
    arguments?: string;
  };
  content?: string;
  isError?: boolean;
};

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  tools?: ChatMessageTool[];
  attr?: any;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
  };
}
// if it is using gpt-* models, force to use 4o-mini to summarize
const ChatFetchTaskPool: Record<string, any> = {};

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
  // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
  const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

  var serviceProvider = "OpenAI";
  if (modelInfo) {
    // TODO: auto detect the providerName from the modelConfig.model

    // Directly use the providerName from the modelInfo
    serviceProvider = modelInfo.provider.providerName;
  }

  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // remove duplicate
  if (input.startsWith(output)) {
    output = "";
  }

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

const DEFAULT_CHAT_STATE = {
  sessions: [createEmptySession()],
  currentSessionIndex: 0,
  lastInput: "",
};

export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      forkSession() {
        // 获取当前会话
        const currentSession = get().currentSession();
        if (!currentSession) return;

        const newSession = createEmptySession();

        newSession.topic = currentSession.topic;
        newSession.messages = [...currentSession.messages];
        newSession.mask = {
          ...currentSession.mask,
          modelConfig: {
            ...currentSession.mask.modelConfig,
          },
        };

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [newSession, ...state.sessions],
        }));
      },

      clearSessions() {
        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession(
        mask?: Mask,
        currentModel?: Mask["modelConfig"]["model"],
        currentProviderName?: ServiceProvider,
      ) {
        const session = createEmptySession();
        const config = useAppConfig.getState();
        // console.log("------", session, "2222", config);
        // 继承当前会话的模型,
        // 新增继承模型提供者
        if (currentModel) {
          session.mask.modelConfig.model = currentModel;
        }
        if (currentProviderName) {
          session.mask.modelConfig.providerName = currentProviderName;
        }
        if (mask) {
          const config = useAppConfig.getState();
          const globalModelConfig = config.modelConfig;

          session.mask = {
            ...mask,
            modelConfig: {
              ...globalModelConfig,
              ...mask.modelConfig,
            },
          };
          session.topic = mask.name;
        }

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [session].concat(state.sessions),
        }));
      },

      nextSession(delta: number) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      deleteSession(index: number) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const sessions = get().sessions.slice();
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          nextIndex = 0;
          sessions.push(createEmptySession());
        }

        // for undo delete action
        const restoreState = {
          currentSessionIndex: get().currentSessionIndex,
          sessions: get().sessions.slice(),
        };

        set(() => ({
          currentSessionIndex: nextIndex,
          sessions,
        }));

        showToast(
          Locale.Home.DeleteToast,
          {
            text: Locale.Home.Revert,
            onClick() {
              set(() => restoreState);
            },
          },
          5000,
        );
      },

      currentSession(): ChatSession {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });
        get().updateStat(message);
        get().summarizeSession();
      },

      fetchMidjourneyStatus(botMessage: ChatMessage, extAttr?: any) {
        const taskId = botMessage?.attr?.taskId;
        if (
          !taskId ||
          ["SUCCESS", "FAILURE"].includes(botMessage?.attr?.status) ||
          ChatFetchTaskPool[taskId]
        )
          return;
        ChatFetchTaskPool[taskId] = setTimeout(async () => {
          ChatFetchTaskPool[taskId] = null;
          const statusRes = await fetch(
            `/api/midjourney/mj/task/${taskId}/fetch`,
            {
              method: "GET",
              headers: getHeaders(),
            },
          );
          const statusResJson = await statusRes.json();
          if (statusRes.status < 200 || statusRes.status >= 300) {
            botMessage.content =
              Locale.Midjourney.TaskStatusFetchFail +
                ": " +
                (statusResJson?.error || statusResJson?.description) ||
              Locale.Midjourney.UnknownReason;
            console.log("【mid】状态码不对");
          } else {
            let isFinished = false;
            let content;
            const prefixContent = Locale.Midjourney.TaskPrefix(
              statusResJson.prompt,
              taskId,
            );
            console.log("【mid】请求成功了", statusResJson);
            switch (statusResJson?.status) {
              case "SUCCESS":
                console.log("[mid] SUCCESS", statusResJson);

                content = statusResJson.imageUrl;
                isFinished = true;
                if (statusResJson.imageUrl) {
                  let imgUrl = useGetMidjourneySelfProxyUrl(
                    statusResJson.imageUrl,
                  );
                  botMessage.attr.imgUrl = imgUrl;
                  botMessage.content =
                    prefixContent + `[![${taskId}](${imgUrl})](${imgUrl})`;
                }
                if (
                  statusResJson.action === "DESCRIBE" &&
                  statusResJson.prompt
                ) {
                  botMessage.content += `\n${statusResJson.prompt}`;
                }
                break;
              case "FAILURE":
                console.log("[mid] FAILURE", statusResJson);
                content =
                  statusResJson.failReason || Locale.Midjourney.UnknownReason;
                isFinished = true;
                botMessage.content =
                  prefixContent +
                  `**${
                    Locale.Midjourney.TaskStatus
                  }:** [${new Date().toLocaleString()}] - ${content}`;
                break;
              case "NOT_START":
                content = Locale.Midjourney.TaskNotStart;
                break;
              case "IN_PROGRESS":
                console.log("[mid] ", statusResJson);
                content = Locale.Midjourney.TaskProgressTip(
                  statusResJson.progress,
                );
                break;
              case "SUBMITTED":
                content = Locale.Midjourney.TaskRemoteSubmit;
                break;
              default:
                console.log("[mid] ", statusResJson);
                content = statusResJson.status;
            }
            botMessage.attr.status = statusResJson.status;
            if (isFinished) {
              botMessage.attr.finished = true;
            } else {
              botMessage.content =
                prefixContent +
                `**${
                  Locale.Midjourney.TaskStatus
                }:** [${new Date().toLocaleString()}] - ${content}`;
              if (
                statusResJson.status === "IN_PROGRESS" &&
                statusResJson.imageUrl
              ) {
                let imgUrl = useGetMidjourneySelfProxyUrl(
                  statusResJson.imageUrl,
                );
                botMessage.attr.imgUrl = imgUrl;
                botMessage.content += `\n[![${taskId}](${imgUrl})](${imgUrl})`;
              }
              this.fetchMidjourneyStatus(taskId, botMessage);
            }
            set(() => ({}));
            if (isFinished) {
              extAttr?.setAutoScroll(true);
            }
          }
        }, 3000);
      },

      // async onUserInput(content: string, extAttr?: any) {
      async onUserInput(
        content: string,
        attachImages?: string[],
        extAttr?: any,
      ) {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        let userContent: string = "";
        if (
          extAttr?.mjImageMode &&
          attachImages &&
          attachImages.length > 0 &&
          extAttr.mjImageMode !== "IMAGINE"
        ) {
          if (
            extAttr.mjImageMode === "BLEND" &&
            (attachImages.length < 2 || attachImages.length > 5)
          ) {
            alert(Locale.Midjourney.BlendMinImg(2, 5));
            return new Promise((resolve: any, reject) => {
              resolve(false);
            });
          }
          userContent = `/mj ${extAttr?.mjImageMode}`;
          attachImages.forEach((img: any, index: number) => {
            userContent += `::[${index + 1}]${img.filename}`;
          });
        } else {
          userContent = fillTemplateWith(content, modelConfig);
        }

        // console.log("[User Input] after template: ", userContent);

        let mContent: string | MultimodalContent[] = userContent;

        if (attachImages && attachImages.length > 0) {
          mContent = [
            {
              type: "text",
              text: userContent,
            },
          ];
          mContent = mContent.concat(
            attachImages.map((url) => {
              return {
                type: "image_url",
                image_url: {
                  url: url,
                },
              };
            }),
          );
        }
        let userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
        });

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model,
          attr: {},
        });

        // get recent messages
        const recentMessages = get().getMessagesWithMemory();
        const sendMessages = recentMessages.concat(userMessage);
        const messageIndex = get().currentSession().messages.length + 1;

        // save user's and bot's message
        get().updateCurrentSession((session) => {
          const savedUserMessage = {
            ...userMessage,
            content: mContent,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });
        const current_day_token = parseInt(
          localStorage.getItem("current_day_token") ?? "0",
        );
        const current_day_limit_token = parseInt(
          localStorage.getItem("current_day_limit_token") ?? "200000",
        );
        // console.log('---------', current_day_token)
        if (current_day_token >= current_day_limit_token) {
          botMessage.content +=
            "\n\n" +
            prettyObject({
              error: true,
              message: "当日请求过多。",
            });
          botMessage.streaming = false;
          get().onNewMessage(botMessage);
          set(() => ({}));
          extAttr?.setAutoScroll(true);

          return;
        }

        if (
          content.toLowerCase().startsWith("/mj") ||
          content.toLowerCase().startsWith("/MJ")
        ) {
          botMessage.model = "midjourney";
          const startFn = async () => {
            const prompt = content.substring(3).trim();
            let action: string = "IMAGINE";
            const firstSplitIndex = prompt.indexOf("::");
            if (firstSplitIndex > 0) {
              action = prompt.substring(0, firstSplitIndex);
            }
            if (
              ![
                "UPSCALE",
                "VARIATION",
                "IMAGINE",
                "DESCRIBE",
                "BLEND",
                "REROLL",
              ].includes(action)
            ) {
              botMessage.content = Locale.Midjourney.TaskErrUnknownType;
              botMessage.streaming = false;
              return;
            }
            console.log("[action] ", action);
            botMessage.attr.action = action;
            let actionIndex: any = null;
            let actionUseTaskId: any = null;
            if (
              action === "VARIATION" ||
              action == "UPSCALE" ||
              action == "REROLL"
            ) {
              actionIndex = parseInt(
                prompt.substring(firstSplitIndex + 2, firstSplitIndex + 3),
              );
              actionUseTaskId = prompt.substring(firstSplitIndex + 5);
            }
            try {
              let res = null;
              const reqFn = (path: string, method: string, body?: any) => {
                return fetch("/api/midjourney/mj/" + path, {
                  method: method,
                  headers: getHeaders(),
                  body: body,
                });
              };
              switch (action) {
                case "IMAGINE": {
                  res = await reqFn(
                    "submit/imagine",
                    "POST",
                    JSON.stringify({
                      prompt: prompt,
                      base64Array:
                        attachImages && attachImages.length > 0
                          ? [attachImages?.[0]]
                          : null,
                    }),
                  );
                  break;
                }
                case "DESCRIBE": {
                  res = await reqFn(
                    "submit/describe",
                    "POST",
                    JSON.stringify({
                      base64: attachImages?.[0],
                    }),
                  );
                  break;
                }
                case "BLEND": {
                  const base64Array = attachImages;
                  res = await reqFn(
                    "submit/blend",
                    "POST",
                    JSON.stringify({ base64Array }),
                  );
                  break;
                }
                case "UPSCALE":
                case "VARIATION":
                case "REROLL": {
                  res = await reqFn(
                    "submit/change",
                    "POST",
                    JSON.stringify({
                      action: action,
                      index: actionIndex,
                      taskId: actionUseTaskId,
                    }),
                  );
                  break;
                }
                default:
              }
              if (res == null) {
                botMessage.content =
                  Locale.Midjourney.TaskErrNotSupportType(action);
                botMessage.streaming = false;
                return;
              }
              if (!res.ok) {
                const text = await res.text();
                throw new Error(
                  `\n${Locale.Midjourney.StatusCode(
                    res.status,
                  )}\n${Locale.Midjourney.RespBody(
                    text || Locale.Midjourney.None,
                  )}`,
                );
              }
              const resJson = await res.json();
              if (
                res.status < 200 ||
                res.status >= 300 ||
                (resJson.code != 1 && resJson.code != 22)
              ) {
                botMessage.content = Locale.Midjourney.TaskSubmitErr(
                  resJson?.msg ||
                    resJson?.error ||
                    resJson?.description ||
                    Locale.Midjourney.UnknownError,
                );
              } else {
                const taskId: string = resJson.result;
                const prefixContent = Locale.Midjourney.TaskPrefix(
                  prompt,
                  taskId,
                );
                botMessage.content =
                  prefixContent +
                    `[${new Date().toLocaleString()}] - ${
                      Locale.Midjourney.TaskSubmitOk
                    }: ` +
                    resJson?.description || Locale.Midjourney.PleaseWait;
                botMessage.attr.taskId = taskId;
                botMessage.attr.status = resJson.status;
                this.fetchMidjourneyStatus(botMessage, extAttr);
              }
            } catch (e: any) {
              console.error(e);
              botMessage.content = Locale.Midjourney.TaskSubmitErr(
                e?.error || e?.message || Locale.Midjourney.UnknownError,
              );
            } finally {
              ChatControllerPool.remove(
                session.id,
                botMessage.id ?? messageIndex,
              );
              botMessage.streaming = false;
            }
          };
          await startFn();
          get().onNewMessage(botMessage);
          set(() => ({}));
          extAttr?.setAutoScroll(true);
        } else {
          const api: ClientApi = getClientApi(modelConfig.providerName);
          // make request
          api.llm.chat({
            messages: sendMessages,
            config: { ...modelConfig, stream: true },
            onUpdate(message) {
              botMessage.streaming = true;
              if (message) {
                botMessage.content = message;
              }
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onFinish(message) {
              botMessage.streaming = false;
              if (message) {
                botMessage.content = message;
                get().onNewMessage(botMessage);
              }
              ChatControllerPool.remove(session.id, botMessage.id);
            },
            onBeforeTool(tool: ChatMessageTool) {
              (botMessage.tools = botMessage?.tools || []).push(tool);
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onAfterTool(tool: ChatMessageTool) {
              botMessage?.tools?.forEach((t, i, tools) => {
                if (tool.id == t.id) {
                  tools[i] = { ...tool };
                }
              });
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onError(error) {
              const isAborted = error.message?.includes?.("aborted");
              botMessage.content +=
                "\n\n" +
                prettyObject({
                  error: true,
                  message: error.message,
                });
              botMessage.streaming = false;
              userMessage.isError = !isAborted;
              botMessage.isError = !isAborted;
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
              ChatControllerPool.remove(
                session.id,
                botMessage.id ?? messageIndex,
              );

              console.error("[Chat] failed ", error);
            },
            onController(controller) {
              // collect controller for stop/retry
              ChatControllerPool.addController(
                session.id,
                botMessage.id ?? messageIndex,
                controller,
              );
            },
          });
        }
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        if (session.memoryPrompt.length) {
          return {
            role: "system",
            content: Locale.Store.Prompt.History(session.memoryPrompt),
            date: "",
          } as ChatMessage;
        }
      },

      getMessagesWithMemory() {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts =
          modelConfig.enableInjectSystemPrompts &&
          (session.mask.modelConfig.model.startsWith("gpt-") ||
            session.mask.modelConfig.model.startsWith("chatgpt-"));

        var systemPrompts: ChatMessage[] = [];
        systemPrompts = shouldInjectSystemPrompts
          ? [
              createMessage({
                role: "system",
                content: fillTemplateWith("", {
                  ...modelConfig,
                  template: DEFAULT_SYSTEM_TEMPLATE,
                }),
              }),
            ]
          : [];
        if (shouldInjectSystemPrompts) {
          console.log(
            "[Global System Prompt] ",
            systemPrompts.at(0)?.content ?? "empty",
          );
        }
        const memoryPrompt = get().getMemoryPrompt();
        // long term memory
        const shouldSendLongTermMemory =
          modelConfig.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > clearContextIndex;
        const longTermMemoryPrompts =
          shouldSendLongTermMemory && memoryPrompt ? [memoryPrompt] : [];
        const longTermMemoryStartIndex = session.lastSummarizeIndex;

        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - modelConfig.historyMessageCount,
        );

        // lets concat send messages, including 4 parts:
        // 0. system prompt: to get close to OpenAI Web ChatGPT
        // 1. long term memory: summarized memory messages
        // 2. pre-defined in-context prompts
        // 3. short term memory: latest n messages
        // 4. newest input message
        const memoryStartIndex = shouldSendLongTermMemory
          ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
          : shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig.max_tokens;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
          tokenCount += estimateTokenLength(getMessageTextContent(msg));
          reversedRecentMessages.push(msg);
        }
        // concat all messages
        const recentMessages = [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...reversedRecentMessages.reverse(),
        ];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession() {
        get().updateCurrentSession((session) => {
          session.messages = [];
          session.memoryPrompt = "";
        });
      },

      summarizeSession(refreshTitle: boolean = false) {
        const config = useAppConfig.getState();
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        // skip summarize when using dalle3?
        if (isDalle3(modelConfig.model)) {
          return;
        }

        const providerName = modelConfig.compressProviderName;
        const api: ClientApi = getClientApi(providerName);

        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          (config.enableAutoGenerateTitle &&
            session.topic === DEFAULT_TOPIC &&
            countMessages(messages) >= SUMMARIZE_MIN_LEN) ||
          refreshTitle
        ) {
          const startIndex = Math.max(
            0,
            messages.length - modelConfig.historyMessageCount,
          );
          const topicMessages = messages
            .slice(
              startIndex < messages.length ? startIndex : messages.length - 1,
              messages.length,
            )
            .concat(
              createMessage({
                role: "user",
                content: Locale.Store.Prompt.Topic,
              }),
            );
          api.llm.chat({
            messages: topicMessages,
            config: {
              model: modelConfig.compressModel,
              providerName: modelConfig.compressProviderName,
              stream: false,
            },
            onFinish(message) {
              if (!isValidMessage(message)) return;
              get().updateCurrentSession(
                (session) =>
                  (session.topic =
                    message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC),
              );
            },
          });
        }
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > (modelConfig?.max_tokens ?? 4000)) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }
        const memoryPrompt = get().getMemoryPrompt();
        if (memoryPrompt) {
          // add memory prompt
          toBeSummarizedMsgs.unshift(memoryPrompt);
        }

        const lastSummarizeIndex = session.messages.length;

        // console.log(
        //   "[Chat History] ",
        //   toBeSummarizedMsgs,
        //   historyMsgLength,
        //   modelConfig.compressMessageLengthThreshold,
        // );

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          /** Destruct max_tokens while summarizing
           * this param is just shit
           **/
          const { max_tokens, ...modelcfg } = modelConfig;
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content: Locale.Store.Prompt.Summarize,
                date: "",
              }),
            ),
            config: {
              ...modelcfg,
              stream: true,
              model: modelConfig.compressModel,
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message) {
              console.log("[Memory] ", message);
              get().updateCurrentSession((session) => {
                session.lastSummarizeIndex = lastSummarizeIndex;
                session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
              });
            },
            onError(err) {
              console.error("[Summarize] ", err);
            },
          });
        }

        function isValidMessage(message: any): boolean {
          return typeof message === "string" && !message.startsWith("```json");
        }
      },

      updateStat(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },

      updateCurrentSession(updater: (session: ChatSession) => void) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        set(() => ({ sessions }));
      },

      async clearAllData() {
        await indexedDBStorage.clear();
        localStorage.clear();
        location.reload();
      },
      setLastInput(lastInput: string) {
        set({
          lastInput,
        });
      },
    };

    return methods;
  },
  {
    name: StoreKey.Chat,
    version: 3.2,
    migrate(persistedState, version) {
      const state = persistedState as any;
      const newState = JSON.parse(
        JSON.stringify(state),
      ) as typeof DEFAULT_CHAT_STATE;

      if (version < 2) {
        newState.sessions = [];

        const oldSessions = state.sessions;
        for (const oldSession of oldSessions) {
          const newSession = createEmptySession();
          newSession.topic = oldSession.topic;
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
          newState.sessions.push(newSession);
        }
      }

      if (version < 3) {
        // migrate id to nanoid
        newState.sessions.forEach((s) => {
          s.id = nanoid();
          s.messages.forEach((m) => (m.id = nanoid()));
        });
      }

      // Enable `enableInjectSystemPrompts` attribute for old sessions.
      // Resolve issue of old sessions not automatically enabling.
      if (version < 3.1) {
        newState.sessions.forEach((s) => {
          if (
            // Exclude those already set by user
            !s.mask.modelConfig.hasOwnProperty("enableInjectSystemPrompts")
          ) {
            // Because users may have changed this configuration,
            // the user's current configuration is used instead of the default
            const config = useAppConfig.getState();
            s.mask.modelConfig.enableInjectSystemPrompts =
              config.modelConfig.enableInjectSystemPrompts;
          }
        });
      }

      // add default summarize model for every session
      if (version < 3.2) {
        newState.sessions.forEach((s) => {
          const config = useAppConfig.getState();
          s.mask.modelConfig.compressModel = config.modelConfig.compressModel;
          s.mask.modelConfig.compressProviderName =
            config.modelConfig.compressProviderName;
        });
      }

      return newState as any;
    },
  },
);
