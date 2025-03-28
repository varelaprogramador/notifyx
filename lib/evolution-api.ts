/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { EVOLUTION_API_KEY, EVOLUTION_API_URL } from "./config";
import type { ApiResponse, Instance, Contact } from "./types";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { isArray } from "util";
import { randomUUID } from "crypto";

/**
 * Classe para interagir com a Evolution API
 */
export class EvolutionApiService {
  private baseUrl: string;
  private apiKey: string;
  private successfulFormats: Map<string, any> = new Map(); // Cache para formatos bem-sucedidos

  constructor() {
    this.baseUrl = EVOLUTION_API_URL;
    this.apiKey = EVOLUTION_API_KEY;
  }

  /**
   * Cabeçalhos padrão para requisições à API
   */
  private get headers() {
    return {
      "Content-Type": "application/json",
      apikey: this.apiKey,
    };
  }

  /**
   * Limpa o cache para uma chave específica
   */
  public clearCache(cacheKey: string) {
    if (this.successfulFormats.has(cacheKey)) {
      this.successfulFormats.delete(cacheKey);
      console.log(`Cache limpo para a chave: ${cacheKey}`);
    }
  }

  /**
   * Função utilitária para fazer requisições à API
   */
  private async fetchAPI<T>(
    endpoint: string,
    method = "GET",
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Log reduzido - apenas para endpoints importantes
      if (
        endpoint.includes("/message/") ||
        endpoint.includes("/instance/create")
      ) {
        console.log(`API Request: ${method} ${endpoint}`);
      }

      const options: RequestInit = {
        method,
        headers: { ...this.headers, ...customHeaders },
        cache: "no-store",
      };

      if (body) {
        options.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const responseText = await response.text();

      // Log apenas em caso de erro ou para endpoints críticos
      if (!response.ok) {
        console.log(`Erro ${response.status}: ${endpoint}`);
        console.log(
          `Resposta: ${responseText.substring(0, 200)}${
            responseText.length > 200 ? "..." : ""
          }`
        );
      }

      if (!response.ok) {
        let errorMessage = `Erro HTTP: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          if (responseText) {
            errorMessage += ` - ${responseText.substring(0, 100)}`;
          }
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      try {
        const data = responseText ? JSON.parse(responseText) : {};
        return {
          success: true,
          data: data as T,
        };
      } catch (parseError) {
        console.error("Erro ao analisar resposta JSON");
        return {
          success: false,
          error: `Erro ao processar resposta da API`,
        };
      }
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}`);
      return {
        success: false,
        error: `Erro ao conectar com a API Evolution`,
      };
    }
  }

  /**
   * Tenta múltiplas requisições até que uma seja bem-sucedida
   * Agora com cache para formatos bem-sucedidos, mas sem armazenar o conteúdo da mensagem
   */
  private async tryMultipleRequests<T>(
    attempts: Array<{
      url: string;
      method: string;
      body?: any;
      getBody?: () => any;
    }>,
    cacheKey?: string
  ): Promise<ApiResponse<T>> {
    // Verificar se já temos um formato bem-sucedido em cache
    if (cacheKey && this.successfulFormats.has(cacheKey)) {
      const cachedFormat = this.successfulFormats.get(cacheKey);
      const endpoint = cachedFormat.url.replace(this.baseUrl, "");

      try {
        // Usar o corpo fornecido ou o gerador de corpo, não o corpo em cache
        const body = cachedFormat.getBody
          ? cachedFormat.getBody()
          : attempts[0].body;

        const response = await this.fetchAPI<T>(
          endpoint,
          cachedFormat.method,
          body
        );

        if (response.success) {
          return response;
        }
      } catch (error) {
        // Se falhar, remover do cache e continuar com as tentativas
        this.successfulFormats.delete(cacheKey);
      }
    }

    // Tentar cada formato
    for (const attempt of attempts) {
      try {
        const endpoint = attempt.url.replace(this.baseUrl, "");
        const body = attempt.getBody ? attempt.getBody() : attempt.body;
        const response = await this.fetchAPI<T>(endpoint, attempt.method, body);

        if (response.success) {
          // Armazenar o formato bem-sucedido em cache, mas sem o corpo específico
          if (cacheKey) {
            this.successfulFormats.set(cacheKey, {
              url: attempt.url,
              method: attempt.method,
              getBody: attempt.getBody, // Armazenar o gerador de corpo, não o corpo em si
            });
          }
          return response;
        }
      } catch (error) {
        // Continuar para a próxima tentativa
      }
    }

    return {
      success: false,
      error: "Todas as tentativas falharam",
    };
  }

