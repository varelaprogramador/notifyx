/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Webhook,
  Send,
  Globe,
  Code,
  Save,
  Trash2,
  Copy,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import type {
  Automation,
  TriggerType,
  ActionType,
} from "@/lib/automations-service";
import { listInstances } from "@/app/actions/instance-actions";
import type { Instance } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import server actions instead of the service directly
import {
  getAllAutomations,
  addAutomation,
  updateAutomation,
  deleteAutomation,
} from "@/app/actions/automation-actions";

// Import ScriptSelector
console.log(
  "[DEBUG] app/automations/page.tsx - Tentando importar ScriptSelector"
);
import ScriptSelector from "@/components/script-selector";
console.log("[DEBUG] app/automations/page.tsx - ScriptSelector importado");
import type { MessageScript } from "@/lib/message-scripts-service";

// Interface for a message block
interface MessageBlock {
  id: string;
  content: string;
  delay: number;
}

// Default test data
const DEFAULT_TEST_DATA = {
  telefone: "5511999999999",
  nome: "Usuário de Teste",
  pedido_id: "TEST-123",
  valor: "R$ 99,90",
};

// Default message block
const DEFAULT_MESSAGE_BLOCK = {
  id: "1",
  content: "",
  delay: 2,
};

export default function AutomationsPage() {
  // State for form inputs
  const [triggerType, setTriggerType] = useState<TriggerType>("webhook");
  const [actionType, setActionType] = useState<ActionType>("send_message");
  const [automationName, setAutomationName] = useState("");
  const [automationDescription, setAutomationDescription] = useState("");
  const [webhookPath, setWebhookPath] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [selectedInstance, setSelectedInstance] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [messageBlocks, setMessageBlocks] = useState<MessageBlock[]>([
    { ...DEFAULT_MESSAGE_BLOCK },
  ]);

  // State for API form
  const [automationType, setAutomationType] = useState<"webhook" | "api">(
    "webhook"
  );
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiMethod, setApiMethod] = useState("POST");
  const [apiHeaders, setApiHeaders] = useState("");
  const [apiBody, setApiBody] = useState("");

  // State for data and UI
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testWebhookPath, setTestWebhookPath] = useState("");
  const [testData, setTestData] = useState({ ...DEFAULT_TEST_DATA });

  const { toast } = useToast();

  // Load automations and instances on component mount
  useEffect(() => {
    loadAutomations();
    loadInstances();
  }, []);

  // Load automations from server action
  const loadAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const allAutomations = await getAllAutomations();
      setAutomations(allAutomations);
    } catch (error) {
      console.error("Erro ao carregar automações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as automações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load available instances
  const loadInstances = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listInstances();
      if (response.success && response.data) {
        const connectedInstances = response.data.filter(
          (inst) => inst.status === "connected"
        );
        setInstances(connectedInstances);

        if (connectedInstances.length > 0 && !selectedInstance) {
          setSelectedInstance(connectedInstances[0].instanceName);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar instâncias:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as instâncias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedInstance, toast]);

  // Generate a random webhook secret
  const generateSecret = useCallback(() => {
    const randomString =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    setWebhookSecret(randomString);
  }, []);

  // Copy webhook URL to clipboard
  const copyWebhookUrl = useCallback(
    (path: string) => {
      try {
        const baseUrl = window.location.origin;
        const webhookUrl = `${baseUrl}/api/webhooks/${path}`;
        navigator.clipboard.writeText(webhookUrl);
        toast({
          title: "URL copiado",
          description: "URL do webhook copiado para a área de transferência",
        });
      } catch (error) {
        console.error("Erro ao copiar URL:", error);
        toast({
          title: "Erro",
          description: "Não foi possível copiar o URL",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Message block functions
  const addMessageBlock = useCallback(() => {
    setMessageBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: "",
        delay: 2,
      },
    ]);
  }, []);

  const removeMessageBlock = useCallback(
    (id: string) => {
      if (messageBlocks.length <= 1) return;
      setMessageBlocks((prev) => prev.filter((block) => block.id !== id));
    },
    [messageBlocks.length]
  );

  const updateMessageBlockContent = useCallback(
    (id: string, content: string) => {
      setMessageBlocks((prev) =>
        prev.map((block) => (block.id === id ? { ...block, content } : block))
      );
    },
    []
  );

  const updateMessageBlockDelay = useCallback((id: string, delay: number) => {
    setMessageBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, delay } : block))
    );
  }, []);

  // Handle script selection
  const handleSelectScript = useCallback(
    (script: MessageScript, blockId?: string) => {
      if (script.messageBlocks && script.messageBlocks.length > 0) {
        if (blockId) {
          // Update a specific block with the first block of the script
          setMessageBlocks((prev) =>
            prev.map((block) =>
              block.id === blockId
                ? { ...block, content: script.messageBlocks![0].content }
                : block
            )
          );
        } else {
          // Replace all blocks with the script's blocks
          const newBlocks = script.messageBlocks.map((block, index) => ({
            id: Date.now().toString() + index,
            content: block.content,
            delay: block.delay,
          }));
          setMessageBlocks(newBlocks);
        }
      } else {
        // Behavior for simple scripts
        if (blockId) {
          // Update a specific block
          setMessageBlocks((prev) =>
            prev.map((block) =>
              block.id === blockId
                ? { ...block, content: script.content }
                : block
            )
          );
        } else {
          // Replace all blocks with the script
          setMessageBlocks([{ id: "1", content: script.content, delay: 0 }]);
        }
      }

      toast({
        title: "Script aplicado",
        description: `O script "${script.name}" foi aplicado com sucesso`,
      });
    },
    [toast]
  );

  // Test webhook
  const testWebhook = useCallback(
    async (path: string, customData?: any) => {
      setTestingWebhook(path);
      setTestResult(null);

      try {
        const baseUrl = window.location.origin;
        const webhookUrl = `${baseUrl}/api/webhooks/${path}`;

        // Use custom data or default data
        const payloadData = customData || testData;

        // Find the automation to get the secret key, if it exists
        const automation = automations.find(
          (a) =>
            (a.trigger_type === "webhook" && a.trigger_config?.path === path) ||
            (a.type === "webhook" && a.config?.path === path)
        );

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (automation?.trigger_config?.secret) {
          headers["x-webhook-secret"] = automation.trigger_config.secret;
        } else if (automation?.config?.secret) {
          headers["x-webhook-secret"] = automation.config.secret;
        }

        console.log("Enviando teste para webhook:", webhookUrl);
        console.log("Headers:", headers);
        console.log("Dados:", payloadData);

        // Make the request to the webhook
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payloadData),
        });

        const result = await response.json();
        console.log("Resposta do teste:", result);

        setTestResult({
          status: response.status,
          success: response.ok,
          data: result,
        });

        if (response.ok) {
          toast({
            title: "Teste bem-sucedido",
            description: "O webhook foi processado com sucesso",
          });
        } else {
          toast({
            title: "Erro no teste",
            description: result.error || "Ocorreu um erro ao testar o webhook",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Erro ao testar webhook:", error);
        setTestResult({
          success: false,
          error: error.message || "Erro ao conectar com o webhook",
        });

        toast({
          title: "Erro no teste",
          description: error.message || "Ocorreu um erro ao testar o webhook",
          variant: "destructive",
        });
      } finally {
        setTestingWebhook(null);
      }
    },
    [automations, testData, toast]
  );

  // Open test dialog
  const openTestDialog = useCallback((path: string) => {
    setTestWebhookPath(path);
    setShowTestDialog(true);
  }, []);

  // Update test data
  const handleTestDataChange = useCallback((field: string, value: string) => {
    setTestData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Save automation
  const handleSaveAutomation = useCallback(async () => {
    // Validate form
    if (!automationName) {
      toast({
        title: "Erro",
        description: "O nome da automação é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (automationType === "webhook" && (!webhookPath || !selectedInstance)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (automationType === "api" && (!apiEndpoint || !apiMethod)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate webhook path
    if (automationType === "webhook") {
      const existingAutomation = automations.find((a) => {
        if (a.trigger_type === "webhook") {
          return a.trigger_config?.path === webhookPath;
        } else if (a.type === "webhook") {
          return a.config?.path === webhookPath;
        }
        return false;
      });

      if (existingAutomation) {
        toast({
          title: "Erro",
          description: "Já existe uma automação com este caminho de webhook",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Create automation object based on the new format
      const newAutomation: Partial<Automation> = {
        name: automationName,
        description: automationDescription,
        trigger_type: automationType === "webhook" ? "webhook" : "schedule",
        trigger_config:
          automationType === "webhook"
            ? {
                path: webhookPath,
                secret: webhookSecret || undefined,
              }
            : {
                schedule: "0 0 * * *", // Default daily schedule
              },
        action_type: automationType === "webhook" ? "send_message" : "call_api",
        action_config:
          automationType === "webhook"
            ? {
                instance: selectedInstance,
                messageTemplate:
                  messageBlocks[0]?.content ||
                  "Olá {{nome}}, esta é uma mensagem automática.",
                messageBlocks: messageBlocks,
              }
            : {
                endpoint: apiEndpoint,
                method: apiMethod,
                headers: apiHeaders,
                body: apiBody,
              },
        is_active: isActive,
      };

      // Add the automation using the server action
      await addAutomation(newAutomation as any);

      // Update the local state
      await loadAutomations();

      resetForm();
      setShowNewForm(false);

      toast({
        title: "Automação criada",
        description: "A automação foi criada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao salvar automação:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar automação: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [
    automationName,
    automationDescription,
    automationType,
    webhookPath,
    webhookSecret,
    selectedInstance,
    messageBlocks,
    apiEndpoint,
    apiMethod,
    apiHeaders,
    apiBody,
    isActive,
    automations,
    loadAutomations,
    toast,
  ]);

  // Reset form
  const resetForm = useCallback(() => {
    setAutomationName("");
    setAutomationDescription("");
    setWebhookPath("");
    setWebhookSecret("");
    setMessageTemplate("");
    setApiEndpoint("");
    setApiMethod("POST");
    setApiHeaders("");
    setApiBody("");
    setIsActive(true);
    setMessageBlocks([{ ...DEFAULT_MESSAGE_BLOCK }]);
  }, []);

  // Delete automation
  const handleDeleteAutomation = useCallback(
    async (id: string) => {
      if (!window.confirm("Tem certeza que deseja excluir esta automação?")) {
        return;
      }

      try {
        const success = await deleteAutomation(id);

        if (success) {
          await loadAutomations();

          toast({
            title: "Automação excluída",
            description: "A automação foi excluída com sucesso",
          });
        } else {
          throw new Error("Não foi possível excluir a automação");
        }
      } catch (error: any) {
        console.error("Erro ao excluir automação:", error);
        toast({
          title: "Erro",
          description: `Erro ao excluir automação: ${error.message}`,
          variant: "destructive",
        });
      }
    },
    [loadAutomations, toast]
  );

  // Toggle automation status
  const toggleAutomationStatus = useCallback(
    async (id: string) => {
      try {
        const automation = automations.find((a) => a.id === id);
        if (!automation) return;

        // Handle both old and new format
        if (automation.is_active !== undefined) {
          await updateAutomation(id, {
            is_active: !automation.is_active,
          });
        } else if (automation.active !== undefined) {
          await updateAutomation(id, {
            active: !automation.active,
          });
        }

        await loadAutomations();
      } catch (error: any) {
        console.error("Erro ao atualizar status da automação:", error);
        toast({
          title: "Erro",
          description: `Erro ao atualizar status: ${error.message}`,
          variant: "destructive",
        });
      }
    },
    [automations, loadAutomations, toast]
  );

  // Helper function to get automation status
  const getAutomationStatus = useCallback((automation: Automation): boolean => {
    return automation.is_active !== undefined
      ? automation.is_active
      : automation.active !== undefined
      ? automation.active
      : false;
  }, []);

  // Helper function to get webhook path
  const getWebhookPath = useCallback((automation: Automation): string => {
    if (
      automation.trigger_type === "webhook" &&
      automation.trigger_config?.path
    ) {
      return automation.trigger_config.path;
    } else if (automation.type === "webhook" && automation.config?.path) {
      return automation.config.path;
    }
    return "";
  }, []);

  // Helper function to get instance name
  const getInstanceName = useCallback((automation: Automation): string => {
    if (
      automation.action_type === "send_message" &&
      automation.action_config?.instance
    ) {
      return automation.action_config.instance;
    } else if (automation.type === "webhook" && automation.config?.instance) {
      return automation.config.instance;
    }
    return "";
  }, []);

  // Helper function to get message template
  const getMessageTemplate = useCallback((automation: Automation): string => {
    if (
      automation.action_type === "send_message" &&
      automation.action_config?.messageTemplate
    ) {
      return automation.action_config.messageTemplate;
    } else if (
      automation.type === "webhook" &&
      automation.config?.messageTemplate
    ) {
      return automation.config.messageTemplate;
    }
    return "";
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                Configurações
              </Button>
            </Link>
            <Link href="/compose">
              <Button variant="ghost" size="sm">
                Nova Mensagem
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8 px-6">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Automações</h2>
            <Button onClick={() => setShowNewForm(true)} disabled={showNewForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Automação
            </Button>
          </div>

          {showNewForm && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Nova Automação</CardTitle>
                <CardDescription className="mt-1">
                  Configure uma nova automação para envio de mensagens ou
                  integração com outras APIs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="automation-name" className="text-base">
                    Nome da Automação
                  </Label>
                  <Input
                    id="automation-name"
                    placeholder="Ex: Notificação de Pedido"
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="automation-description" className="text-base">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    id="automation-description"
                    placeholder="Descreva o propósito desta automação"
                    value={automationDescription}
                    onChange={(e) => setAutomationDescription(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Tipo de Automação</Label>
                  <div className="flex gap-4">
                    <div
                      className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors ${
                        automationType === "webhook"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setAutomationType("webhook")}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Webhook
                          className={`h-5 w-5 ${
                            automationType === "webhook" ? "text-primary" : ""
                          }`}
                        />
                        <span className="font-medium">Receber Webhook</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receba dados via webhook e envie mensagens
                        automaticamente.
                      </p>
                    </div>
                    <div
                      className={`flex-1 border rounded-lg p-4 cursor-pointer transition-colors ${
                        automationType === "api"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setAutomationType("api")}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Globe
                          className={`h-5 w-5 ${
                            automationType === "api" ? "text-primary" : ""
                          }`}
                        />
                        <span className="font-medium">Enviar para API</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Envie dados para outras APIs quando uma mensagem for
                        recebida.
                      </p>
                    </div>
                  </div>
                </div>

                <Tabs
                  defaultValue={automationType}
                  onValueChange={(value) =>
                    setAutomationType(value as "webhook" | "api")
                  }
                >
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="webhook">
                      <Webhook className="mr-2 h-4 w-4" />
                      Webhook
                    </TabsTrigger>
                    <TabsTrigger value="api">
                      <Globe className="mr-2 h-4 w-4" />
                      API
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="webhook" className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="webhook-path" className="text-base">
                        Caminho do Webhook
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center h-11 px-3 rounded-md border bg-muted/50 text-muted-foreground">
                          {window.location.origin}/api/webhooks/
                        </div>
                        <Input
                          id="webhook-path"
                          placeholder="meu-webhook"
                          className="flex-1 h-11"
                          value={webhookPath}
                          onChange={(e) => setWebhookPath(e.target.value)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use apenas letras minúsculas, números e hífens.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="webhook-secret" className="text-base">
                          Chave Secreta (opcional)
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateSecret}
                        >
                          Gerar Chave
                        </Button>
                      </div>
                      <Input
                        id="webhook-secret"
                        placeholder="Chave para validar requisições"
                        className="h-11"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Use esta chave para verificar a autenticidade das
                        requisições.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="instance" className="text-base">
                        Instância WhatsApp
                      </Label>
                      <Select
                        value={selectedInstance}
                        onValueChange={setSelectedInstance}
                      >
                        <SelectTrigger id="instance" className="h-11">
                          <SelectValue placeholder="Selecione uma instância" />
                        </SelectTrigger>
                        <SelectContent>
                          {instances.length === 0 ? (
                            <SelectItem value="no-instances" disabled>
                              Nenhuma instância conectada
                            </SelectItem>
                          ) : (
                            instances.map((instance) => (
                              <SelectItem
                                key={instance.instanceName}
                                value={instance.instanceName}
                              >
                                {instance.instanceName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-base">Blocos de Mensagem</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addMessageBlock}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Adicionar Bloco
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {messageBlocks.map((block, index) => (
                          <div
                            key={block.id}
                            className="border rounded-md p-4 space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">
                                Mensagem {index + 1}
                              </h4>
                              <div className="flex items-center gap-2">
                                {/* <ScriptSelector
                                  onSelectScript={(script) =>
                                    handleSelectScript(script, block.id)
                                  }
                                  buttonLabel="Usar Script"
                                  buttonVariant="ghost"
                                /> */}
                                {messageBlocks.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMessageBlock(block.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <Textarea
                              value={block.content}
                              onChange={(e) =>
                                updateMessageBlockContent(
                                  block.id,
                                  e.target.value
                                )
                              }
                              className="min-h-[100px]"
                              placeholder={`Olá {{nome}}, recebemos seu pedido #{{pedido_id}}!`}
                            />

                            {index < messageBlocks.length - 1 && (
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor={`delay-${block.id}`}
                                  className="whitespace-nowrap"
                                >
                                  Delay após esta mensagem:
                                </Label>
                                <Input
                                  id={`delay-${block.id}`}
                                  type="number"
                                  min="0"
                                  value={block.delay}
                                  onChange={(e) =>
                                    updateMessageBlockDelay(
                                      block.id,
                                      Number.parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">
                                  segundos
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Use {"{{variavel}}"} para inserir dados recebidos no
                        webhook.
                      </p>
                    </div>

                    <Alert>
                      <Code className="h-4 w-4" />
                      <AlertTitle>Exemplo de Payload</AlertTitle>
                      <AlertDescription>
                        <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto">
                          {`{
 "telefone": "5511999999999",
 "nome": "João Silva",
 "pedido_id": "12345",
 "valor": "R$ 150,00"
}`}
                        </pre>
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  <TabsContent value="api" className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="api-endpoint" className="text-base">
                        URL da API
                      </Label>
                      <Input
                        id="api-endpoint"
                        placeholder="https://api.exemplo.com/webhook"
                        className="h-11"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="api-method" className="text-base">
                        Método HTTP
                      </Label>
                      <Select value={apiMethod} onValueChange={setApiMethod}>
                        <SelectTrigger id="api-method" className="h-11">
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="api-headers" className="text-base">
                        Cabeçalhos (Headers)
                      </Label>
                      <Textarea
                        id="api-headers"
                        placeholder={`Content-Type: application/json\nAuthorization: Bearer token`}
                        className="min-h-[100px] font-mono text-sm"
                        value={apiHeaders}
                        onChange={(e) => setApiHeaders(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Um cabeçalho por linha, no formato &quot;Nome:
                        Valor&quot;.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="api-body" className="text-base">
                        Corpo da Requisição (Body)
                      </Label>
                      <Textarea
                        id="api-body"
                        placeholder={`{\n  "message": "{{message}}", \n  "sender": "{{sender}}"\n}`}
                        className="min-h-[150px] font-mono text-sm"
                        value={apiBody}
                        onChange={(e) => setApiBody(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Use {"{{variavel}}"} para inserir dados da mensagem
                        recebida.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active">Ativar automação imediatamente</Label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between py-6">
                <Button variant="outline" onClick={() => setShowNewForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAutomation}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Automação
                </Button>
              </CardFooter>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : automations.length > 0 ? (
            <div className="space-y-4">
              {automations.map((automation) => (
                <Card key={automation.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {automation.type === "webhook" ||
                        automation.trigger_type === "webhook" ? (
                          <Webhook className="h-5 w-5 text-primary" />
                        ) : (
                          <Globe className="h-5 w-5 text-primary" />
                        )}
                        <Link
                          href={`/automations/${automation.id}`}
                          className="hover:underline"
                        >
                          <CardTitle>{automation.name}</CardTitle>
                        </Link>
                      </div>
                      <Badge
                        variant={
                          getAutomationStatus(automation)
                            ? "default"
                            : "outline"
                        }
                      >
                        {getAutomationStatus(automation) ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      Criado em{" "}
                      {new Date(
                        automation.created_at ||
                          automation.createdAt ||
                          new Date().toISOString()
                      ).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details">
                        <AccordionTrigger>
                          Detalhes da Automação
                        </AccordionTrigger>
                        <AccordionContent>
                          {automation.type === "webhook" ||
                          automation.trigger_type === "webhook" ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  URL do Webhook:
                                </span>
                                <div className="flex items-center gap-2">
                                  <code className="bg-muted px-2 py-1 rounded text-xs">
                                    {window.location.origin}/api/webhooks/
                                    {getWebhookPath(automation)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      copyWebhookUrl(getWebhookPath(automation))
                                    }
                                    className="h-8 w-8"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Instância:
                                </span>
                                <span>{getInstanceName(automation)}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  Template de Mensagem:
                                </span>
                                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                                  {getMessageTemplate(automation) ||
                                    "Nenhum template definido"}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openTestDialog(getWebhookPath(automation))
                                  }
                                  disabled={
                                    testingWebhook ===
                                    getWebhookPath(automation)
                                  }
                                >
                                  {testingWebhook ===
                                  getWebhookPath(automation) ? (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                      Testando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-4 w-4" />
                                      Testar Webhook
                                    </>
                                  )}
                                </Button>
                              </div>

                              {testResult &&
                                testingWebhook ===
                                  getWebhookPath(automation) && (
                                  <Alert
                                    variant={
                                      testResult.success
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    <AlertTitle>
                                      {testResult.success
                                        ? "Teste bem-sucedido"
                                        : "Erro no teste"}
                                    </AlertTitle>
                                    <AlertDescription>
                                      {testResult.success
                                        ? "O webhook foi processado com sucesso"
                                        : testResult.data?.error ||
                                          testResult.error ||
                                          "Ocorreu um erro ao testar o webhook"}

                                      {testResult.data && (
                                        <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto">
                                          {JSON.stringify(
                                            testResult.data,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      )}
                                    </AlertDescription>
                                  </Alert>
                                )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Endpoint:
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {automation.action_config?.method ||
                                      automation.config?.method ||
                                      "POST"}
                                  </Badge>
                                  <code className="bg-muted px-2 py-1 rounded text-xs">
                                    {automation.action_config?.endpoint ||
                                      automation.config?.endpoint ||
                                      ""}
                                  </code>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  Headers:
                                </span>
                                <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
                                  {automation.action_config?.headers ||
                                    automation.config?.headers ||
                                    "Nenhum header definido"}
                                </pre>
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  Body:
                                </span>
                                <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
                                  {automation.action_config?.body ||
                                    automation.config?.body ||
                                    "Nenhum body definido"}
                                </pre>
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter className="flex justify-between py-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`active-${automation.id}`}
                        checked={getAutomationStatus(automation)}
                        onCheckedChange={() =>
                          toggleAutomationStatus(automation.id)
                        }
                      />
                      <Label htmlFor={`active-${automation.id}`}>
                        {getAutomationStatus(automation) ? "Ativo" : "Inativo"}
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/automations/${automation.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAutomation(automation.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            !showNewForm && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    {automationType === "webhook" ? (
                      <Webhook className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <Send className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Nenhuma automação encontrada
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Crie sua primeira automação para enviar mensagens
                    automaticamente ou integrar com outras APIs.
                  </p>
                  <Button onClick={() => setShowNewForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Automação
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </main>
      {/* Modal de teste de webhook */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Webhook</DialogTitle>
            <DialogDescription>
              Personalize os dados para testar o webhook.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="test-telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="test-telefone"
                value={testData.telefone}
                onChange={(e) =>
                  handleTestDataChange("telefone", e.target.value)
                }
                className="col-span-3"
                placeholder="5511999999999"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="test-nome" className="text-right">
                Nome
              </Label>
              <Input
                id="test-nome"
                value={testData.nome}
                onChange={(e) => handleTestDataChange("nome", e.target.value)}
                className="col-span-3"
                placeholder="Usuário de Teste"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="test-pedido" className="text-right">
                Pedido ID
              </Label>
              <Input
                id="test-pedido"
                value={testData.pedido_id}
                onChange={(e) =>
                  handleTestDataChange("pedido_id", e.target.value)
                }
                className="col-span-3"
                placeholder="TEST-123"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="test-valor" className="text-right">
                Valor
              </Label>
              <Input
                id="test-valor"
                value={testData.valor}
                onChange={(e) => handleTestDataChange("valor", e.target.value)}
                className="col-span-3"
                placeholder="R$ 99,90"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowTestDialog(false);
                testWebhook(testWebhookPath, testData);
              }}
            >
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
