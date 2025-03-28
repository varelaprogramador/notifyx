/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Interface para um bloco de mensagem
export interface MessageBlock {
  id: string;
  content: string;
  delay: number;
}

// Interface para um script de mensagem
export interface MessageScript {
  id: string;
  name: string;
  description?: string;
  content: string; // Pode ser string simples ou representação JSON de blocos
  messageBlocks?: MessageBlock[]; // Campo virtual para uso na aplicação
  tags?: string[];
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

// Interface para criação de um script
export interface CreateMessageScriptData {
  name: string;
  description?: string;
  content: string;
  messageBlocks?: MessageBlock[];
  tags?: string[];
  userId: string;
}

// Interface para atualização de um script
export interface UpdateMessageScriptData {
  name?: string;
  description?: string;
  content?: string;
  messageBlocks?: MessageBlock[];
  tags?: string[];
  updatedAt?: string;
}

// Classe para gerenciar scripts de mensagem
class MessageScriptsService {
  private supabase: any | null = null;
  private localStorageKey = "message_scripts";

  constructor() {
    // Inicializar Supabase se as variáveis de ambiente estiverem disponíveis
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      this.supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }
  }

  // Obter todos os scripts
  async getAllScripts(): Promise<MessageScript[]> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from("message_scripts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Processar os scripts para extrair messageBlocks do content quando for JSON
        return (data || []).map(this.processScriptFromDatabase);
      } else {
        // Fallback para localStorage
        return this.getScriptsFromLocalStorage();
      }
    } catch (error) {
      console.error("Erro ao obter scripts:", error);
      return this.getScriptsFromLocalStorage();
    }
  }

  // Obter um script pelo ID
  async getScriptById(id: string): Promise<MessageScript | null> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from("message_scripts")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        return this.processScriptFromDatabase(data);
      } else {
        // Fallback para localStorage
        const scripts = this.getScriptsFromLocalStorage();
        return scripts.find((script) => script.id === id) || null;
      }
    } catch (error) {
      console.error(`Erro ao obter script ${id}:`, error);
      const scripts = this.getScriptsFromLocalStorage();
      return scripts.find((script) => script.id === id) || null;
    }
  }

  // Adicionar um novo script
  async addScript(scriptData: CreateMessageScriptData): Promise<MessageScript> {
    const now = new Date().toISOString();

    // Processar o conteúdo e blocos de mensagem
    const processedData = this.processScriptForDatabase(scriptData);

    const newScript: MessageScript = {
      id: crypto.randomUUID(),
      ...processedData,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (this.supabase) {
        // Converter camelCase para snake_case para o banco de dados
        const dbScript = this.mapScriptToDatabase(newScript);

        const { data, error } = await this.supabase
          .from("message_scripts")
          .insert([dbScript])
          .select();

        if (error) throw error;
        return this.processScriptFromDatabase(data[0]);
      } else {
        // Fallback para localStorage
        const scripts = this.getScriptsFromLocalStorage();
        scripts.unshift(newScript);
        this.saveScriptsToLocalStorage(scripts);
        return newScript;
      }
    } catch (error) {
      console.error("Erro ao adicionar script:", error);
      // Fallback para localStorage em caso de erro
      const scripts = this.getScriptsFromLocalStorage();
      scripts.unshift(newScript);
      this.saveScriptsToLocalStorage(scripts);
      return newScript;
    }
  }

  // Atualizar um script existente
  async updateScript(
    id: string,
    updateData: UpdateMessageScriptData
  ): Promise<MessageScript | null> {
    const now = new Date().toISOString();

    // Processar o conteúdo e blocos de mensagem para atualização
    const processedUpdateData = this.processUpdateDataForDatabase(updateData);

    const updatedData = {
      ...processedUpdateData,
      updatedAt: now,
    };

    try {
      if (this.supabase) {
        // Converter camelCase para snake_case para o banco de dados
        const dbUpdateData = this.mapUpdateDataToDatabase(updatedData);

        const { data, error } = await this.supabase
          .from("message_scripts")
          .update(dbUpdateData)
          .eq("id", id)
          .select();

        if (error) throw error;
        return this.processScriptFromDatabase(data[0]);
      } else {
        // Fallback para localStorage
        const scripts = this.getScriptsFromLocalStorage();
        const index = scripts.findIndex((script) => script.id === id);

        if (index !== -1) {
          scripts[index] = {
            ...scripts[index],
            ...updatedData,
          };
          this.saveScriptsToLocalStorage(scripts);
          return scripts[index];
        }
        return null;
      }
    } catch (error) {
      console.error(`Erro ao atualizar script ${id}:`, error);
      // Fallback para localStorage em caso de erro
      const scripts = this.getScriptsFromLocalStorage();
      const index = scripts.findIndex((script) => script.id === id);

      if (index !== -1) {
        scripts[index] = {
          ...scripts[index],
          ...updatedData,
        };
        this.saveScriptsToLocalStorage(scripts);
        return scripts[index];
      }
      return null;
    }
  }

  // Excluir um script
  async deleteScript(id: string): Promise<boolean> {
    try {
      if (this.supabase) {
        const { error } = await this.supabase
          .from("message_scripts")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return true;
      } else {
        // Fallback para localStorage
        const scripts = this.getScriptsFromLocalStorage();
        const filteredScripts = scripts.filter((script) => script.id !== id);
        this.saveScriptsToLocalStorage(filteredScripts);
        return true;
      }
    } catch (error) {
      console.error(`Erro ao excluir script ${id}:`, error);
      // Fallback para localStorage em caso de erro
      const scripts = this.getScriptsFromLocalStorage();
      const filteredScripts = scripts.filter((script) => script.id !== id);
      this.saveScriptsToLocalStorage(filteredScripts);
      return true;
    }
  }

  // Métodos auxiliares para localStorage
  private getScriptsFromLocalStorage(): MessageScript[] {
    if (typeof window === "undefined") return [];

    const storedScripts = localStorage.getItem(this.localStorageKey);
    return storedScripts ? JSON.parse(storedScripts) : [];
  }

  private saveScriptsToLocalStorage(scripts: MessageScript[]): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(this.localStorageKey, JSON.stringify(scripts));
  }

  // Processar script do banco de dados para extrair messageBlocks do content
  private processScriptFromDatabase(dbScript: any): MessageScript {
    if (!dbScript) return null as any;

    // Converter snake_case para camelCase
    const script: MessageScript = {
      id: dbScript.id,
      name: dbScript.name,
      description: dbScript.description,
      content: dbScript.content,
      tags: dbScript.tags,
      userId: dbScript.user_id,
      createdAt: dbScript.created_at,
      updatedAt: dbScript.updated_at,
    };

    // Tentar extrair messageBlocks do content se for JSON
    try {
      if (typeof dbScript.content === "string") {
        // Verificar se o conteúdo é um JSON válido
        const contentObj = JSON.parse(dbScript.content);

        // Verificar se o JSON contém um array de blocos
        if (
          Array.isArray(contentObj) &&
          contentObj.length > 0 &&
          contentObj[0].id &&
          contentObj[0].content !== undefined
        ) {
          script.messageBlocks = contentObj;
          // Manter o content original como string para compatibilidade
          script.content = contentObj[0].content;
        }
      }
    } catch (e) {
      // Se não for JSON, manter o content como está (string simples)
    }

    return script;
  }

  // Processar script para o banco de dados, convertendo messageBlocks para JSON no content
  private processScriptForDatabase(
    scriptData: CreateMessageScriptData | UpdateMessageScriptData
  ): any {
    const result: any = { ...scriptData };

    // Se tiver messageBlocks, armazenar como JSON no content
    if (scriptData.messageBlocks && scriptData.messageBlocks.length > 0) {
      result.content = JSON.stringify(scriptData.messageBlocks);
    } else if (scriptData.content) {
      // Manter o content como está (string simples)
      result.content = scriptData.content;
    }

    // Remover messageBlocks do resultado para não confundir
    delete result.messageBlocks;

    return result;
  }

  // Processar dados de atualização para o banco de dados
  private processUpdateDataForDatabase(
    updateData: UpdateMessageScriptData
  ): any {
    const result: any = { ...updateData };

    // Se tiver messageBlocks, armazenar como JSON no content
    if (updateData.messageBlocks !== undefined) {
      if (updateData.messageBlocks.length > 0) {
        result.content = JSON.stringify(updateData.messageBlocks);
      } else if (updateData.content === undefined) {
        // Se messageBlocks estiver vazio e não tiver content definido, usar string vazia
        result.content = "";
      }
      // Remover messageBlocks do resultado
      delete result.messageBlocks;
    }

    return result;
  }

  // Mapear script para formato do banco de dados (snake_case)
  private mapScriptToDatabase(script: MessageScript): any {
    return {
      id: script.id,
      name: script.name,
      description: script.description,
      content: script.content,
      tags: script.tags,
      user_id: script.userId,
      created_at: script.createdAt,
      updated_at: script.updatedAt,
    };
  }

  // Mapear dados de atualização para formato do banco de dados (snake_case)
  private mapUpdateDataToDatabase(updateData: any): any {
    const dbUpdateData: any = {};

    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.description !== undefined)
      dbUpdateData.description = updateData.description;
    if (updateData.content !== undefined)
      dbUpdateData.content = updateData.content;
    if (updateData.tags !== undefined) dbUpdateData.tags = updateData.tags;
    if (updateData.updatedAt !== undefined)
      dbUpdateData.updated_at = updateData.updatedAt;

    return dbUpdateData;
  }
}

// Exportar uma instância única do serviço
export const messageScriptsService = new MessageScriptsService();