  /**
   * Cria uma nova instância do WhatsApp
   */
  async createInstance(
    instanceName: string,
    number?: string
  ): Promise<ApiResponse<Instance>> {
    const uuid = randomUUID();
    const requestBody = {
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      number: number || "",
      token: uuid,
    };

    const response = await this.fetchAPI<any>(
      "/instance/create",
      "POST",
      requestBody
    );

    if (response.success) {
      // Criar a instância no Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        const { userId } = await auth();
        // Inserir a nova instância no banco de dados Supabase
        const { data, error } = await supabase.from("instances").insert([
          {
            instance_name: instanceName,
            user_id: userId, // Altere isso para pegar o ID real do usuário autenticado
            number: number || "",
            token: uuid, // Se necessário, adicione o token ou qualquer outra informação relevante
            status: "disconnected", // Status inicial
          },
        ]);

        if (error) throw new Error(error.message);

        // Retornar a resposta com as informações da instância
        return {
          success: true,
          data: {
            instanceName,
            instanceId: response.data?.instanceId || instanceName,
            status: "disconnected",
            owner: userId || "unknown", // Altere isso conforme necessário
            createdAt: new Date().toISOString(),
            type: "whatsapp",
          },
        };
      } catch (error) {
        console.error("Erro ao inserir instância no Supabase:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao inserir instância no banco.",
        };
      }
    }

