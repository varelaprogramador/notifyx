"use client";

import type React from "react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PlusCircle, Trash } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileAudio,
  FileText,
  Image,
  Send,
  RefreshCw,
  AlertCircle,
  X,
  Users,
  UserCircle,
  Check,
  Search,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import Link from "next/link";
import MediaUploader from "@/components/media-uploader";
import {
  listInstances,
  listContacts,
  sendTextMessage,
} from "@/app/actions/instance-actions";
import type { Contact, Instance } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Importe o novo componente de diálogo de progresso
import {
  SendProgressDialog,
  type MessageLog,
  type MessageStatus,
} from "@/components/send-progress-dialog";

// Adicione a importação do ScriptSelector
import ScriptSelector from "@/components/script-selector";
import type { MessageScript } from "@/lib/message-scripts-service";

// Função para gerar um ID único
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Função para formatar timestamp
function formatTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Atualizar a função sendBulkMessagesWithProgress para usar telefone em vez de number
async function sendBulkMessagesWithProgress(
  instanceName: string,
  recipientsDetails: { id: string; number: string; name: string }[],
  message: string,
  onProgressUpdate: (logs: MessageLog[], completed: number) => void
): Promise<{ success: boolean; successful: number; failed: number }> {
  try {
    let successful = 0;
    let failed = 0;
    let completed = 0;

    // Inicializar logs com status pendente para todos os destinatários
    const initialLogs: MessageLog[] = recipientsDetails.map((recipient) => ({
      id: generateId(),
      recipient: recipient.name,
      status: "pending" as MessageStatus,
      message: `Aguardando envio para ${recipient.name}...`,
      timestamp: formatTimestamp(),
    }));

    // Atualizar o progresso inicial
    onProgressUpdate([...initialLogs], completed);

    // Processar cada destinatário sequencialmente
    for (let i = 0; i < recipientsDetails.length; i++) {
      const recipient = recipientsDetails[i];
      const logId = initialLogs[i].id;

      try {
        // Atualizar log para "enviando"
        const updatedLogs = initialLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                status: "sending" as MessageStatus,
                message: `Enviando mensagem para ${recipient.name}...`,
                timestamp: formatTimestamp(),
              }
            : log
        );
        onProgressUpdate([...updatedLogs], completed);

        // Pequena pausa para garantir que a UI seja atualizada
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Enviar mensagem - usar a mensagem passada como parâmetro
        console.log(`Enviando mensagem para ${recipient.name}: "${message}"`);
        const response = await sendTextMessage(
          instanceName,
          recipient.number,
          message
        );

        // Atualizar log com resultado
        if (response.success) {
          successful++;
          initialLogs[i] = {
            ...initialLogs[i],
            status: "success" as MessageStatus,
            message: `Mensagem enviada com sucesso para ${recipient.name}`,
            timestamp: formatTimestamp(),
          };
        } else {
          failed++;
          initialLogs[i] = {
            ...initialLogs[i],
            status: "error" as MessageStatus,
            message: `Falha ao enviar para ${recipient.name}`,
            error: response.error || "Erro desconhecido",
            timestamp: formatTimestamp(),
          };
        }

        completed++;
        onProgressUpdate([...initialLogs], completed);

        // Aguardar um pequeno intervalo para evitar sobrecarga da API
        if (i < recipientsDetails.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        failed++;
        completed++;
        initialLogs[i] = {
          ...initialLogs[i],
          status: "error" as MessageStatus,
          message: `Erro ao enviar para ${recipient.name}`,
          error: error.message || "Erro inesperado durante o envio",
          timestamp: formatTimestamp(),
        };
        onProgressUpdate([...initialLogs], completed);
      }
    }

    return {
      success: successful > 0,
      successful,
      failed,
    };
  } catch (error: any) {
    console.error("Erro durante o envio em massa:", error);
    return {
      success: false,
      successful: 0,
      failed: recipientsDetails.length,
    };
  }
}

