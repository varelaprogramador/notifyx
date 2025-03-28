/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { evolutionApi } from "@/lib/evolution-api";
import type { ApiResponse, Instance, Contact } from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Cria uma nova instância do WhatsApp
 */
export async function createInstance(
  formData: FormData
): Promise<ApiResponse<Instance>> {
  const instanceName = formData.get("instanceName") as string;
  const number = formData.get("number") as string;

  if (!instanceName || instanceName.trim() === "") {
    return {
      success: false,
      error: "Nome da instância é obrigatório",
    };
  }

  try {
    // Tenta o método padrão primeiro
    const result = await evolutionApi.createInstance(instanceName, number);

    // Se falhar, tenta o método alternativo
    if (!result.success) {
      return {
        success: false,
        error: "Método alternativo para criar instância não está disponível",
      };
    }

    if (result.success) {
      revalidatePath("/settings");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: "Erro ao criar instância",
    };
  }
}

/**
 * Obtém o QR Code para uma instância
 */
export async function getInstanceQrCode(
  instanceName: string
): Promise<
  ApiResponse<{ qrcode?: string; pairingCode?: string; base64?: string }>
> {
  try {
    const result = await evolutionApi.getQrCode(instanceName);

    if (!result.success) {
      return await evolutionApi.getQrCodeAlternative(instanceName);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: "Erro ao obter QR Code",
    };
  }
}

/**
 * Lista todas as instâncias
 */
export async function listInstances(): Promise<ApiResponse<Instance[]>> {
  try {
    const result = await evolutionApi.listInstances();

    return result;
  } catch (error) {
    return {
      success: false,
      error: "Erro ao listar instâncias",
    };
  }
}

/**
 * Desconecta uma instância
 */
export async function disconnectInstance(
  instanceName: string
): Promise<ApiResponse<null>> {
  const result = await evolutionApi.disconnectInstance(instanceName);

  if (result.success) {
    revalidatePath("/settings");
  }

  return result;
}

/**
 * Deleta uma instância
 */
export async function deleteInstance(
  instanceId: string
): Promise<ApiResponse<null>> {
  const result = await evolutionApi.deleteInstance(instanceId);

  if (result.success) {
    revalidatePath("/settings");
  }

  return result;
}

/**
 * Lista todos os contatos e grupos de uma instância
 */
export async function listContacts(
  instanceName: string
): Promise<ApiResponse<Contact[]>> {
  try {
    const result = await evolutionApi.listContacts(instanceName);

    return result;
  } catch (error) {
    return {
      success: true,
      data: [],
    };
  }
}

/**
 * Envia uma mensagem de texto
 */
export async function sendTextMessage(
  instanceName: string,
  to: string,
  message: string
): Promise<ApiResponse<{ messageId: string }>> {
  try {
    // Garantir que o número esteja no formato correto (sem o @s.whatsapp.net)
    const cleanNumber = to.includes("@") ? to.split("@")[0] : to;
    console.log(
      `[Server Action] Enviando mensagem para ${cleanNumber}: "${message.substring(
        0,
        100
      )}${message.length > 100 ? "..." : ""}"`
    );

    const response = await evolutionApi.sendTextMessage(
      instanceName,
      cleanNumber,
      message
    );

    // Limpar o cache após o envio bem-sucedido
    if (response.success) {
      evolutionApi.clearCache(`sendText-${instanceName}`);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: "Erro ao enviar mensagem",
    };
  }
}

/**
 * Envia mensagens em massa para múltiplos destinatários
 */
export async function sendBulkMessages(
  instanceName: string,
  recipients: string[],
  message: string
): Promise<ApiResponse<{ successful: number; failed: number }>> {
  try {
    // Limpar os números (remover @s.whatsapp.net se presente)
    const cleanRecipients = recipients.map((number) =>
      number.includes("@") ? number.split("@")[0] : number
    );

    // Enviar mensagens em paralelo com limite de concorrência
    const results = await sendMessagesWithRateLimit(
      instanceName,
      cleanRecipients,
      message
    );

    // Contar sucessos e falhas
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    return {
      success: successful > 0,
      data: { successful, failed },
      message: `Enviado com sucesso para ${successful} de ${results.length} destinatários`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Erro ao enviar mensagens em massa",
    };
  }
}

/**
 * Função auxiliar para enviar mensagens com limite de taxa
 * para evitar sobrecarga da API
 */
async function sendMessagesWithRateLimit(
  instanceName: string,
  recipients: string[],
  message: string,
  concurrencyLimit = 5,
  delayMs = 1000
): Promise<ApiResponse<any>[]> {
  const results: ApiResponse<any>[] = [];

  // Processar em lotes para controlar a concorrência
  for (let i = 0; i < recipients.length; i += concurrencyLimit) {
    const batch = recipients.slice(i, i + concurrencyLimit);

    // Enviar lote em paralelo
    const batchPromises = batch.map((recipient) =>
      evolutionApi.sendTextMessage(instanceName, recipient, message)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Aguardar antes do próximo lote para evitar sobrecarga
    if (i + concurrencyLimit < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Modificar a função sendBulkMessages para suportar callbacks de progresso
// Adicione esta função após a função sendBulkMessages existente

/**
 * Envia mensagens em massa para múltiplos destinatários com atualizações de progresso
 * Esta versão é usada pelo cliente para acompanhar o progresso em tempo real
 */
export async function sendBulkMessagesWithProgress(
  instanceName: string,
  recipients: { id: string; number: string; name: string }[],
  message: string
): Promise<
  ApiResponse<{
    successful: number;
    failed: number;
    logs: Array<{ recipient: string; success: boolean; message: string }>;
  }>
> {
  try {
    // Limpar os números (remover @s.whatsapp.net se presente)
    const cleanRecipients = recipients.map((recipient) => ({
      ...recipient,
      number: recipient.number.includes("@")
        ? recipient.number.split("@")[0]
        : recipient.number,
    }));

    const logs: Array<{
      recipient: string;
      success: boolean;
      message: string;
    }> = [];
    let successful = 0;
    let failed = 0;

    // Processar cada destinatário sequencialmente para melhor controle
    for (let i = 0; i < cleanRecipients.length; i++) {
      const recipient = cleanRecipients[i];
      try {
        // Enviar mensagem para o destinatário atual
        const result = await evolutionApi.sendTextMessage(
          instanceName,
          recipient.number,
          message
        );

        if (result.success) {
          successful++;
          logs.push({
            recipient: recipient.name,
            success: true,
            message: `Mensagem enviada com sucesso para ${recipient.name}`,
          });
        } else {
          failed++;
          logs.push({
            recipient: recipient.name,
            success: false,
            message: `Falha ao enviar para ${recipient.name}: ${
              result.error || "Erro desconhecido"
            }`,
          });
        }

        // Aguardar um pequeno intervalo para evitar sobrecarga da API
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        logs.push({
          recipient: recipient.name,
          success: false,
          message: `Erro ao enviar para ${recipient.name}: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
        });
      }
    }

    return {
      success: successful > 0,
      data: { successful, failed, logs },
      message: `Enviado com sucesso para ${successful} de ${cleanRecipients.length} destinatários`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Erro ao enviar mensagens em massa",
      data: { successful: 0, failed: 0, logs: [] },
    };
  }
}
