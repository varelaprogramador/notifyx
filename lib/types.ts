/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InstanceType } from "./config";

export interface Instance {
  id?: string;
  instanceName: string;
  instanceId?: string;
  token?: string;
  status?: "connected" | "disconnected" | "connecting" | "error";
  qrcode?: string;
  type: InstanceType;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  owner: string;
  config?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  isGroup: boolean;
  image?: string;
  description?: string;
  members?: number;
}

export interface Message {
  id: string;
  content: string;
  type: "text" | "image" | "audio" | "video" | "document";
  recipient: string;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "failed";
  mediaUrl?: string;
}

// Nova interface para scripts de mensagem
export interface MessageScript {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  isPublic?: boolean;
  tags?: string[];
}

// Interface para blocos de mensagem em scripts
export interface MessageBlock {
  id: string;
  content: string;
  delay: number;
}

// Interface para scripts com múltiplos blocos
export interface MessageScriptWithBlocks extends MessageScript {
  blocks: MessageBlock[];
}
