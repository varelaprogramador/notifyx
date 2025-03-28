"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { Smartphone, Plus, RefreshCw, Trash2, QrCode } from "lucide-react";
import type { Instance } from "@/lib/types";
import {
  createInstance,
  deleteInstance,
  disconnectInstance,
  getInstanceQrCode,
  listInstances,
} from "@/app/actions/instance-actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
export default function InstanceManager() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const { toast } = useToast();

  // Carregar instâncias
  const fetchInstances = async () => {
    setLoading(true);
    setError(null); // Limpar erros anteriores

    try {
      console.log("Iniciando busca de instâncias...");
      const response = await listInstances();

      if (response.success && response.data) {
        console.log("Instâncias carregadas com sucesso:", response.data);
        // Log connection status details for debugging
        response.data.forEach((instance) => {
          console.log(
            `Instância ${instance.instanceName}: status = ${instance.status}`
          );
        });
        setInstances(response.data);
      } else {
        console.error("Erro na resposta da API:", response);
        setError(response.error || "Erro desconhecido ao carregar instâncias");
      }
    } catch (err) {
      console.error("Exceção ao buscar instâncias:", err);
      setError(
        `Erro ao conectar com o servidor: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  // Criar nova instância
  const handleCreateInstance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    setError(null); // Limpar erros anteriores

    try {
      const formData = new FormData(e.currentTarget);
      const instanceName = formData.get("instanceName") as string;
      const number = formData.get("number") as string;

      console.log(`Tentando criar instância: ${instanceName}`);
      const response = await createInstance(formData);

      if (response.success) {
        toast({
          title: "Instância criada",
          description: "A instância foi criada com sucesso",
        });
        fetchInstances();
        // Limpar o formulário - adicionar verificação para evitar erro
        if (e.currentTarget) {
          e.currentTarget.reset();
        }
      } else {
        console.error("Erro ao criar instância:", response.error);
        setError(`Erro ao criar instância: ${response.error}`);
        toast({
          title: "Erro",
          description: response.error || "Erro ao criar instância",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Exceção ao criar instância:", err);
      setError(
        `Erro inesperado: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`
      );
      toast({
        title: "Erro",
        description: `Erro inesperado: ${error || JSON.stringify(err)}`,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Gerar QR Code
  const handleGenerateQrCode = async (instanceName: string) => {
    setSelectedInstance(instanceName);
    setLoadingQr(true);
    setQrCode(null); // Limpar QR code anterior
    setPairingCode(null); // Limpar código de pareamento anterior
    setError(null); // Limpar erros anteriores

    try {
      console.log(`Solicitando QR Code para instância: ${instanceName}`);
      const response = await getInstanceQrCode(instanceName);

      if (response.success && response.data) {
        console.log("QR Code obtido com sucesso");

        if (response.data.qrcode) {
          // Se temos um QR code base64, usamos ele
          setQrCode(response.data.qrcode);
        } else if (response.data.base64) {
          // Alguns servidores retornam o QR code como base64
          setQrCode(response.data.base64.replace("data:image/png;base64,", ""));
        }

        // Se temos um código de pareamento, salvamos ele também
        if (response.data.pairingCode) {
          setPairingCode(response.data.pairingCode);
        }

        // Abrir o modal com o QR code
        setQrDialogOpen(true);
      } else {
        console.error("Erro ao obter QR Code:", response.error);
        setError(`Erro ao obter QR Code: ${response.error}`);
        toast({
          title: "Erro",
          description: response.error || "Falha ao obter QR Code",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Exceção ao obter QR Code:", err);
      setError(
        `Erro ao conectar com o servidor: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`
      );
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLoadingQr(false);
    }
  };

  // Desconectar instância
  const handleDisconnect = async (instanceName: string) => {
    try {
      const response = await disconnectInstance(instanceName);

      if (response.success) {
        toast({
          title: "Instância desconectada",
          description: "A instância foi desconectada com sucesso",
        });
        fetchInstances();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao desconectar instância",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
      console.error(err);
    }
  };

  // Deletar instância
  const handleDelete = async (instance: Instance) => {
    // Usar instanceName como fallback se instanceId não estiver disponível
    const idToDelete = instance.instanceId || instance.instanceName;

    if (
      window.confirm(
        `Tem certeza que deseja deletar a instância ${instance.instanceName}?`
      )
    ) {
      try {
        setDeleting(instance.instanceName);
        console.log(`Deletando instância com ID: ${idToDelete}`);
        const response = await deleteInstance(idToDelete);

        if (response.success) {
          toast({
            title: "Instância deletada",
            description:
              response.message || "A instância foi deletada com sucesso",
          });
          fetchInstances();
        } else {
          // Tentar novamente com o nome da instância se o ID falhou
          if (idToDelete !== instance.instanceName) {
            console.log(
              `Tentando deletar usando o nome da instância: ${instance.instanceName}`
            );
            const retryResponse = await deleteInstance(instance.instanceName);

            if (retryResponse.success) {
              toast({
                title: "Instância deletada",
                description:
                  retryResponse.message ||
                  "A instância foi deletada com sucesso (usando nome)",
              });
              fetchInstances();
              setDeleting(null);
              return;
            }
          }

          toast({
            title: "Erro",
            description: response.error || "Erro ao deletar instância",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Erro",
          description: "Erro ao conectar com o servidor",
          variant: "destructive",
        });
        console.error(err);
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Criar Nova Instância</CardTitle>
          <CardDescription className="mt-1">
            Crie uma nova instância do WhatsApp para enviar mensagens.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateInstance}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName" className="text-base">
                Nome da Instância
              </Label>
              <Input
                id="instanceName"
                name="instanceName"
                placeholder="Ex: meu-whatsapp"
                className="h-11"
                required
              />
              <p className="text-sm text-muted-foreground">
                Use apenas letras minúsculas, números e hífens.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number" className="text-base">
                Número de Telefone
              </Label>
              <Input
                id="number"
                name="number"
                placeholder="Ex: 5511999999999"
                className="h-11"
                required
              />
              <p className="text-sm text-muted-foreground">
                Inclua o código do país e DDD, sem espaços ou caracteres
                especiais.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Instância
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instâncias Disponíveis</CardTitle>
              <CardDescription className="mt-1">
                Gerencie suas instâncias do WhatsApp.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchInstances}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Atualizar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              ))}
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma instância encontrada.</p>
              <p className="text-sm mt-1">
                Crie uma nova instância para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <div
                  key={instance.instanceName}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Smartphone className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{instance.instanceName}</p>
                      <p className="text-sm text-muted-foreground">
                        Status:{" "}
                        {instance.status === "connected"
                          ? "Conectado"
                          : "Desconectado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {instance.status === "connected" ? (
                      <Button
                        variant="outline"
                        onClick={() => handleDisconnect(instance.instanceName)}
                      >
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleGenerateQrCode(instance.instanceName)
                        }
                        disabled={
                          loadingQr &&
                          selectedInstance === instance.instanceName
                        }
                      >
                        {loadingQr &&
                        selectedInstance === instance.instanceName ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-4 w-4" />
                            Gerar QR Code
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(instance)}
                      disabled={deleting === instance.instanceName}
                    >
                      {deleting === instance.instanceName ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Deletar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para exibir o QR Code */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar Instância: {selectedInstance}</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-6 p-4">
            {loadingQr ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : qrCode ? (
              <div className="w-64 h-64 bg-white p-2">
                <Image
                  src={
                    qrCode.startsWith("data:")
                      ? qrCode
                      : `data:image/png;base64,${qrCode}`
                  }
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-muted flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  QR Code não disponível
                </p>
              </div>
            )}

            {pairingCode && (
              <div className="text-center">
                <p className="font-medium">Código de Pareamento:</p>
                <p className="text-xl font-bold tracking-wider mt-1">
                  {pairingCode}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use este código para parear seu dispositivo manualmente
                </p>
              </div>
            )}

            <p className="text-sm text-center max-w-md">
              Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos
              conectados &gt; Conectar um aparelho
            </p>
            <Button
              onClick={() => handleGenerateQrCode(selectedInstance!)}
              disabled={loadingQr}
            >
              {loadingQr ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Gerar Novo QR Code"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
