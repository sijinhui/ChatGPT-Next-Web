"use client";

import { useEffect } from "react";
import { LowLevelRTClient, SessionUpdateMessage } from "rt-client";
import { Player } from "./player.ts";
import { Recorder } from "./recorder.ts";

let realtimeStreaming: LowLevelRTClient;
let audioRecorder: Recorder;
let audioPlayer: Player;

export default function TestRealTime() {
  let recordingActive: boolean = false;
  let buffer: Uint8Array = new Uint8Array();

  function combineArray(newData: Uint8Array) {
    const newBuffer = new Uint8Array(buffer.length + newData.length);
    newBuffer.set(buffer);
    newBuffer.set(newData, buffer.length);
    buffer = newBuffer;
  }
  function getVoice(): "alloy" | "echo" | "shimmer" {
    // return formVoiceSelection.value as "alloy" | "echo" | "shimmer";
    return "alloy";
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

    const systemMessage = "You talk like a pirate";
    const temperature = 0.8;
    const voice = "alloy";

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
      console.log("-----", consoleLog, message);
    }
  }

  useEffect(() => {
    realtimeStreaming = new LowLevelRTClient(
      new URL("ws://localhost:23000"),
      { key: "" },
      { deployment: "realtime" },
    );

    const initStream = async () => {
      try {
        console.log("sending session config");
        console.log("-----", createConfigMessage());
        await realtimeStreaming.send(createConfigMessage());
      } catch (error) {
        console.log(error);
        console.log(
          "[Connection error]: Unable to send initial config message. Please check your endpoint and authentication details.",
        );
        // setFormInputState(InputState.ReadyToStart);
        return;
      }
      console.log("sent");
      await Promise.all([resetAudio(true), handleRealtimeMessages()]);
    };

    initStream();

    return () => {
      realtimeStreaming?.close();
    };
  }, []);

  return <div>My WebSocket test</div>;
}
