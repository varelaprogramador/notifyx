"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Copy, RefreshCw } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  updateAutomation,
  deleteAutomation,
  executeWebhookAutomation,
  getLogsForAutomation,
  clearLogsForAutomation,
} from "@/app/actions/automation-actions";
import type { Automation } from "@/lib/automations-service";
import { useRouter } from "next/navigation";

interface AutomationDetailProps {
  automation: Automation;
}

export default function AutomationDetail({
  automation,
}: AutomationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(automation.name);
  const [description, setDescription] = useState(automation.description || "");
  const [isActive, setIsActive] = useState(
    automation.is_active !== undefined
      ? automation.is_active
      : automation.active
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  // Helper function to get webhook path
  const getWebhookPath = (): string => {
    if (
      automation.trigger_type === "webhook" &&
      automation.trigger_config?.path
    ) {
      return automation.trigger_config.path;
    } else if (automation.type === "webhook" && automation.config?.path) {
      return automation.config.path;
    }
    return "";
  };

  // Helper function to get instance name
  const getInstanceName = (): string => {
    if (
      automation.action_type === "send_message" &&
      automation.action_config?.instance
    ) {
      return automation.action_config.instance;
    } else if (automation.type === "webhook" && automation.config?.instance) {
      return automation.config.instance;
    }
    return "";
  };

  // Helper function to get message template
  const getMessageTemplate = (): string => {
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
  };

  // Copy webhook URL to clipboard
  const copyWebhookUrl = () => {
    try {
      const path = getWebhookPath();
      if (!path) return;

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
  };

  // Save automation changes
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const updates = {
        name,
        description,
        is_active: isActive,
      };

      await updateAutomation(automation.id, updates);

      toast({
        title: "Automação atualizada",
        description: "As alterações foram salvas com sucesso",
      });

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar automação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete automation
  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta automação?")) {
      return;
    }

    try {
      setIsDeleting(true);

      const success = await deleteAutomation(automation.id);

      if (success) {
        toast({
          title: "Automação excluída",
          description: "A automação foi excluída com sucesso",
        });

        router.push("/automations");
      } else {
        throw new Error("Não foi possível excluir a automação");
      }
    } catch (error) {
      console.error("Erro ao excluir automação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a automação",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Test webhook
  const testWebhook = async () => {
    try {
      const path = getWebhookPath();
      if (!path) return;

      const testData = {
        telefone: "5511999999999",
        nome: "Usuário de Teste",
        pedido_id: "TEST-123",
        valor: "R$ 99,90",
      };

      const result = await executeWebhookAutomation(automation, testData);

      if (result.success) {
        toast({
          title: "Teste bem-sucedido",
          description: "O webhook foi processado com sucesso",
        });
      } else {
        toast({
          title: "Erro no teste",
          description: result.message || "Ocorreu um erro ao testar o webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao testar webhook:", error);
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro ao testar o webhook",
        variant: "destructive",
      });
    }
  };

  // Load automation logs
  const loadLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const automationLogs = await getLogsForAutomation(automation.id);
      setLogs(automationLogs);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Clear automation logs
  const clearLogs = async () => {
    if (!window.confirm("Tem certeza que deseja limpar todos os logs?")) {
      return;
    }

    try {
      await clearLogsForAutomation(automation.id);
      setLogs([]);
      toast({
        title: "Logs limpos",
        description: "Os logs foram limpos com sucesso",
      });
    } catch (error) {
      console.error("Erro ao limpar logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar os logs",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4 px-6">
          <Link
            href="/automations"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Automações
          </Link>
        </div>
      </header>
      <main className="flex-1 container py-8 px-6">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>
                    {isEditing ? (
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-xl font-bold"
                      />
                    ) : (
                      automation.name
                    )}
                  </CardTitle>
                  <Badge variant={isActive ? "default" : "outline"}>
                    {isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardDescription className="mt-2">
                {isEditing ? (
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição da automação"
                    className="min-h-[80px]"
                  />
                ) : (
                  description || "Sem descrição"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Automation Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Detalhes da Automação</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Tipo
                      </Label>
                      <p className="font-medium">
                        {automation.trigger_type === "webhook" ||
                        automation.type === "webhook"
                          ? "Webhook"
                          : "API"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Criado em
                      </Label>
                      <p className="font-medium">
                        {new Date(
                          automation.created_at ||
                            automation.createdAt ||
                            new Date().toISOString()
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <Label htmlFor="active">Ativar automação</Label>
                    </div>
                  )}
                </div>

                {/* Webhook Details */}
                {(automation.trigger_type === "webhook" ||
                  automation.type === "webhook") && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Configuração do Webhook
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        URL do Webhook:
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {window.location.origin}/api/webhooks/
                          {getWebhookPath()}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={copyWebhookUrl}
                          className="h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Instância:</span>
                      <span>{getInstanceName()}</span>
                    </div>

                    <div>
                      <span className="text-sm font-medium">
                        Template de Mensagem:
                      </span>
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                        {getMessageTemplate() || "Nenhum template definido"}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={testWebhook}>
                        Testar Webhook
                      </Button>
                    </div>
                  </div>
                )}

                {/* Logs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Logs de Execução</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadLogs}
                        disabled={isLoadingLogs}
                      >
                        {isLoadingLogs ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar Logs"
                        )}
                      </Button>
                      {logs.length > 0 && (
                        <Button variant="outline" size="sm" onClick={clearLogs}>
                          Limpar Logs
                        </Button>
                      )}
                    </div>
                  </div>

                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <Alert
                          key={log.id}
                          variant={
                            log.status === "success" ? "default" : "destructive"
                          }
                        >
                          <AlertTitle>
                            {log.event_type} -{" "}
                            {new Date(log.created_at).toLocaleString()}
                          </AlertTitle>
                          <AlertDescription>
                            {log.status === "success"
                              ? "Executado com sucesso"
                              : log.error_message || "Erro na execução"}

                            {log.payload && (
                              <Accordion
                                type="single"
                                collapsible
                                className="w-full mt-2"
                              >
                                <AccordionItem value="payload">
                                  <AccordionTrigger>Payload</AccordionTrigger>
                                  <AccordionContent>
                                    <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                                      {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {isLoadingLogs ? (
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                      ) : (
                        "Nenhum log disponível"
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between py-6">
              <Link href="/automations">
                <Button variant="outline">Voltar</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
