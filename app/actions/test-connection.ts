"use server";

import { EVOLUTION_API_KEY, EVOLUTION_API_URL } from "@/lib/config";
import { evolutionApi } from "@/lib/evolution-api";

export async function testApiConnection() {
  try {
    console.log("Testando conexão com a API Evolution...");
    console.log(`URL: ${EVOLUTION_API_URL}`);
    console.log(`API Key: ${EVOLUTION_API_KEY.substring(0, 4)}...`);

    // Tentar fazer uma requisição simples
    const response = await fetch(`${EVOLUTION_API_URL}/instance/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      cache: "no-store",
    });

    const status = response.status;
    const text = await response.text();

    console.log(`Status da resposta: ${status}`);
    console.log(`Corpo da resposta: ${text}`);

    return {
      success: response.ok,
      status,
      body: text,
      error: response.ok ? null : `Erro HTTP: ${status}`,
    };
  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    return {
      success: false,
      error: `Exceção: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`,
    };
  }
}

export async function checkApiDocumentation() {
  return await evolutionApi.checkApiDocumentation();
}

export async function checkApiVersion() {
  return await evolutionApi.checkApiVersion();
}
