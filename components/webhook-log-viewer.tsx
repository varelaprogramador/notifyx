import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, XCircle, Clock, AlertCircle } from "lucide-react"

export type WebhookLog = {
  id: string
  timestamp: string
  status: "success" | "error" | "pending"
  message: string
  payload?: any
  response?: any
}

interface WebhookLogViewerProps {
  logs: WebhookLog[]
  onRefresh?: () => void
}

export function WebhookLogViewer({ logs, onRefresh }: WebhookLogViewerProps) {
  // Renderizar status do log
  const renderLogStatus = (status: string) => {
    switch (status) {
      case "success":
        return <Check className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <ScrollArea className="h-[500px] w-full pr-4">
      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum log encontrado</p>
          <p className="text-sm mt-1">Os logs aparecerão aqui quando o webhook for acionado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {renderLogStatus(log.status)}
                  <span
                    className={`font-medium ${
                      log.status === "success"
                        ? "text-green-500"
                        : log.status === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {log.status === "success" ? "Sucesso" : log.status === "error" ? "Erro" : "Pendente"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
              </div>
              <p className="text-sm mb-3">{log.message}</p>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-xs font-medium mb-1">Payload</h4>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
                {log.response && (
                  <div>
                    <h4 className="text-xs font-medium mb-1">Resposta</h4>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  )
}

