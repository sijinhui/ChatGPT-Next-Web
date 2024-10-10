"use client";

import { useEffect, useRef } from "react";
import { LowLevelRTClient, SessionUpdateMessage, AccessToken } from "rt-client";
import { Player } from "./player";
import { Recorder } from "./recorder";

let realtimeStreaming: LowLevelRTClient;
let audioRecorder: Recorder;
let audioPlayer: Player;

export default function TestRealTime() {
  let recordingActive: boolean = false;
  let buffer: Uint8Array = new Uint8Array();

  const formStartButton = useRef<HTMLButtonElement | null>(null);
  const formStopButton = useRef<HTMLButtonElement | null>(null);
  const formSessionInstructionsField = useRef<HTMLTextAreaElement | null>(null);
  const formReceivedTextContainer = useRef<HTMLDivElement | null>(null);
  const formVoiceSelection = useRef<HTMLSelectElement | null>(null);

  let latestInputSpeechBlock: Element;

  enum InputState {
    Working,
    ReadyToStart,
    ReadyToStop,
  }
  function setFormInputState(state: InputState) {
    // formEndpointField.disabled = state != InputState.ReadyToStart;
    // formApiKeyField.disabled = state != InputState.ReadyToStart;
    // formDeploymentOrModelField.disabled = state != InputState.ReadyToStart;
    if (formStartButton.current)
      formStartButton.current.disabled = state != InputState.ReadyToStart;
    if (formStopButton.current)
      formStopButton.current.disabled = state != InputState.ReadyToStop;
    if (formSessionInstructionsField.current)
      formSessionInstructionsField.current.disabled =
        state != InputState.ReadyToStart;
    // formAzureToggle.disabled = state != InputState.ReadyToStart;
  }

  function combineArray(newData: Uint8Array) {
    const newBuffer = new Uint8Array(buffer.length + newData.length);
    newBuffer.set(buffer);
    newBuffer.set(newData, buffer.length);
    buffer = newBuffer;
  }
  function getVoice() {
    // return formVoiceSelection.value as "alloy" | "echo" | "shimmer";
    return formVoiceSelection.current?.value as "alloy" | "echo" | "shimmer";
  }
  function getSystemMessage(): string {
    return (
      formSessionInstructionsField.current?.value || "You talk like a pirate"
    );
  }
  function makeNewTextBlock(text: string = "") {
    if (!formReceivedTextContainer.current) return;
    let newElement = document.createElement("p");
    newElement.textContent = text;
    formReceivedTextContainer.current.appendChild(newElement);
  }

  function appendToTextBlock(text: string) {
    if (!formReceivedTextContainer.current) return;
    let textElements = formReceivedTextContainer.current.children;
    if (textElements.length == 0) {
      makeNewTextBlock();
    }
    textElements[textElements.length - 1].textContent += text;
  }

  function createConfigMessage(): SessionUpdateMessage {
    let configMessage: SessionUpdateMessage = {
      type: "session.update",
      session: {
        turn_detection: {
          type: "server_vad",
        },
        input_audio_transcription: {
          model: "whisper-1",
        },
      },
    };

    const systemMessage = getSystemMessage();
    const temperature = 0.8;
    const voice = getVoice();

    if (systemMessage) {
      configMessage.session.instructions = systemMessage;
    }
    if (!isNaN(temperature)) {
      configMessage.session.temperature = temperature;
    }
    if (voice) {
      configMessage.session.voice = voice;
    }

    return configMessage;
  }
  function processAudioRecordingBuffer(data: Buffer) {
    const uint8Array = new Uint8Array(data);
    combineArray(uint8Array);
    if (buffer.length >= 4800) {
      const toSend = new Uint8Array(buffer.slice(0, 4800));
      buffer = new Uint8Array(buffer.slice(4800));
      const regularArray = String.fromCharCode(...toSend);
      const base64 = btoa(regularArray);
      if (recordingActive) {
        realtimeStreaming.send({
          type: "input_audio_buffer.append",
          audio: base64,
        });
      }
    }
  }
  async function resetAudio(startRecording: boolean) {
    recordingActive = false;
    if (audioRecorder) {
      audioRecorder.stop();
    }
    if (audioPlayer) {
      audioPlayer.clear();
    }
    audioRecorder = new Recorder(processAudioRecordingBuffer);
    audioPlayer = new Player();
    audioPlayer.init(24000);
    if (startRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRecorder.start(stream);
      recordingActive = true;
    }
  }
  async function handleRealtimeMessages() {
    for await (const message of realtimeStreaming.messages()) {
      let consoleLog = "" + message.type;

      switch (message.type) {
        case "session.created":
          setFormInputState(InputState.ReadyToStop);
          makeNewTextBlock("<< Session Started >>");
          makeNewTextBlock();
          break;
        case "response.audio_transcript.delta":
          appendToTextBlock(message.delta);
          break;
        case "response.audio.delta":
          const binary = atob(message.delta);
          const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
          const pcmData = new Int16Array(bytes.buffer);
          audioPlayer.play(pcmData);
          break;

        case "input_audio_buffer.speech_started":
          makeNewTextBlock("<< Speech Started >>");
          if (!formReceivedTextContainer.current) break;
          let textElements = formReceivedTextContainer.current.children;
          latestInputSpeechBlock = textElements[textElements.length - 1];
          makeNewTextBlock();
          audioPlayer.clear();
          break;
        case "conversation.item.input_audio_transcription.completed":
          latestInputSpeechBlock.textContent += " User: " + message.transcript;
          break;
        case "response.done":
          if (!formReceivedTextContainer.current) break;
          formReceivedTextContainer.current.appendChild(
            document.createElement("hr"),
          );
          break;
        default:
          consoleLog = JSON.stringify(message, null, 2);
          break;
      }
      if (consoleLog) {
        console.log(consoleLog);
      }
    }
    resetAudio(false);
  }

  const getToken = async () => {
    console.log("--");
    const response = await fetch("/api/get_voice_token/realtime");
    const result: AccessToken = await response.json();
    return result;
  };
  async function start_realtime() {
    realtimeStreaming = new LowLevelRTClient(
      // new URL("ws://localhost:23000"),
      new URL("wss://ainnovation-es2.openai.azure.com"),
      { getToken },
      { deployment: "gpt-4o-realtime-preview" },
    );

    try {
      console.log("sending session config");
      console.log("-----", createConfigMessage());
      await realtimeStreaming.send(createConfigMessage());
    } catch (error) {
      console.log(error);
      console.log(
        "[Connection error]: Unable to send initial config message. Please check your endpoint and authentication details.",
      );
      setFormInputState(InputState.ReadyToStart);
      return;
    }
    console.log("sent");
    await Promise.all([resetAudio(true), handleRealtimeMessages()]);
  }

  useEffect(() => {}, []);

  useEffect(() => {
    // const formReceivedTextContainer = document.querySelector<HTMLDivElement>(
    //   "#received-text-container",
    // )!;
    // const formStartButton =
    //   document.querySelector<HTMLButtonElement>("#start-recording")!;
    // const formStopButton =
    //   document.querySelector<HTMLButtonElement>("#stop-recording")!;
    // const formSessionInstructionsField =
    //   document.querySelector<HTMLTextAreaElement>("#session-instructions")!;
    // const formTemperatureField = document.querySelector<HTMLInputElement>("#temperature")!;
    // const formVoiceSelection = document.querySelector<HTMLInputElement>("#voice")!;

    const handleStartClick = async () => {
      setFormInputState(InputState.Working);

      try {
        start_realtime();
      } catch (error) {
        setFormInputState(InputState.ReadyToStart);
      }
    };
    const handleStopClick = async () => {
      setFormInputState(InputState.Working);
      resetAudio(false);
      realtimeStreaming?.close();
      setFormInputState(InputState.ReadyToStart);
    };
    const startButton = formStartButton.current;
    if (startButton) {
      startButton.addEventListener("click", handleStartClick);
    }
    const stopButton = formStopButton.current;
    if (stopButton) {
      stopButton.addEventListener("click", handleStopClick);
    }

    return () => {
      realtimeStreaming?.close();
      if (startButton) {
        startButton.removeEventListener("click", handleStartClick);
      }
      if (stopButton) {
        stopButton.removeEventListener("click", handleStopClick);
      }
    };
  });

  return (
    <form>
      {/*<div>My WebSocket test</div>*/}
      <div className="container">
        <div id="received-text-container" ref={formReceivedTextContainer}></div>
        <div className="controls">
          <div className="input-group">
            <div className="button-group">
              <button id="start-recording" type="button" ref={formStartButton}>
                Record
              </button>
              <button id="stop-recording" type="button" ref={formStopButton}>
                Stop
              </button>
            </div>
            <div className="input-group">
              <label htmlFor="session-instructions">System Message</label>
              <textarea
                id="session-instructions"
                placeholder="Optional instructions for the session, e.g. 'You talk like a pirate.'"
                rows={4}
                ref={formSessionInstructionsField}
              ></textarea>
            </div>
            <div className="input-group">
              <label htmlFor="temperature">Temperature</label>
              <input
                id="temperature"
                type="number"
                min="0.6"
                max="1.2"
                step="0.05"
                placeholder="0.6-1.2 (default 0.8)"
              />
            </div>
            <div className="input-group">
              <label htmlFor="voice">Voice</label>
              <select id="voice" ref={formVoiceSelection}>
                <option></option>
                <option>alloy</option>
                <option>echo</option>
                <option>shimmer</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
