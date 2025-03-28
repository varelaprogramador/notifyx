/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Automation } from "./automations-service";
import type { WebhookLog } from "./database.types";
import type { MessageScript } from "./message-scripts-service";

// Armazenamento em memória para o servidor
const serverStore: Record<string, any> = {
  automations: [],
  messageScripts: [], // Adicione esta linha
};

// Função para inicializar o banco de dados com dados padrão
export function initializeDB() {
  // Verificar se já existem automações
  if (serverStore.automations.length === 0) {
    // Adicionar automação de exemplo
    serverStore.automations = [
      {
        id: "1",
        name: "Notificação de Pedido",
        type: "webhook",
        active: true,
        createdAt: new Date().toISOString(),
        logs: [],
        config: {
          path: "pedido",
          instance: "bruno",
          messageTemplate:
            "Olá {{nome}}, recebemos seu pedido #{{pedido_id}} no valor de {{valor}}. Obrigado pela preferência!",
        },
      },
    ];
  }
}

// Inicializar o banco de dados
initializeDB();

// API para o banco de dados
export const db = {
  // Automações
  getAutomations: (): Automation[] => {
    // No cliente, tenta buscar do localStorage primeiro
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("notifyx_automations");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Atualizar o armazenamento do servidor com os dados do cliente
          serverStore.automations = parsed;
          return parsed;
        }
      } catch (error) {
        console.error("Erro ao ler do localStorage:", error);
      }
    }

    // Retorna do armazenamento do servidor
    return [...serverStore.automations];
  },

  saveAutomations: (automations: Automation[]): void => {
    // Atualizar o armazenamento do servidor
    serverStore.automations = [...automations];

    // No cliente, salvar também no localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "notifyx_automations",
          JSON.stringify(automations)
        );
      } catch (error) {
        console.error("Erro ao salvar no localStorage:", error);
      }
    }
  },

  getAutomationByPath: (path: string): Automation | undefined => {
    const automations = db.getAutomations();
    return automations.find(
      (automation) =>
        automation.type === "webhook" &&
        (automation as any).config.path === path &&
        automation.active
    );
  },

  addAutomation: (automation: Automation): Automation => {
    // Garantir que a automação tenha um array de logs vazio
    const automationWithLogs = {
      ...automation,
      logs: automation.logs || [],
    };

    const automations = db.getAutomations();
    const newAutomations = [...automations, automationWithLogs];
    db.saveAutomations(newAutomations);
    return automationWithLogs;
  },

  updateAutomation: (
    id: string,
    data: Partial<Automation>
  ): Automation | undefined => {
    const automations = db.getAutomations();
    const index = automations.findIndex((a) => a.id === id);

    if (index === -1) return undefined;

    const updatedAutomation = { ...automations[index], ...data };
    automations[index] = updatedAutomation;
    db.saveAutomations(automations);

    return updatedAutomation;
  },

  deleteAutomation: (id: string): boolean => {
    const automations = db.getAutomations();
    const newAutomations = automations.filter((a) => a.id !== id);

    if (newAutomations.length === automations.length) {
      return false;
    }

    db.saveAutomations(newAutomations);
    return true;
  },

  // Adicionar um log a uma automação
  addLogToAutomation: (automationId: string, log: WebhookLog): boolean => {
    const automations = db.getAutomations();
    const index = automations.findIndex((a) => a.id === automationId);

    if (index === -1) return false;

    const automation = automations[index];
    const logs = automation.logs || [];
    logs.unshift(log); // Adicionar no início para que os mais recentes apareçam primeiro

    // Limitar o número de logs armazenados
    const MAX_LOGS = 100;
    automation.logs = logs.slice(0, MAX_LOGS);

    db.saveAutomations(automations);
    return true;
  },

  // Obter logs de uma automação
  getLogsForAutomation: (automationId: string): WebhookLog[] => {
    const automations = db.getAutomations();
    const automation = automations.find((a) => a.id === automationId);
    return automation?.logs || [];
  },

  // Limpar logs de uma automação
  clearLogsForAutomation: (automationId: string): boolean => {
    const automations = db.getAutomations();
    const index = automations.findIndex((a) => a.id === automationId);

    if (index === -1) return false;

    automations[index].logs = [];
    db.saveAutomations(automations);
    return true;
  },

  // Scripts de mensagem
  getMessageScripts: (): MessageScript[] => {
    // No cliente, tenta buscar do localStorage primeiro
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("notifyx_message_scripts");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Atualizar o armazenamento do servidor com os dados do cliente
          serverStore.messageScripts = parsed;
          return parsed;
        }
      } catch (error) {
        console.error(
          "Erro ao ler scripts de mensagem do localStorage:",
          error
        );
      }
    }

    // Inicializar se não existir
    if (!serverStore.messageScripts) {
      serverStore.messageScripts = [];
    }

    // Retorna do armazenamento do servidor
    return [...serverStore.messageScripts];
  },

  saveMessageScripts: (scripts: MessageScript[]): void => {
    // Atualizar o armazenamento do servidor
    serverStore.messageScripts = [...scripts];

    // No cliente, salvar também no localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "notifyx_message_scripts",
          JSON.stringify(scripts)
        );
      } catch (error) {
        console.error(
          "Erro ao salvar scripts de mensagem no localStorage:",
          error
        );
      }
    }
  },

  addMessageScript: (script: MessageScript): MessageScript => {
    const scripts = db.getMessageScripts();
    const newScripts = [...scripts, script];
    db.saveMessageScripts(newScripts);
    return script;
  },

  updateMessageScript: (
    id: string,
    data: Partial<MessageScript>
  ): MessageScript | undefined => {
    const scripts = db.getMessageScripts();
    const index = scripts.findIndex((s) => s.id === id);

    if (index === -1) return undefined;

    const updatedScript = {
      ...scripts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    scripts[index] = updatedScript;
    db.saveMessageScripts(scripts);

    return updatedScript;
  },

  deleteMessageScript: (id: string): boolean => {
    const scripts = db.getMessageScripts();
    const newScripts = scripts.filter((s) => s.id !== id);

    if (newScripts.length === scripts.length) {
      return false;
    }

    db.saveMessageScripts(newScripts);
    return true;
  },
};
