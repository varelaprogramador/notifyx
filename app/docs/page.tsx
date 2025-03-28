"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code,
  FileText,
  HelpCircle,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <h1 className="text-2xl font-bold">NotifyX Documentação</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/landing">Voltar para o site</Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Sidebar de navegação */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Navegação</CardTitle>
              <CardDescription>Explore nossa documentação</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex items-center gap-2 p-3 text-left hover:bg-muted ${
                    activeTab === "overview" ? "bg-muted" : ""
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Visão Geral</span>
                </button>
                <button
                  onClick={() => setActiveTab("instances")}
                  className={`flex items-center gap-2 p-3 text-left hover:bg-muted ${
                    activeTab === "instances" ? "bg-muted" : ""
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Instâncias</span>
                </button>
                <button
                  onClick={() => setActiveTab("messages")}
                  className={`flex items-center gap-2 p-3 text-left hover:bg-muted ${
                    activeTab === "messages" ? "bg-muted" : ""
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Mensagens</span>
                </button>
                <button
                  onClick={() => setActiveTab("automations")}
                  className={`flex items-center gap-2 p-3 text-left hover:bg-muted ${
                    activeTab === "automations" ? "bg-muted" : ""
                  }`}
                >
                  <Zap className="h-5 w-5" />
                  <span>Automações</span>
                </button>
                <button
                  onClick={() => setActiveTab("scripts")}
                  className={`flex items-center gap-2 p-3 text-left hover:bg-muted ${
                    activeTab === "scripts" ? "bg-muted" : ""
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>Scripts</span>
                </button>
                <button
                  onClick={() => setActiveTab("webhooks")}
                  className={`flex items-center gap-2 p-3 text-left hover:bg-muted ${
                    activeTab === "webhooks" ? "bg-muted" : ""
                  }`}
                >
                  <Code className="h-5 w-5" />
                  <span>Webhooks</span>
                </button>
                <button
                  onClick={() => setActiveTab("faq")}
                  className={`flex items-center gap-2 p-3 text-left hover:bg-muted ${
                    activeTab === "faq" ? "bg-muted" : ""
                  }`}
                >
                  <HelpCircle className="h-5 w-5" />
                  <span>FAQ</span>
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-6">
              {activeTab === "overview" && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">
                    Visão Geral do NotifyX
                  </h2>
                  <p className="mb-4">
                    O NotifyX é uma plataforma completa para gerenciamento e
                    automação de mensagens via WhatsApp. Com o NotifyX, você
                    pode enviar mensagens em massa, criar automações baseadas em
                    eventos, gerenciar múltiplas instâncias do WhatsApp e muito
                    mais.
                  </p>

                  <h3 className="mb-2 mt-6 text-xl font-semibold">
                    Principais recursos
                  </h3>
                  <ul className="mb-4 list-inside list-disc space-y-2">
                    <li>Gerenciamento de múltiplas instâncias do WhatsApp</li>
                    <li>Envio de mensagens em massa para contatos e grupos</li>
                    <li>Automações baseadas em eventos via webhooks</li>
                    <li>Scripts de mensagem reutilizáveis</li>
                    <li>Suporte a mídia (imagens, vídeos, documentos)</li>
                    <li>Integração com sistemas externos via API</li>
                  </ul>

                  <h3 className="mb-2 mt-6 text-xl font-semibold">
                    Primeiros passos
                  </h3>
                  <ol className="mb-4 list-inside list-decimal space-y-2">
                    <li>Configure uma instância do WhatsApp</li>
                    <li>Conecte seu dispositivo escaneando o QR code</li>
                    <li>Comece a enviar mensagens ou configure automações</li>
                  </ol>

                  <div className="mt-6 rounded-lg bg-muted p-4">
                    <h4 className="mb-2 font-semibold">Dica</h4>
                    <p>
                      Recomendamos começar explorando a seção de Instâncias para
                      configurar sua primeira conexão com o WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "instances" && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">
                    Gerenciamento de Instâncias
                  </h2>
                  <p className="mb-4">
                    As instâncias são conexões individuais com o WhatsApp. Cada
                    instância representa um número de telefone diferente que
                    você pode usar para enviar e receber mensagens.
                  </p>

                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="create-instance">
                      <AccordionTrigger>
                        Como criar uma nova instância
                      </AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>Acesse o Dashboard do NotifyX</li>
                          <li>Clique no botão &quot;Nova Instância&quot;</li>
                          <li>Digite um nome para identificar sua instância</li>
                          <li>Clique em &quot;Criar&quot;</li>
                          <li>
                            Escaneie o QR code com seu WhatsApp para conectar
                          </li>
                        </ol>
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="text-sm">
                            <strong>Nota:</strong> Você pode criar múltiplas
                            instâncias para gerenciar diferentes números de
                            WhatsApp.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="connect-instance">
                      <AccordionTrigger>
                        Como conectar uma instância
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Para conectar uma instância ao WhatsApp:
                        </p>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>Selecione a instância que deseja conectar</li>
                          <li>Clique no botão &quot;Conectar&quot;</li>
                          <li>Um QR code será exibido na tela</li>
                          <li>Abra o WhatsApp no seu celular</li>
                          <li>
                            Vá em Configurações &gt; Dispositivos conectados
                            &gt; Conectar um dispositivo
                          </li>
                          <li>Escaneie o QR code exibido na tela</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="manage-instance">
                      <AccordionTrigger>
                        Gerenciando instâncias existentes
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Você pode realizar as seguintes ações em instâncias
                          existentes:
                        </p>
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            <strong>Reconectar:</strong> Gerar um novo QR code
                            para reconectar
                          </li>
                          <li>
                            <strong>Desconectar:</strong> Encerrar a sessão
                            atual do WhatsApp
                          </li>
                          <li>
                            <strong>Excluir:</strong> Remover permanentemente a
                            instância
                          </li>
                          <li>
                            <strong>Renomear:</strong> Alterar o nome da
                            instância
                          </li>
                        </ul>
                        <p className="mt-2">
                          Todas essas ações estão disponíveis no menu de opções
                          de cada instância no Dashboard.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {activeTab === "messages" && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">
                    Envio de Mensagens
                  </h2>
                  <p className="mb-4">
                    O NotifyX permite enviar mensagens individuais ou em massa
                    para contatos e grupos do WhatsApp. Você pode enviar texto,
                    imagens, vídeos e documentos.
                  </p>

                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="compose-message">
                      <AccordionTrigger>
                        Como compor uma mensagem
                      </AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>
                            Acesse a página &quot;Compor&quot; no menu principal
                          </li>
                          <li>
                            Selecione a instância que deseja usar para enviar
                          </li>
                          <li>
                            Adicione os destinatários (números de telefone com
                            código do país)
                          </li>
                          <li>Escreva sua mensagem no editor</li>
                          <li>
                            Adicione mídia se necessário (imagens, vídeos,
                            documentos)
                          </li>
                          <li>
                            Clique em &quot;Enviar&quot; para iniciar o envio
                          </li>
                        </ol>
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="text-sm">
                            <strong>Formato do número:</strong> Use o formato
                            internacional completo, incluindo o código do país,
                            sem espaços ou caracteres especiais. Exemplo:
                            5511999999999
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="bulk-messages">
                      <AccordionTrigger>Envio em massa</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">Para enviar mensagens em massa:</p>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>
                            Na página &quot;Compor&quot;, adicione múltiplos
                            números separados por linha
                          </li>
                          <li>
                            Ou importe uma lista de contatos de um arquivo CSV
                          </li>
                          <li>Escreva sua mensagem</li>
                          <li>
                            Configure o intervalo entre mensagens para evitar
                            bloqueios
                          </li>
                          <li>
                            Clique em &quot;Enviar&quot; para iniciar o envio em
                            massa
                          </li>
                        </ol>
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="text-sm">
                            <strong>Dica:</strong> Use um intervalo de pelo
                            menos 3-5 segundos entre mensagens para reduzir o
                            risco de bloqueio por spam.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="media-messages">
                      <AccordionTrigger>
                        Enviando mensagens com mídia
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          O NotifyX suporta o envio dos seguintes tipos de
                          mídia:
                        </p>
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            <strong>Imagens:</strong> JPG, PNG, GIF (estático)
                          </li>
                          <li>
                            <strong>Vídeos:</strong> MP4, 3GP
                          </li>
                          <li>
                            <strong>Áudio:</strong> MP3, OGG
                          </li>
                          <li>
                            <strong>Documentos:</strong> PDF, DOCX, XLSX, etc.
                          </li>
                        </ul>
                        <p className="mt-2">
                          Para adicionar mídia, clique no botão correspondente
                          ao tipo de mídia na barra de ferramentas do editor de
                          mensagens.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {activeTab === "automations" && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Automações</h2>
                  <p className="mb-4">
                    As automações permitem configurar respostas automáticas e
                    fluxos de mensagens baseados em eventos. Você pode criar
                    automações que são acionadas por webhooks de sistemas
                    externos.
                  </p>

                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="create-automation">
                      <AccordionTrigger>
                        Como criar uma automação
                      </AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>
                            Acesse a página &quot;Automações&quot; no menu
                            principal
                          </li>
                          <li>Clique no botão &quot;Nova Automação&quot;</li>
                          <li>Dê um nome descritivo para sua automação</li>
                          <li>
                            Selecione a instância que será usada para enviar as
                            mensagens
                          </li>
                          <li>Configure a mensagem que será enviada</li>
                          <li>Salve a automação</li>
                        </ol>
                        <p className="mt-2">
                          Após criar a automação, você receberá um URL de
                          webhook único que pode ser usado para acionar a
                          automação.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="trigger-automation">
                      <AccordionTrigger>
                        Como acionar uma automação
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Para acionar uma automação via webhook:
                        </p>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>Copie o URL do webhook da automação</li>
                          <li>
                            Envie uma requisição POST para este URL com os dados
                            necessários
                          </li>
                          <li>
                            A automação será executada e enviará a mensagem
                            configurada
                          </li>
                        </ol>
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="text-sm font-semibold">
                            Exemplo de payload JSON:
                          </p>
                          <pre className="mt-2 overflow-x-auto rounded bg-secondary p-2 text-xs text-secondary-foreground">
                            {`{
  "telefone": "5511999999999",
  "nome": "João Silva",
  "produto": "Curso de Marketing Digital",
  "valor": "R$ 997,00"
}`}
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="variables-automation">
                      <AccordionTrigger>
                        Usando variáveis nas automações
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Você pode usar variáveis dinâmicas nas suas mensagens
                          de automação. As variáveis são substituídas pelos
                          valores enviados no payload do webhook.
                        </p>
                        <p className="mb-2">Para usar variáveis:</p>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>
                            Adicione variáveis no formato{" "}
                            <code className="rounded bg-muted px-1">
                              {"{{nome_da_variavel}}"}
                            </code>{" "}
                            no texto da mensagem
                          </li>
                          <li>
                            Envie os valores correspondentes no payload do
                            webhook
                          </li>
                        </ol>
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="text-sm font-semibold">
                            Exemplo de mensagem com variáveis:
                          </p>
                          <pre className="mt-2 overflow-x-auto rounded bg-secondary p-2 text-xs text-secondary-foreground">
                            {`Olá {{nome}},

Obrigado por adquirir o {{produto}}!
Seu pagamento de {{valor}} foi confirmado.

Atenciosamente,
Equipe de Suporte`}
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {activeTab === "scripts" && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">
                    Scripts de Mensagem
                  </h2>
                  <p className="mb-4">
                    Scripts de mensagem são modelos pré-definidos que você pode
                    reutilizar ao enviar mensagens. Eles são úteis para
                    mensagens que você envia com frequência, como boas-vindas,
                    confirmações, etc.
                  </p>

                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="create-script">
                      <AccordionTrigger>Como criar um script</AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>
                            Acesse a página &quot;Scripts&quot;no menu principal
                          </li>
                          <li>Clique no botão &quot;Novo Script&quot;</li>
                          <li>Dê um nome descritivo para o script</li>
                          <li>Escreva o conteúdo do script no editor</li>
                          <li>
                            Adicione variáveis se necessário usando o formato{" "}
                            <code className="rounded bg-muted px-1">
                              {"{{nome_da_variavel}}"}
                            </code>
                          </li>
                          <li>Salve o script</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="use-script">
                      <AccordionTrigger>
                        Como usar scripts ao compor mensagens
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Para usar um script ao compor uma mensagem:
                        </p>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>
                            Na página &quot;Compor&quot;, clique no botão
                            &quot;Selecionar Script&quot;
                          </li>
                          <li>Escolha o script desejado da lista</li>
                          <li>
                            O conteúdo do script será inserido no editor de
                            mensagens
                          </li>
                          <li>Edite o conteúdo conforme necessário</li>
                          <li>Continue com o envio normalmente</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="manage-scripts">
                      <AccordionTrigger>Gerenciando scripts</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">Na página de Scripts, você pode:</p>
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            <strong>Editar:</strong> Modificar o conteúdo de
                            scripts existentes
                          </li>
                          <li>
                            <strong>Duplicar:</strong> Criar uma cópia de um
                            script existente
                          </li>
                          <li>
                            <strong>Excluir:</strong> Remover permanentemente um
                            script
                          </li>
                          <li>
                            <strong>Categorizar:</strong> Organizar scripts em
                            categorias para facilitar o acesso
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {activeTab === "webhooks" && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">
                    Webhooks e Integrações
                  </h2>
                  <p className="mb-4">
                    Os webhooks permitem que sistemas externos acionem
                    automações no NotifyX. Você pode integrar o NotifyX com
                    qualquer sistema que possa enviar requisições HTTP.
                  </p>

                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="webhook-format">
                      <AccordionTrigger>Formato dos webhooks</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Os webhooks do NotifyX aceitam requisições POST com
                          dados em formato JSON.
                        </p>
                        <p className="mb-2">Campos obrigatórios:</p>
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            <strong>telefone:</strong> Número do destinatário no
                            formato internacional (ex: 5511999999999)
                          </li>
                        </ul>
                        <p className="mb-2 mt-2">Campos opcionais:</p>
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            Quaisquer outros campos que você queira usar como
                            variáveis na mensagem
                          </li>
                        </ul>
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="text-sm font-semibold">
                            Exemplo de requisição:
                          </p>
                          <pre className="mt-2 overflow-x-auto rounded bg-secondary p-2 text-xs text-secondary-foreground">
                            {`POST /api/webhooks/abc123 HTTP/1.1
Host: app.notifyx.com
Content-Type: application/json

{
  "telefone": "5511999999999",
  "nome": "Maria Silva",
  "pedido": "12345",
  "status": "Aprovado"
}`}
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="test-webhook">
                      <AccordionTrigger>
                        Como testar um webhook
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Para testar um webhook de automação:
                        </p>
                        <ol className="list-inside list-decimal space-y-2">
                          <li>Acesse a página de detalhes da automação</li>
                          <li>Clique na aba &quot;Testar Webhook&quot;</li>
                          <li>Preencha os campos do formulário de teste</li>
                          <li>Clique em &quot;Enviar Teste&quot;</li>
                          <li>Verifique o resultado na seção de logs</li>
                        </ol>
                        <p className="mt-2">
                          Você também pode usar ferramentas como Postman,
                          Insomnia ou curl para testar seus webhooks.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="integration-examples">
                      <AccordionTrigger>
                        Exemplos de integrações
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          O NotifyX pode ser integrado com diversos sistemas,
                          como:
                        </p>
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            <strong>E-commerce:</strong> Enviar notificações de
                            pedidos, confirmações de pagamento
                          </li>
                          <li>
                            <strong>CRM:</strong> Notificar sobre novos leads,
                            atualizações de clientes
                          </li>
                          <li>
                            <strong>Sistemas de agendamento:</strong> Enviar
                            lembretes de consultas, confirmações
                          </li>
                          <li>
                            <strong>Plataformas de cursos:</strong> Notificar
                            sobre novas aulas, certificados
                          </li>
                          <li>
                            <strong>Sistemas de suporte:</strong> Alertar sobre
                            novos tickets, atualizações
                          </li>
                        </ul>
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="text-sm">
                            <strong>Dica:</strong> Use ferramentas como Zapier,
                            Make (Integromat) ou n8n para criar integrações sem
                            código.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {activeTab === "faq" && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">
                    Perguntas Frequentes
                  </h2>

                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="faq-1">
                      <AccordionTrigger>
                        Quantas instâncias posso criar?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          O número de instâncias que você pode criar depende do
                          seu plano de assinatura. O plano básico permite até 2
                          instâncias, o plano profissional até 5 instâncias, e o
                          plano empresarial oferece instâncias ilimitadas.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-2">
                      <AccordionTrigger>
                        É possível enviar mensagens para grupos?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          Sim, você pode enviar mensagens para grupos do
                          WhatsApp. Para isso, você precisa ter o ID do grupo,
                          que pode ser obtido através da API do WhatsApp. Na
                          página de composição, selecione a opção
                          &quot;Grupo&quot; ao adicionar destinatários.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-3">
                      <AccordionTrigger>
                        O NotifyX funciona com WhatsApp Business API?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          Não, o NotifyX utiliza a biblioteca Evolution API, que
                          é baseada no WhatsApp Web. Para usar o WhatsApp
                          Business API oficial, você precisaria de uma aprovação
                          da Meta e integração com um provedor oficial.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-4">
                      <AccordionTrigger>
                        Existe limite de mensagens que posso enviar?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          O WhatsApp impõe limites para evitar spam.
                          Recomendamos não enviar mais de 200 mensagens por dia
                          por número para evitar bloqueios. O NotifyX inclui
                          configurações de intervalo entre mensagens para ajudar
                          a respeitar esses limites.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-5">
                      <AccordionTrigger>
                        Como posso evitar que meu número seja bloqueado?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>Para reduzir o risco de bloqueio:</p>
                        <ul className="list-inside list-disc space-y-2">
                          <li>
                            Use um número de telefone que já tenha histórico de
                            uso no WhatsApp
                          </li>
                          <li>
                            Configure intervalos adequados entre mensagens
                            (mínimo de 3-5 segundos)
                          </li>
                          <li>
                            Evite enviar a mesma mensagem para muitos contatos
                          </li>
                          <li>
                            Personalize as mensagens com o nome do destinatário
                          </li>
                          <li>
                            Envie apenas para contatos que consentiram em
                            receber mensagens
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-6">
                      <AccordionTrigger>
                        O que acontece se meu celular ficar desconectado?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          Se o celular associado à instância ficar desconectado
                          da internet, o WhatsApp Web também perderá a conexão.
                          Nesse caso, as mensagens ficarão na fila até que a
                          conexão seja restabelecida ou até atingir o tempo
                          limite. Recomendamos manter o celular conectado à
                          internet e com bateria suficiente.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="mt-8 rounded-lg border p-6">
                    <h3 className="mb-4 text-xl font-semibold">
                      Precisa de mais ajuda?
                    </h3>
                    <p className="mb-4">
                      Se você não encontrou a resposta para sua pergunta, entre
                      em contato com nossa equipe de suporte.
                    </p>
                    <Button className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      <span>Contatar Suporte</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
        <p>© 2023 NotifyX. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
