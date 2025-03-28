import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Users, BarChart3, Send, FileText } from "lucide-react"
import DashboardStats from "@/components/dashboard-stats"
import RecentMessages from "@/components/recent-messages"
import GroupsList from "@/components/groups-list"
import { Logo } from "@/components/logo"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4 px-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div className="flex items-center">
              <Logo width={200} height={42} />
            </div>
          </div>
          <nav className="flex items-center gap-5">
            <Link href="/scripts">
              <Button variant="ghost" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Scripts
              </Button>
            </Link>
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
            <Link href="/compose">
              <Button size="sm">
                <Send className="mr-2 h-4 w-4" />
                Nova Mensagem
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8 px-6">
        <div className="flex flex-col gap-8">
          <h2 className="text-3xl font-bold tracking-tight">Painel</h2>
          <DashboardStats />
          <Tabs defaultValue="groups">
            <TabsList className="mb-2">
              <TabsTrigger value="groups">
                <Users className="mr-2 h-4 w-4" />
                Grupos e Contatos
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Mensagens Recentes
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Análises
              </TabsTrigger>
            </TabsList>
            <TabsContent value="groups" className="mt-6">
              <GroupsList />
            </TabsContent>
            <TabsContent value="messages" className="mt-6">
              <RecentMessages />
            </TabsContent>
            <TabsContent value="analytics" className="mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Análise de Mensagens</CardTitle>
                  <CardDescription>
                    Visualize taxas de entrega e métricas de engajamento para suas mensagens.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground">Dados de análise aparecerão aqui</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