    return response;
  }

  /**
   * Obtém o QR Code para uma instância
   */
  async getQrCode(
    instanceName: string
  ): Promise<
    ApiResponse<{ qrcode?: string; pairingCode?: string; base64?: string }>
  > {
    return await this.fetchAPI<{
      qrcode?: string;
      pairingCode?: string;
      base64?: string;
    }>(`/instance/connect/${instanceName}`, "GET");
  }

  /**
   * Método alternativo para obter QR Code
   */
  async getQrCodeAlternative(
    instanceName: string
  ): Promise<ApiResponse<{ qrcode: string }>> {
    const attempts = [
      {
        url: `/instance/qrcode/${instanceName}`,
        method: "GET",
      },
      {
        url: `/instance/qr-code?instanceName=${instanceName}`,
        method: "GET",
      },
      {
        url: `/instance/qr-code/${instanceName}`,
        method: "GET",
      },
      {
        url: `/instance/qrcode`,
        method: "POST",
        body: { instanceName },
      },
      {
        url: `/instance/qr-code`,
        method: "POST",
        body: { instanceName },
      },
      {
        url: `/instance/getQrcode?instanceName=${instanceName}`,
        method: "GET",
      },
    ];

    const response = await this.tryMultipleRequests<any>(
      attempts,
      `qrcode-${instanceName}`
    );

    if (response.success && response.data) {
      // Verificar diferentes formatos possíveis de resposta
      const data = response.data;
      const qrcode =
        data.qrcode ||
        (data.data && data.data.qrcode) ||
        data.base64Image ||
        data.image;

      if (qrcode) {
        return {
          success: true,
          data: { qrcode },
        };
      }
    }

    return {
      success: false,
      error: "Não foi possível obter o QR Code após múltiplas tentativas",
    };
  }

  /**
   * Lista todas as instâncias
   */

  /**
   * Método alternativo para listar instâncias
   */
  async listInstances(): Promise<ApiResponse<Instance[]>> {
    const response = await this.fetchAPI<any>("/instance/fetchInstances");
    const { userId } = await auth();

    if (response.success && response.data) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Query the 'instances' table in Supabase to get instance names for the current user
      try {
        const { data: supabaseInstances, error } = await supabase
          .from("instances")
          .select("instance_name")
          .eq("user_id", userId);

        if (error) throw new Error(error.message);

        let instances: Instance[] = [];
        const data = response.data;

        if (Array.isArray(data)) {
          instances = data.map((item) => {
            const instanceName =
              item.instanceName || item.name || "Desconhecido";
            const instanceId = item?.token || instanceName;
            const connectionStatus =
              item.connectionStatus || item.status || "disconnected";

            return {
              instanceName,
              instanceId,
              status:
                connectionStatus === "open" ? "connected" : "disconnected",
              owner: "current-user",
              createdAt: new Date().toISOString(),
              type: "whatsapp",
            };
          });
        } else if (data.instances) {
          instances = Object.keys(data.instances).map((key) => {
            const connectionStatus =
              data.instances[key].connectionStatus ||
              data.instances[key].status ||
              "disconnected";
            return {
              instanceName: key,
              instanceId: key,
              status:
                connectionStatus === "open" ? "connected" : "disconnected",
              owner: "current-user",
              createdAt: new Date().toISOString(),
              type: "whatsapp",
            };
          });
        }

        // Handle merging Supabase instances
        if (Array.isArray(supabaseInstances)) {
          // Get an array of instance names from Supabase
          const supabaseInstanceNames = supabaseInstances
            .map((instancia) => instancia.instance_name)
            .filter((instanceName) => instanceName);

          // Filter instances based on whether they exist in the Supabase list
          instances = instances.filter((instance) =>
            supabaseInstanceNames.includes(instance.instanceName)
          );
        }

        console.log("Instâncias encontradas:", instances);

        return {
          success: true,
          data: instances,
        };
      } catch (error) {
        console.error("Error fetching instances from Supabase:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error fetching instances.",
        };
      }
    }

    return response;
  }

  async listContacts(instanceName: string): Promise<ApiResponse<Contact[]>> {
    const requestBody = {
      where: {}, // Sem filtro específico para trazer todos os contatos
    };

    const response = await this.fetchAPI<any>(
      `/chat/findContacts/${instanceName}`,
      "POST",
      requestBody
    );

    if (response.success && response.data) {
      const data = response.data;
      let contacts: Contact[] = [];

      // Função para mapear contatos de diferentes formatos
      const mapContact = (item: any): Contact => ({
        id: item.id || item.contactId || item.jid || "",
        name: item.name || item.pushName || item.number || "Contato sem nome",
        number:
          item.remoteJid?.split("@")[0] ||
          item.id?.split("@")[0] ||
          item.number ||
          "",
        isGroup:
          item.isGroup || (item.id && item.id.includes("@g.us")) || false,
        image: item.profilePicture || item.profilePictureUrl || "",
        members: item.participants?.length || 0,
      });

      // Map contacts if data is an array
      if (Array.isArray(data)) {
        contacts = data.map(mapContact);
      } else if (data.contacts && Array.isArray(data.contacts)) {
        contacts = data.contacts.map(mapContact);
      } else {
        // Try to extract from any array in the data
        const possibleArrays = Object.entries(data).filter(([_, value]) =>
          Array.isArray(value)
        );
        if (possibleArrays.length > 0) {
          const [_, array] = possibleArrays[0];
          if (Array.isArray(array)) {
            contacts = array.map(mapContact);
          } else {
            console.error("Expected 'array' to be an array, but got:", array);
          }
        }
      }

      return {
        success: true,
        data: contacts,
      };
    }

    return response;
  }

  /**
   * Desconecta uma instância
   */
  async disconnectInstance(instanceName: string): Promise<ApiResponse<null>> {
    return await this.fetchAPI<null>(
      `/instance/logout?instanceName=${instanceName}`,
      "DELETE"
    );
  }

  /**
   * Deleta uma instância
   */
  async deleteInstance(instanceId: string): Promise<ApiResponse<null>> {
    const cleanId = instanceId.trim();

    const attempts = [
      {
        url: `/instance/delete/${cleanId}`,
        method: "DELETE",
      },
      {
        url: `/instance/delete?instanceName=${cleanId}`,
        method: "DELETE",
      },
      {
        url: `/instance/delete`,
        method: "DELETE",
        body: { instanceId: cleanId },
      },
      {
        url: `/instance/delete`,
        method: "DELETE",
        body: { instanceName: cleanId },
      },
    ];

    const response = await this.tryMultipleRequests<null>(
      attempts,
      `delete-${cleanId}`
    );

    if (response.success) {
      return {
        success: true,
        message: "Instância deletada com sucesso",
      };
    }

    return response;
  }

  /**
   * Verifica a documentação da API
   */
  async checkApiDocumentation(): Promise<ApiResponse<{ endpoints: string[] }>> {
    const endpoints = ["/docs", "/api-docs", "/swagger", "/openapi.json", "/"];
    const discoveredEndpoints: string[] = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "GET",
          headers: {
            Accept: "application/json, text/html, */*",
          },
          cache: "no-store",
        });

        if (response.ok) {
          discoveredEndpoints.push(endpoint);
        }
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    }

    return {
      success: discoveredEndpoints.length > 0,
      data: {
        endpoints: discoveredEndpoints,
      },
    };
  }

  /**
   * Verifica a versão da API
   */
  async checkApiVersion(): Promise<ApiResponse<{ version: string }>> {
    const endpoints = ["/api/version", "/version", "/api/v1/version", "/info"];

    for (const endpoint of endpoints) {
      const response = await this.fetchAPI<any>(endpoint);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            version:
              response.data.version ||
              response.data.apiVersion ||
              JSON.stringify(response.data),
          },
        };
      }
    }

    return {
      success: false,
      error: "Não foi possível determinar a versão da API",
    };
  }

  /**
   * Envia uma mensagem de texto para um contato ou grupo
   */
  async sendTextMessage(
    instanceName: string,
    to: string,
    message: string
  ): Promise<ApiResponse<{ messageId: string }>> {
    // Garantir que o número esteja no formato correto (sem o @s.whatsapp.net)
    const cleanNumber = to.includes("@") ? to.split("@")[0] : to;
    console.log(
      `[API] Enviando mensagem para ${cleanNumber}: "${message.substring(
        0,
        100
      )}${message.length > 100 ? "..." : ""}"`
    );

    // Criar função para gerar o corpo da requisição (para uso com cache)
    const createBodyFormat1 = () => ({
      number: cleanNumber,
      options: {
        delay: 1200,
        presence: "composing",
        linkPreview: true,
      },
      textMessage: {
        text: message,
      },
    });

    const createBodyFormat2 = () => ({
      number: cleanNumber,
      text: message,
    });

    const createBodyFormat3 = () => ({
      to: cleanNumber,
      text: message,
    });

    // Tentar diferentes formatos de corpo da requisição
    const attempts = [
      // Formato 1: Formato original
      {
        url: `/message/sendText/${instanceName}`,
        method: "POST",
        getBody: createBodyFormat1,
      },
      // Formato 2: Formato simplificado
      {
        url: `/message/sendText/${instanceName}`,
        method: "POST",
        getBody: createBodyFormat2,
      },
      // Formato 3: Outro endpoint possível
      {
        url: `/message/text/${instanceName}`,
        method: "POST",
        getBody: createBodyFormat2,
      },
      // Formato 4: Outro formato possível
      {
        url: `/message/sendText/${instanceName}`,
        method: "POST",
        getBody: createBodyFormat3,
      },
    ];

    const cacheKey = `sendText-${instanceName}`;
    const response = await this.tryMultipleRequests<any>(attempts, cacheKey);

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          messageId:
            response.data.key?.id || response.data.messageId || "unknown",
        },
      };
    }

    return response;
  }
}

// Exporta uma instância única do serviço
export const evolutionApi = new EvolutionApiService();
