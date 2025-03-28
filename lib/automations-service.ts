/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

console.log("[DEBUG] lib/automations-service.ts - Arquivo carregado");

try {
  console.log("[DEBUG] Tentando importar getSupabaseClient");
  const { getSupabaseClient } = require("./supabase");
  console.log("[DEBUG] Importação de getSupabaseClient bem-sucedida");
} catch (error) {
  console.error("[DEBUG] Erro ao importar getSupabaseClient:", error);
}

try {
  console.log("[DEBUG] Tentando importar db");
  const { db } = require("./db");
  console.log("[DEBUG] Importação de db bem-sucedida");
} catch (error) {
  console.error("[DEBUG] Erro ao importar db:", error);
}

try {
  console.log("[DEBUG] Tentando importar getCurrentUserId");
  const { getCurrentUserId } = require("./current-user");
  console.log("[DEBUG] Importação de getCurrentUserId bem-sucedida");
} catch (error) {
  console.error("[DEBUG] Erro ao importar getCurrentUserId:", error);
}

import { getSupabaseClient } from "./supabase";
import { db } from "./db";
import type { WebhookLog } from "./database.types";
import { getCurrentUserId } from "./current-user";

// Types for the new automations structure
export type TriggerType = "webhook" | "schedule" | "message_received";
export type ActionType = "send_message" | "call_api" | "update_contact";

// Interface for a message block
export interface MessageBlock {
  id: string;
  content: string;
  delay: number;
}

// Base automation interface
export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  action_type: ActionType;
  action_config: Record<string, any>;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at?: string;
  // For backwards compatibility
  type?: "webhook" | "api";
  active?: boolean;
  config?: any;
  createdAt?: string;
  logs?: WebhookLog[];
}

// Webhook trigger specific configuration
export interface WebhookTriggerConfig {
  path: string;
  secret?: string;
}

// Send message action specific configuration
export interface SendMessageActionConfig {
  instance: string;
  messageTemplate: string;
  messageBlocks?: MessageBlock[];
}

// Function to convert from the database format to the application format
function mapFromSupabase(record: any): Automation {
  console.log("[DEBUG] mapFromSupabase - Entrada:", record);
  const result = {
    id: record.id,
    name: record.name,
    description: record.description,
    trigger_type: record.trigger_type,
    trigger_config: record.trigger_config,
    action_type: record.action_type,
    action_config: record.action_config,
    is_active: record.is_active,
    user_id: record.user_id,
    created_at: record.created_at,
    updated_at: record.updated_at,
    // For backwards compatibility
    type:
      record.trigger_type === "webhook"
        ? "webhook"
        : ("api" as "webhook" | "api"),
    active: record.is_active,
    config:
      record.trigger_type === "webhook"
        ? { ...record.trigger_config, ...record.action_config }
        : record.action_config,
    createdAt: record.created_at,
  };
  console.log("[DEBUG] mapFromSupabase - Saída:", result);
  return result;
}

// Function to convert from the application format to the database format

// Map old format to new format (for backwards compatibility)
function mapOldToNewFormat(oldAutomation: any): Automation {
  console.log("[DEBUG] mapOldToNewFormat - Entrada:", oldAutomation);

  if (oldAutomation.trigger_type) {
    // Already in new format
    console.log("[DEBUG] mapOldToNewFormat - Já está no novo formato");
    return oldAutomation as Automation;
  }

  const isWebhook = oldAutomation.type === "webhook";
  console.log("[DEBUG] mapOldToNewFormat - isWebhook:", isWebhook);

  try {
    console.log("[DEBUG] mapOldToNewFormat - Tentando obter getCurrentUserId");
    const userId = getCurrentUserId();
    console.log("[DEBUG] mapOldToNewFormat - userId:", userId);

    const result = {
      id: oldAutomation.id,
      name: oldAutomation.name,
      description: "",
      trigger_type: isWebhook ? "webhook" : ("call_api" as TriggerType),
      trigger_config: isWebhook
        ? {
            path: oldAutomation.config?.path,
            secret: oldAutomation.config?.secret,
          }
        : {},
      action_type: isWebhook ? "send_message" : ("call_api" as ActionType),
      action_config: isWebhook
        ? {
            instance: oldAutomation.config?.instance,
            messageTemplate: oldAutomation.config?.messageTemplate,
            messageBlocks: oldAutomation.config?.messageBlocks,
          }
        : {
            endpoint: oldAutomation.config?.endpoint,
            method: oldAutomation.config?.method,
            headers: oldAutomation.config?.headers,
            body: oldAutomation.config?.body,
          },
      is_active: oldAutomation.active,
      user_id: oldAutomation.user_id || userId,
      created_at: oldAutomation.createdAt,
      // For backwards compatibility
      type: oldAutomation.type,
      active: oldAutomation.active,
      config: oldAutomation.config,
      createdAt: oldAutomation.createdAt,
      logs: oldAutomation.logs,
    };
    console.log("[DEBUG] mapOldToNewFormat - Saída:", result);
    return result;
  } catch (error) {
    console.error("[DEBUG] mapOldToNewFormat - Erro ao obter userId:", error);
    // Fallback para um ID anônimo em caso de erro
    const result = {
      id: oldAutomation.id,
      name: oldAutomation.name,
      description: "",
      trigger_type: isWebhook ? "webhook" : ("call_api" as TriggerType),
      trigger_config: isWebhook
        ? {
            path: oldAutomation.config?.path,
            secret: oldAutomation.config?.secret,
          }
        : {},
      action_type: isWebhook ? "send_message" : ("call_api" as ActionType),
      action_config: isWebhook
        ? {
            instance: oldAutomation.config?.instance,
            messageTemplate: oldAutomation.config?.messageTemplate,
            messageBlocks: oldAutomation.config?.messageBlocks,
          }
        : {
            endpoint: oldAutomation.config?.endpoint,
            method: oldAutomation.config?.method,
            headers: oldAutomation.config?.headers,
            body: oldAutomation.config?.body,
          },
      is_active: oldAutomation.active,
      user_id: oldAutomation.user_id || "anonymous-user",
      created_at: oldAutomation.createdAt,
      // For backwards compatibility
      type: oldAutomation.type,
      active: oldAutomation.active,
      config: oldAutomation.config,
      createdAt: oldAutomation.createdAt,
      logs: oldAutomation.logs,
    };
    console.log("[DEBUG] mapOldToNewFormat - Saída (fallback):", result);
    return result;
  }
}

