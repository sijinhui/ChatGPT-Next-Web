'use client';

import { get_encoding } from "tiktoken";

const encoding = get_encoding("cl100k_base");

export function getTokenLength(input: string): number {
  return encoding.encode(input).length;
}