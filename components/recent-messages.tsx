"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listInstances } from "@/app/actions/instance-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RecentMessages() {
  const [loading, setLoading] = useState(true)
  const [instances, setInstances] = useState<any[]>([])
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInstances() {
      setLoading(true)
      try {
        const response = await listInstances()

        if (response.success && response.data) {
          setInstances(response.data)

          // Selecionar a primeira instância conectada, se houver
          console.log("Todas as instâncias para mensagens recentes:", response.data)
          const connectedInstance = response.data.find((inst) => inst.status === "connected")
          console.log("Instância conectada selecionada para mensagens:", connectedInstance)
          if (connectedInstance) {
            setSelectedInstance(connectedInstance.instanceName)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar instâncias:", err)
        setError("Erro ao carregar instâncias")
      } finally {
        setLoading(false)
      }
    }

    fetchInstances()
  }, [])

  const handleInstanceChange = (value: string) => {
    setSelectedInstance(value)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mensagens Recentes</CardTitle>
            <CardDescription className="mt-1">Visualize suas mensagens WhatsApp enviadas recentemente.</CardDescription>
          </div>
          <div className="w-64">
            <Select value={selectedInstance || ""} onValueChange={handleInstanceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent>
                {instances.map((instance) => (
                  <SelectItem
                    key={instance.instanceName}
                    value={instance.instanceName}
                    disabled={instance.status !== "connected"}
                  >
                    {instance.instanceName}
                    {instance.status !== "connected" && " (desconectado)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-3">Conteúdo</TableHead>
                  <TableHead className="py-3">Destinatários</TableHead>
                  <TableHead className="py-3">Enviado</TableHead>
                  <TableHead className="py-3">Status</TableHead>
                  <TableHead className="w-[50px] py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedInstance ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p>Selecione uma instância conectada para ver as mensagens.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p>O histórico de mensagens não está disponível na API.</p>
                        <p className="text-sm mt-1">Esta funcionalidade será implementada em breve.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