// Function to check if we should use Supabase or local storage
function shouldUseSupabase() {
  console.log("[DEBUG] shouldUseSupabase - Função chamada");
  try {
    console.log("[DEBUG] shouldUseSupabase - Tentando obter getSupabaseClient");
    getSupabaseClient();
    console.log("[DEBUG] shouldUseSupabase - Supabase disponível");
    return true;
  } catch (error: any) {
    console.warn(
      "[DEBUG] shouldUseSupabase - Usando fallback de armazenamento local:",
      error.message
    );
    return false;
  }
}

// Detailed logging function

// Get all automations for the current user
export async function getAllAutomations(): Promise<Automation[]> {
  console.log("[DEBUG] getAllAutomations - Função chamada");

  try {
    console.log("[DEBUG] getAllAutomations - Tentando obter getCurrentUserId");
    const userId = getCurrentUserId();
    console.log("[DEBUG] getAllAutomations - userId:", userId);

    // Se o usuário for anônimo e estivermos em desenvolvimento, podemos retornar todos
    const isAnonymous = (await userId) === "anonymous-user";
    const isDevelopment = process.env.NODE_ENV === "development";
    console.log("[DEBUG] getAllAutomations - isAnonymous:", isAnonymous);
    console.log("[DEBUG] getAllAutomations - isDevelopment:", isDevelopment);

    console.log(
      "[DEBUG] getAllAutomations - Verificando se deve usar Supabase"
    );
    if (shouldUseSupabase()) {
      console.log("[DEBUG] getAllAutomations - Usando Supabase");

      try {
        console.log(
          "[DEBUG] getAllAutomations - Tentando obter cliente Supabase"
        );
        const supabase = getSupabaseClient();
        console.log("[DEBUG] getAllAutomations - Cliente Supabase obtido");

        console.log("[DEBUG] getAllAutomations - Criando query");
        const query = supabase
          .from("automations")
          .select("*")
          .order("created_at", { ascending: false });

        // Apenas filtre por usuário se não for anônimo ou se não estivermos em desenvolvimento
        if (!(isAnonymous && isDevelopment)) {
          console.log(
            "[DEBUG] getAllAutomations - Adicionando filtro de usuário:",
            userId
          );
          query.eq("user_id", userId);
        }

        console.log("[DEBUG] getAllAutomations - Executando query");
        const { data, error } = await query;
        console.log("[DEBUG] getAllAutomations - Resultado da query:", {
          data: data?.length,
          error,
        });

        if (error) {
          console.error(
            "[DEBUG] getAllAutomations - Erro ao buscar automações:",
            error
          );
          return [];
        }

        console.log("[DEBUG] getAllAutomations - Mapeando dados do Supabase");
        const result = data.map(mapFromSupabase);
        console.log(
          "[DEBUG] getAllAutomations - Retornando",
          result.length,
          "automações"
        );
        return result;
      } catch (supabaseError) {
        console.error(
          "[DEBUG] getAllAutomations - Erro ao usar Supabase:",
          supabaseError
        );
        throw supabaseError;
      }
    } else {
      console.log("[DEBUG] getAllAutomations - Usando armazenamento local");

      try {
        console.log(
          "[DEBUG] getAllAutomations - Tentando obter automações do db"
        );
        const allAutomations = db.getAutomations();
        console.log(
          "[DEBUG] getAllAutomations - Automações obtidas:",
          allAutomations?.length
        );

        // Convert old format to new format and filter by user_id if needed
        console.log("[DEBUG] getAllAutomations - Mapeando para novo formato");
        const mappedAutomations = allAutomations.map(mapOldToNewFormat);
        console.log(
          "[DEBUG] getAllAutomations - Automações mapeadas:",
          mappedAutomations?.length
        );

        if (isAnonymous && isDevelopment) {
          console.log(
            "[DEBUG] getAllAutomations - Retornando todas as automações (modo dev)"
          );
          return mappedAutomations;
        }

        console.log(
          "[DEBUG] getAllAutomations - Filtrando por userId:",
          userId
        );
        const filteredAutomations = mappedAutomations.filter(
          async (auto) => auto.user_id === (await userId)
        );
        console.log(
          "[DEBUG] getAllAutomations - Automações filtradas:",
          filteredAutomations?.length
        );

        return filteredAutomations;
      } catch (dbError) {
        console.error(
          "[DEBUG] getAllAutomations - Erro ao usar armazenamento local:",
          dbError
        );
        throw dbError;
      }
    }
  } catch (error) {
    console.error("[DEBUG] getAllAutomations - Erro geral:", error);
    return [];
  }
}

// Resto do código permanece o mesmo...
