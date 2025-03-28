"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type MessageStatus = "pending" | "sending" | "success" | "error";

export type MessageLog = {
  id: string;
  recipient: string;
  status: MessageStatus;
  message: string;
  timestamp: string;
  error?: string;
};

interface SendProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: MessageLog[];
  total: number;
  completed: number;
  inProgress: boolean;
  allowClose: boolean;
}

export function SendProgressDialog({
  open,
  onOpenChange,
  logs,
  total,
  completed,
  inProgress,
  allowClose,
}: SendProgressDialogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novos logs são adicionados
  useEffect(() => {
    if (scrollRef.current && logs.length > 0) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [logs]);

  // Calcular a porcentagem de progresso
  const progressPercentage =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  // Contar sucessos e falhas
  const successCount = logs.filter((log) => log.status === "success").length;
  const failureCount = logs.filter((log) => log.status === "error").length;
  const pendingCount = logs.filter(
    (log) => log.status === "pending" || log.status === "sending"
  ).length;

  // Função para renderizar o ícone de status
  const renderStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case "success":
        return (
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
        );
      case "error":
        return <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
      case "sending":
        return (
          <RefreshCw className="h-4 w-4 text-blue-500 shrink-0 mt-0.5 animate-spin" />
        );
      case "pending":
        return (
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        );
      default:
        return (
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Só permite fechar se allowClose for true
        if (!newOpen && !allowClose) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Progresso do Envio</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">
              {inProgress ? (
                <span className="flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Enviando mensagens...
                </span>
              ) : (
                <span>Envio concluído</span>
              )}
            </div>
            <div className="text-sm font-medium">
              {completed} de {total} ({progressPercentage}%)
            </div>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          <div className="flex gap-2 mt-2">
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              {successCount} enviadas
            </Badge>
            {failureCount > 0 && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                {failureCount} falhas
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {pendingCount} pendentes
              </Badge>
            )}
          </div>
        </div>

        <div className="border rounded-md">
          <div className="bg-muted px-3 py-2 text-sm font-medium border-b">
            Log de envio
          </div>
          <ScrollArea className="h-[300px] w-full" ref={scrollRef}>
            <div className="p-3 space-y-2">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Aguardando início do envio...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-sm flex items-start gap-2">
                    {renderStatusIcon(log.status)}
                    <div>
                      <div className="font-medium">{log.recipient}</div>
                      <div className="text-muted-foreground">{log.message}</div>
                      {log.error && (
                        <div className="text-xs text-destructive mt-1">
                          {log.error}
                        </div>
                      )}
                      {log.timestamp && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.timestamp}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} disabled={!allowClose}>
            {inProgress ? "Enviando..." : "Fechar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
