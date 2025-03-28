"use server";

import { createClient } from "@supabase/supabase-js";
import { getCurrentUserId } from "@/lib/current-user";
import { logger } from "@/lib/logger";
import type { Automation } from "@/lib/automations-service";
import { revalidatePath } from "next/cache";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Create clients with different auth levels
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getAllAutomations(): Promise<Automation[]> {
  try {
    logger.info("Server Action: Getting all automations");
    const userId = await getCurrentUserId();

    let query = supabase
      .from("automations")
      .select("*")
      .order("created_at", { ascending: false });

    // In production, filter by user ID
    if (process.env.NODE_ENV !== "development" && userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error("Error in getAllAutomations server action:", error);
    throw error;
  }
}

export async function getAutomationById(
  id: string
): Promise<Automation | undefined> {
  try {
    logger.info(`Server Action: Getting automation by ID: ${id}`);
    const userId = await getCurrentUserId();

    let query = supabase.from("automations").select("*").eq("id", id);

    // In production, ensure the automation belongs to the user
    if (process.env.NODE_ENV !== "development" && userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found
        return undefined;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error(
      `Error in getAutomationById server action for ID ${id}:`,
      error
    );
    return undefined;
  }
}

export async function addAutomation(
  automation: Omit<Automation, "id" | "created_at" | "updated_at">
): Promise<Automation> {
  try {
    logger.info("Server Action: Adding new automation", {
      name: automation.name,
    });
    const userId = await getCurrentUserId();

    // Add user ID to the automation
    const newAutomation = {
      ...automation,
      user_id: userId || "anonymous",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("automations")
      .insert(newAutomation)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate the automations page to reflect the changes
    revalidatePath("/automations");

    return data;
  } catch (error) {
    logger.error("Error in addAutomation server action:", error);
    throw error;
  }
}

export async function updateAutomation(
  id: string,
  updates: Partial<Automation>
): Promise<Automation | undefined> {
  try {
    logger.info(`Server Action: Updating automation: ${id}`);
    const userId = await getCurrentUserId();

    // First, check if the automation exists and belongs to the user
    const { data: existingAutomation, error: fetchError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Record not found
        return undefined;
      }
      throw fetchError;
    }

    // Check if the automation belongs to the user
    if (
      process.env.NODE_ENV !== "development" &&
      userId &&
      existingAutomation.user_id !== userId
    ) {
      return undefined;
    }

    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("automations")
      .update(updatedData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate the automations page to reflect the changes
    revalidatePath("/automations");
    revalidatePath(`/automations/${id}`);

    return data;
  } catch (error) {
    logger.error(
      `Error in updateAutomation server action for ID ${id}:`,
      error
    );
    return undefined;
  }
}

export async function deleteAutomation(id: string): Promise<boolean> {
  try {
    logger.info(`Server Action: Deleting automation: ${id}`);
    const userId = await getCurrentUserId();

    // First, check if the automation exists and belongs to the user
    const { data: existingAutomation, error: fetchError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Record not found
        return false;
      }
      throw fetchError;
    }

    // Check if the automation belongs to the user
    if (
      process.env.NODE_ENV !== "development" &&
      userId &&
      existingAutomation.user_id !== userId
    ) {
      return false;
    }

    const { error } = await supabase.from("automations").delete().eq("id", id);

    if (error) {
      throw error;
    }

    // Revalidate the automations page to reflect the changes
    revalidatePath("/automations");

    return true;
  } catch (error) {
    logger.error(
      `Error in deleteAutomation server action for ID ${id}:`,
      error
    );
    return false;
  }
}

export async function getAutomationByPath(
  path: string
): Promise<Automation | undefined> {
  try {
    logger.info(`Server Action: Getting automation by path: ${path}`);

    // This is more complex because we need to check both old and new formats
    // First, try to find by trigger_config.path
    const { data: newFormatData, error: newFormatError } = await supabase
      .from("automations")
      .select("*")
      .eq("trigger_type", "webhook")
      .contains("trigger_config", { path });

    if (newFormatError) {
      throw newFormatError;
    }

    if (newFormatData && newFormatData.length > 0) {
      return newFormatData[0];
    }

    // If not found, try to find by config.path (old format)
    const { data: oldFormatData, error: oldFormatError } = await supabase
      .from("automations")
      .select("*")
      .eq("type", "webhook")
      .contains("config", { path });

    if (oldFormatError) {
      throw oldFormatError;
    }

    if (oldFormatData && oldFormatData.length > 0) {
      return oldFormatData[0];
    }

    return undefined;
  } catch (error) {
    logger.error(
      `Error in getAutomationByPath server action for path ${path}:`,
      error
    );
    return undefined;
  }
}

export async function executeWebhookAutomation(
  automation: Automation,
  payload: Record<string, any>
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    logger.info(
      `Server Action: Executing webhook automation: ${automation.id}`,
      {
        name: automation.name,
        payload:
          JSON.stringify(payload).substring(0, 100) +
          (JSON.stringify(payload).length > 100 ? "..." : ""),
      }
    );

    // Log the execution
    await supabase.from("automation_logs").insert({
      automation_id: automation.id,
      event_type: "webhook_execution",
      payload: payload,
      status: "success",
      created_at: new Date().toISOString(),
    });

    // Implementation would depend on your specific requirements
    // This is a placeholder that simulates success
    return {
      success: true,
      message: "Webhook executed successfully",
      details: {
        automationId: automation.id,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error(
      `Error in executeWebhookAutomation server action for ID ${automation.id}:`,
      error
    );

    // Log the error
    try {
      await supabase.from("automation_logs").insert({
        automation_id: automation.id,
        event_type: "webhook_execution",
        payload: payload,
        status: "error",
        error_message: error instanceof Error ? error.message : String(error),
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      logger.error("Failed to log automation error:", logError);
    }

    return {
      success: false,
      message: `Error executing webhook: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function getLogsForAutomation(
  automationId: string
): Promise<any[]> {
  try {
    logger.info(`Server Action: Getting logs for automation: ${automationId}`);

    const { data, error } = await supabase
      .from("automation_logs")
      .select("*")
      .eq("automation_id", automationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error(
      `Error in getLogsForAutomation server action for ID ${automationId}:`,
      error
    );
    return [];
  }
}

export async function clearLogsForAutomation(
  automationId: string
): Promise<boolean> {
  try {
    logger.info(`Server Action: Clearing logs for automation: ${automationId}`);

    const { error } = await supabase
      .from("automation_logs")
      .delete()
      .eq("automation_id", automationId);

    if (error) {
      throw error;
    }

    // Revalidate the automation logs page to reflect the changes
    revalidatePath(`/automations/${automationId}/logs`);

    return true;
  } catch (error) {
    logger.error(
      `Error in clearLogsForAutomation server action for ID ${automationId}:`,
      error
    );
    return false;
  }
}

export async function addLogToAutomation(
  automationId: string,
  log: {
    status: "success" | "error";
    message: string;
    payload?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    logger.info(`Server Action: Adding log to automation: ${automationId}`, {
      status: log.status,
      message: log.message?.substring(0, 100),
    });

    // Verificar se o automationId é válido
    if (!automationId || typeof automationId !== "string") {
      throw new Error(`Invalid automationId: ${automationId}`);
    }

    // Verificar se a automação existe antes de adicionar o log
    const { data: existingAutomation, error: fetchError } = await supabase
      .from("automations")
      .select("id")
      .eq("id", automationId)
      .single();

    if (fetchError) {
      throw new Error(`Automation not found: ${fetchError.message}`);
    }

    // Preparar os dados do log com tratamento para valores nulos/undefined
    const logData = {
      automation_id: automationId,
      event_type: "custom_log",
      status: log.status || "error",
      message: log.message || "No message provided",
      payload: log.payload || {},
      created_at: new Date().toISOString(),
    };

    // Inserir o log com tratamento de erro detalhado
    const { error } = await supabase.from("automation_logs").insert(logData);

    if (error) {
      logger.error(`Error inserting log: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    // Revalidar a página de logs
    revalidatePath(`/automations/${automationId}/logs`);

    return true;
  } catch (error) {
    // Log detalhado do erro
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      `Error in addLogToAutomation server action for ID ${automationId}:`,
      {
        message: errorMessage,
        stack: errorStack,
        automationId,
        logStatus: log.status,
        logMessage: log.message,
      }
    );

    // Tentar registrar o erro em um log de sistema separado
    try {
      await supabase.from("system_logs").insert({
        component: "automation_logger",
        level: "error",
        message: `Failed to add log to automation ${automationId}: ${errorMessage}`,
        details: {
          automationId,
          error: errorMessage,
          stack: errorStack,
          originalLog: log,
        },
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to log system error:", logError);
    }

    return false;
  }
}
