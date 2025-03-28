"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, CheckCircle } from "lucide-react"
import { listInstances, listContacts } from "@/app/actions/instance-actions"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardStats() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalContacts: 0,
    totalMessages: 0,
    deliveryRate: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        // Buscar instâncias
        const instancesResponse = await listInstances()

        if (instancesResponse.success && instancesResponse.data) {
          // Encontrar a primeira instância conectada
          const connectedInstance = instancesResponse.data.find((inst) => inst.status === "connected")
          console.log("Instâncias disponíveis para estatísticas:", instancesResponse.data)
          console.log("Instância conectada selecionada:", connectedInstance)

          if (connectedInstance) {
            // Buscar contatos da instância conectada
            const contactsResponse = await listContacts(connectedInstance.instanceName)

            if (contactsResponse.success && contactsResponse.data) {
              const contacts = contactsResponse.data

              // Calcular estatísticas
             const groups = contacts.filter((contact) => contact.number.startsWith("12036"));
const individualContacts = contacts.filter((contact) => !contact.number.startsWith("12036"));

              setStats({
                totalGroups: groups.length,
                totalContacts: individualContacts.length,
                // Esses dados não estão disponíveis na API, então mantemos valores fictícios por enquanto
                totalMessages: 0,
                deliveryRate: 0,
              })
            }
          } else {
            // Se não houver instância conectada, zerar as estatísticas
            setStats({
              totalGroups: 0,
              totalContacts: 0,
              totalMessages: 0,
              deliveryRate: 0,
            })
          }
        }
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total de Grupos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.totalGroups}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalGroups > 0 ? "Grupos disponíveis para mensagens" : "Nenhum grupo encontrado"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.totalContacts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalContacts > 0 ? "Contatos disponíveis para mensagens" : "Nenhum contato encontrado"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-</div>
          <p className="text-xs text-muted-foreground mt-1">Dados não disponíveis</p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-</div>
          <p className="text-xs text-muted-foreground mt-1">Dados não disponíveis</p>
        </CardContent>
      </Card>
    </div>
  )
}