// Função para aplicar formatação ao texto selecionado
function applyFormatting(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  formatType: string
): string {
  const selectedText = text.substring(selectionStart, selectionEnd);

  if (!selectedText) return text;

  let formattedText = "";

  switch (formatType) {
    case "bold":
      formattedText = `*${selectedText}*`;
      break;
    case "italic":
      formattedText = `_${selectedText}_`;
      break;
    case "underline":
      formattedText = `~${selectedText}~`;
      break;
    case "monospace":
      formattedText = `\`\`\`${selectedText}\`\`\``;
      break;
    case "list":
      // Divide o texto em linhas e adiciona marcadores
      formattedText = selectedText
        .split("\n")
        .map((line) => (line.trim() ? `• ${line}` : line))
        .join("\n");
      break;
    default:
      formattedText = selectedText;
  }

  return (
    text.substring(0, selectionStart) +
    formattedText +
    text.substring(selectionEnd)
  );
}

export default function ComposePage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<string[]>([""]);
  const [messageDelay, setMessageDelay] = useState<number>(2);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const { toast } = useToast();

  // Estados para o diálogo de progresso
  const [sendProgressOpen, setSendProgressOpen] = useState(false);
  const [sendLogs, setSendLogs] = useState<MessageLog[]>([]);
  const [sendProgress, setSendProgress] = useState({ total: 0, completed: 0 });
  const [sendInProgress, setSendInProgress] = useState(false);
  const [sendAllowClose, setSendAllowClose] = useState(false);

  // Replace the single textareaRef with these two refs
  const [messageTextareaRef, setMessageTextareaRef] =
    useState<HTMLTextAreaElement | null>(null);
  const [captionTextareaRef, setCaptionTextareaRef] =
    useState<HTMLTextAreaElement | null>(null);

  // Declare missing states
  const [message, setMessage] = useState<string>("");
  const [caption, setCaption] = useState<string>("");

  // Memoizar grupos e contatos para melhor desempenho, considerando números que começam com 12036 como grupos
  const groups = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          contact.isGroup ||
          (contact.number && contact.number.startsWith("12036"))
      ),
    [contacts]
  );

  const individualContacts = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          !contact.isGroup &&
          (!contact.number || !contact.number.startsWith("12036"))
      ),
    [contacts]
  );

  // Memoizar contatos filtrados pela busca
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(term) ||
        contact.number.toLowerCase().includes(term)
    );
  }, [contacts, searchTerm]);

  // Memoizar grupos e contatos filtrados
  const filteredGroups = useMemo(
    () =>
      filteredContacts.filter(
        (contact) =>
          contact.isGroup ||
          (contact.number && contact.number.startsWith("12036"))
      ),
    [filteredContacts]
  );

  const filteredIndividualContacts = useMemo(
    () =>
      filteredContacts.filter(
        (contact) =>
          !contact.isGroup &&
          (!contact.number || !contact.number.startsWith("12036"))
      ),
    [filteredContacts]
  );

  // Memoizar contatos selecionados
  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedContactIds.includes(contact.id)),
    [contacts, selectedContactIds]
  );

  // Carregar instâncias
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listInstances();
      if (response.success && response.data) {
        const connectedInstances = response.data.filter(
          (inst) => inst.status === "connected"
        );
        setInstances(connectedInstances);

        if (connectedInstances.length > 0) {
          setSelectedInstance(connectedInstances[0].instanceName);
        }
      }
    } catch (err) {
      setError("Erro ao carregar instâncias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Carregar contatos quando uma instância é selecionada
  const fetchContacts = useCallback(async (instanceName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await listContacts(instanceName);

      if (response.success && response.data) {
        setContacts(response.data);
      } else {
        setError(response.error || "Erro ao carregar contatos");
      }
    } catch (err) {
      setError("Erro ao carregar contatos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      fetchContacts(selectedInstance);
      // Limpar contatos selecionados ao mudar de instância
      setSelectedContactIds([]);
    }
  }, [selectedInstance, fetchContacts]);

  const handleInstanceChange = useCallback((value: string) => {
    setSelectedInstance(value);
    setSelectedContactIds([]);
  }, []);

  const handleMessageChange = useCallback((index: number, value: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[index] = value;
      return newMessages;
    });
  }, []);

  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCaption(e.target.value);
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const removeSelectedContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => prev.filter((id) => id !== contactId));
  }, []);

  // Função para atualizar o progresso do envio
  const updateSendProgress = useCallback(
    (logs: MessageLog[], completed: number) => {
      setSendLogs(logs);
      setSendProgress((prev) => ({ ...prev, completed }));
    },
    []
  );

  const handleFormatting = useCallback(
    (formatType: string, textType: "message" | "caption" = "message") => {
      const currentTextarea =
        textType === "message" ? messageTextareaRef : captionTextareaRef;
      const currentText = textType === "message" ? message : caption;
      const setText = textType === "message" ? setMessage : setCaption;

      if (!currentTextarea) return;

      const { selectionStart, selectionEnd } = currentTextarea;

      // Se não há texto selecionado, não faz nada
      if (selectionStart === selectionEnd) {
        toast({
          title: "Selecione um texto",
          description: "Selecione o texto que deseja formatar",
        });
        return;
      }

      const newText = applyFormatting(
        currentText,
        selectionStart,
        selectionEnd,
        formatType
      );
      setText(newText);

      // Restaurar o foco no textarea após a formatação
      setTimeout(() => {
        if (currentTextarea) {
          currentTextarea.focus();
          // Ajustar a posição do cursor após a formatação
          const newCursorPos =
            selectionEnd + (newText.length - currentText.length);
          currentTextarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [message, caption, messageTextareaRef, captionTextareaRef, toast]
  );

  const addMessage = useCallback(() => {
    setMessages((prev) => [...prev, ""]);
  }, []);

  const removeMessage = useCallback((index: number) => {
    setMessages((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDelayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(e.target.value);
      if (!isNaN(value) && value >= 0) {
        setMessageDelay(value);
      }
    },
    []
  );

  // Adicione esta função dentro do componente ComposePage
  const handleSelectScript = (script: MessageScript) => {
    // Se o script tiver múltiplos blocos, adicionar cada um como uma mensagem separada
    if (script.messageBlocks && script.messageBlocks.length > 0) {
      const newMessages = script.messageBlocks.map((block) => block.content);
      setMessages(newMessages);

      // Atualizar os delays entre mensagens, se aplicável
      if (script.messageBlocks.length > 1) {
        // Pegar o delay do primeiro bloco
        const firstBlockDelay = script.messageBlocks[0].delay;
        if (firstBlockDelay > 0) {
          setMessageDelay(firstBlockDelay);
        }
      }
    } else {
      // Comportamento anterior para scripts simples
      const updatedMessages = [...messages];
      updatedMessages[0] = script.content;
      setMessages(updatedMessages);
    }

    toast({
      title: "Script aplicado",
      description: `O script "${script.name}" foi aplicado com sucesso`,
    });
  };

  // Função de envio de mensagens melhorada
  const handleSendMessage = useCallback(async () => {
    if (!selectedInstance || selectedContactIds.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const currentMessages = messages.filter((msg) => msg.trim() !== "");

    if (currentMessages.length === 0) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia",
        variant: "destructive",
      });
      return;
    }

    // Preparar para o envio
    console.log(`Mensagem a ser enviada: "${currentMessages}"`);
    console.log(
      `Destinatários: ${selectedContacts.map((c) => c.name).join(", ")}`
    );

    setSendLogs([]);
    setSendProgress({ total: selectedContactIds.length, completed: 0 });
    setSendInProgress(true);
    setSendAllowClose(false);
    setSendProgressOpen(true);
    setSending(true);

    try {
      // Obter detalhes dos contatos selecionados
      const recipientsDetails = selectedContacts.map((contact) => ({
        id: contact.id,
        number: contact.number,
        name: contact.name,
      }));

      // Limpar o campo de mensagem imediatamente para evitar reuso
      setMessages([""]);
      setCaption("");

      if (recipientsDetails.length === 1) {
        // Enviar para um único destinatário
        const recipient = recipientsDetails[0];

        // Função para enviar mensagens sequencialmente com delay
        const sendMessagesWithDelay = async (messages: string[], index = 0) => {
          if (index >= messages.length) return true;

          const logId = generateId();
          const currentMsg = messages[index];

          // Inicializar log
          const initialLog: MessageLog = {
            id: logId,
            recipient: recipient.name,
            status: "pending",
            message: `Aguardando envio da mensagem ${index + 1}/${
              messages.length
            } para ${recipient.name}...`,
            timestamp: formatTimestamp(),
          };

          setSendLogs((prev) => [...prev, initialLog]);

          // Atualizar para status "enviando"
          setTimeout(() => {
            setSendLogs((prev) =>
              prev.map((log) =>
                log.id === logId
                  ? {
                      ...log,
                      status: "sending",
                      message: `Enviando mensagem ${index + 1}/${
                        messages.length
                      } para ${recipient.name}...`,
                      timestamp: formatTimestamp(),
                    }
                  : log
              )
            );
          }, 100);

          // Enviar mensagem atual
          console.log(
            `Enviando mensagem ${index + 1}/${messages.length} para ${
              recipient.name
            }: "${currentMsg}"`
          );
          const response = await sendTextMessage(
            selectedInstance,
            recipient.number,
            currentMsg
          );

          // Atualizar log com resultado
          const finalLog: MessageLog = {
            id: logId,
            recipient: recipient.name,
            status: response.success ? "success" : "error",
            message: response.success
              ? `Mensagem ${index + 1}/${
                  messages.length
                } enviada com sucesso para ${recipient.name}`
              : `Falha ao enviar mensagem ${index + 1}/${
                  messages.length
                } para ${recipient.name}`,
            timestamp: formatTimestamp(),
          };

          if (!response.success && response.error) {
            finalLog.error = response.error;
          }

          setSendLogs((prev) =>
            prev.map((log) => (log.id === logId ? finalLog : log))
          );

          // Se falhou, interrompe o envio
          if (!response.success) {
            return false;
          }

          // Se não é a última mensagem, aguarda o delay e envia a próxima
          if (index < messages.length - 1) {
            // Adicionar log de espera
            const delayLogId = generateId();
            setSendLogs((prev) => [
              ...prev,
              {
                id: delayLogId,
                recipient: recipient.name,
                status: "pending",
                message: `Aguardando ${messageDelay} segundos antes da próxima mensagem...`,
                timestamp: formatTimestamp(),
              },
            ]);

            // Aguardar o delay configurado
            await new Promise((resolve) =>
              setTimeout(resolve, messageDelay * 1000)
            );

            // Remover log de espera
            setSendLogs((prev) => prev.filter((log) => log.id !== delayLogId));

            // Enviar próxima mensagem
            return await sendMessagesWithDelay(messages, index + 1);
          }

          return true;
        };

        // Iniciar o envio sequencial
        const success = await sendMessagesWithDelay(currentMessages);
        setSendProgress({
          total: currentMessages.length,
          completed: currentMessages.length,
        });

        if (success) {
          toast({
            title: "Sucesso",
            description: `${currentMessages.length} mensagens enviadas com sucesso`,
          });
        } else {
          toast({
            title: "Erro",
            description:
              "Algumas mensagens não puderam ser enviadas. Verifique o log para mais detalhes.",
            variant: "destructive",
          });
        }
      } else {
        // Enviar para múltiplos destinatários - usar a mensagem armazenada
        const result = await sendBulkMessagesWithProgress(
          selectedInstance,
          recipientsDetails,
          currentMessages[0],
          updateSendProgress
        );

        if (result.success) {
          toast({
            title: "Sucesso",
            description: `Mensagem enviada para ${result.successful} de ${recipientsDetails.length} destinatários`,
          });
        } else {
          toast({
            title: "Atenção",
            description: `Falha ao enviar mensagens. Verifique o log para mais detalhes.`,
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description:
          err instanceof Error ? err.message : "Erro ao enviar mensagem",
        variant: "destructive",
      });

      // Atualizar logs em caso de erro geral
      if (sendLogs.length === 0) {
        setSendLogs([
          {
            id: generateId(),
            recipient: "Sistema",
            status: "error",
            message: "Erro ao iniciar o envio de mensagens",
            error: err instanceof Error ? err.message : "Erro desconhecido",
            timestamp: formatTimestamp(),
          },
        ]);
      }
    } finally {
      setSending(false);
      setSendInProgress(false);
      setSendAllowClose(true);
    }
  }, [
    selectedInstance,
    selectedContactIds,
    selectedContacts,
    messages,
    toast,
    updateSendProgress,
    handleFormatting,
    messageDelay,
  ]);

  // Função para verificar se um contato deve ser tratado como grupo
  const isGroupContact = useCallback((contact: Contact) => {
    return (
      contact.isGroup || (contact.number && contact.number.startsWith("12036"))
    );
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4 px-6">
          <Link
            href="/"
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
            <Link href="/automations">
              <Button variant="ghost" size="sm">
                Automações
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8 px-6">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Compor Mensagem</h2>

          {instances.length === 0 && !loading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nenhuma instância conectada</AlertTitle>
              <AlertDescription>
                Você precisa conectar uma instância do WhatsApp antes de enviar
                mensagens.
                <div className="mt-2">
                  <Link href="/settings">
                    <Button variant="outline" size="sm">
                      Ir para Configurações
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Detalhes da Mensagem</CardTitle>
              <CardDescription className="mt-1">
                Crie uma nova mensagem WhatsApp para enviar aos seus grupos ou
                contatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="instance" className="text-base">
                  Instância
                </Label>
                {loading ? (
                  <Skeleton className="h-11 w-full" />
                ) : (
                  <Select
                    value={selectedInstance || ""}
                    onValueChange={handleInstanceChange}
                  >
                    <SelectTrigger id="instance" className="h-11">
                      <SelectValue placeholder="Selecione uma instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((instance) => (
                        <SelectItem
                          key={instance.instanceName}
                          value={instance.instanceName}
                        >
                          {instance.instanceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Destinatários</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContactSelector(true)}
                    disabled={!selectedInstance}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Selecionar Contatos
                  </Button>
                </div>

                {selectedContactIds.length > 0 ? (
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {selectedContactIds.length}{" "}
                        {selectedContactIds.length === 1
                          ? "destinatário"
                          : "destinatários"}{" "}
                        selecionados
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContactIds([])}
                        className="h-8 px-2 text-xs"
                      >
                        Limpar todos
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {selectedContacts.map((contact) => (
                        <Badge
                          key={contact.id}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-1"
                        >
                          {isGroupContact(contact) ? (
                            <Users className="h-3 w-3 mr-1" />
                          ) : (
                            <UserCircle className="h-3 w-3 mr-1" />
                          )}
                          <span className="truncate max-w-[150px]">
                            {contact.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedContact(contact.id)}
                            className="h-5 w-5 p-0 rounded-full"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p>Nenhum destinatário selecionado</p>
                    <p className="text-sm mt-1">
                      Clique em &quot;Selecionar Contatos&quot; para escolher os
                      destinatários
                    </p>
                  </div>
                )}
              </div>

              <Tabs defaultValue="text">
                <TabsList className="grid grid-cols-3 w-full mb-4">
                  <TabsTrigger value="text">
                    <FileText className="mr-2 h-4 w-4" />
                    Texto
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <Image className="mr-2 h-4 w-4" />
                    Imagem
                  </TabsTrigger>
                  <TabsTrigger value="audio">
                    <FileAudio className="mr-2 h-4 w-4" />
                    Áudio
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="mt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base">Texto das Mensagens</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="messageDelay" className="text-sm">
                            Delay (segundos):
                          </Label>
                          <Input
                            id="messageDelay"
                            type="number"
                            min="0"
                            className="w-20 h-8"
                            value={messageDelay}
                            onChange={handleDelayChange}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addMessage}
                          disabled={
                            !selectedInstance || selectedContactIds.length === 0
                          }
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Adicionar Mensagem
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">
                                Mensagem {index + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                {index === 0 && (
                                  <ScriptSelector
                                    onSelectScript={handleSelectScript}
                                    buttonLabel="Usar Script"
                                    buttonVariant="ghost"
                                  />
                                )}
                                {messages.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMessage(index)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <Textarea
                              placeholder="Digite sua mensagem aqui..."
                              className="min-h-[100px] p-4"
                              value={msg}
                              onChange={(e) =>
                                handleMessageChange(index, e.target.value)
                              }
                              disabled={
                                !selectedInstance ||
                                selectedContactIds.length === 0
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="image" className="mt-6 space-y-6">
                  <MediaUploader
                    type="image"
                    disabled={
                      !selectedInstance || selectedContactIds.length === 0
                    }
                  />
                  <div className="space-y-3">
                    <Label htmlFor="caption" className="text-base">
                      Legenda da Imagem (Opcional)
                    </Label>
                    <div className="border rounded-md">
                      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleFormatting("bold", "caption")
                                }
                              >
                                <Bold className="h-4 w-4" />
                                <span className="sr-only">Negrito</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Negrito (*texto*)</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleFormatting("italic", "caption")
                                }
                              >
                                <Italic className="h-4 w-4" />
                                <span className="sr-only">Itálico</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Itálico (_texto_)</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleFormatting("underline", "caption")
                                }
                              >
                                <Underline className="h-4 w-4" />
                                <span className="sr-only">Tachado</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Tachado (~texto~)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Textarea
                        id="caption"
                        placeholder="Adicione uma legenda à sua imagem..."
                        className="min-h-[100px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={caption}
                        onChange={handleCaptionChange}
                        disabled={
                          !selectedInstance || selectedContactIds.length === 0
                        }
                        ref={(el) => setCaptionTextareaRef(el)}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="audio" className="mt-6 space-y-4">
                  <MediaUploader
                    type="audio"
                    disabled={
                      !selectedInstance || selectedContactIds.length === 0
                    }
                  />
                </TabsContent>
              </Tabs>

              <div className="space-y-3 pt-2">
                <Label htmlFor="schedule" className="text-base">
                  Agendamento (Opcional)
                </Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  className="h-11"
                  disabled={
                    !selectedInstance || selectedContactIds.length === 0
                  }
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Deixe em branco para enviar imediatamente.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between py-6 px-6">
              <Button
                variant="outline"
                size="lg"
                disabled={!selectedInstance || selectedContactIds.length === 0}
              >
                Salvar como Rascunho
              </Button>
              <Button
                size="lg"
                onClick={handleSendMessage}
                disabled={
                  sending ||
                  !selectedInstance ||
                  selectedContactIds.length === 0 ||
                  !messages.some((msg) => msg.trim() !== "")
                }
              >
                {sending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensagem
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Modal de seleção de contatos */}
      {showContactSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Selecionar Destinatários
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactSelector(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Input
                  placeholder="Buscar contatos..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum contato encontrado.</p>
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  defaultValue={["grupos", "contatos"]}
                  className="w-full"
                >
                  {/* Grupos */}
                  <AccordionItem value="grupos" className="border-b">
                    <AccordionTrigger className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Grupos</span>
                        <Badge variant="secondary" className="ml-2">
                          {filteredGroups.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[200px] pr-4">
                        <div className="space-y-1 px-1">
                          {filteredGroups.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2 px-3">
                              Nenhum grupo encontrado
                            </p>
                          ) : (
                            filteredGroups.map((contact) => (
                              <div
                                key={contact.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                                onClick={() =>
                                  toggleContactSelection(contact.id)
                                }
                              >
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={selectedContactIds.includes(
                                      contact.id
                                    )}
                                    onCheckedChange={() =>
                                      toggleContactSelection(contact.id)
                                    }
                                  />
                                </div>
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <Users className="h-4 w-4" />
                                </div>
                                <span className="flex-1 truncate">
                                  {contact.name}
                                </span>
                                {contact.number &&
                                  contact.number.startsWith("12036") && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Grupo 12036
                                    </Badge>
                                  )}
                                {selectedContactIds.includes(contact.id) && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Contatos individuais */}
                  <AccordionItem value="contatos" className="border-b-0">
                    <AccordionTrigger className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        <span>Contatos</span>
                        <Badge variant="secondary" className="ml-2">
                          {filteredIndividualContacts.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[200px] pr-4">
                        <div className="space-y-1 px-1">
                          {filteredIndividualContacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2 px-3">
                              Nenhum contato encontrado
                            </p>
                          ) : (
                            filteredIndividualContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                                onClick={() =>
                                  toggleContactSelection(contact.id)
                                }
                              >
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={selectedContactIds.includes(
                                      contact.id
                                    )}
                                    onCheckedChange={() =>
                                      toggleContactSelection(contact.id)
                                    }
                                  />
                                </div>
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <UserCircle className="h-4 w-4" />
                                </div>
                                <span className="flex-1 truncate">
                                  {contact.name}
                                </span>
                                {selectedContactIds.includes(contact.id) && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <div className="text-sm">
                {selectedContactIds.length}{" "}
                {selectedContactIds.length === 1
                  ? "destinatário"
                  : "destinatários"}{" "}
                selecionados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowContactSelector(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={() => setShowContactSelector(false)}>
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de progresso do envio */}
      <SendProgressDialog
        open={sendProgressOpen}
        onOpenChange={setSendProgressOpen}
        logs={sendLogs}
        total={sendProgress.total}
        completed={sendProgress.completed}
        inProgress={sendInProgress}
        allowClose={sendAllowClose}
      />
    </div>
  );
}
