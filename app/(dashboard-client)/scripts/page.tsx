"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  PenToolIcon as Tool,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  messageScriptsService,
  type MessageScript,
  type MessageBlock,
} from "@/lib/message-scripts-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<MessageScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewScriptDialog, setShowNewScriptDialog] = useState(false);
  const [editingScript, setEditingScript] = useState<MessageScript | null>(
    null
  );
  const [scriptName, setScriptName] = useState("");
  const [scriptDescription, setScriptDescription] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [scriptTags, setScriptTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple");

  // Estado para gerenciar os blocos de mensagem
  const [messageBlocks, setMessageBlocks] = useState<MessageBlock[]>([
    { id: "1", content: "", delay: 2 },
  ]);

  const { toast } = useToast();

  // Carregar scripts ao iniciar
  useEffect(() => {
    loadScripts();
  }, []);

  // Carregar scripts do serviço
  const loadScripts = async () => {
    setLoading(true);
    try {
      const allScripts = await messageScriptsService.getAllScripts();
      setScripts(allScripts);
    } catch (error) {
      console.error("Erro ao carregar scripts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os scripts de mensagem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar scripts com base no termo de busca
  const filteredScripts = scripts.filter(
    (script) =>
      script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (script.description &&
        script.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      script.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (script.tags &&
        script.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  // Abrir diálogo para criar novo script
  const openNewScriptDialog = () => {
    setEditingScript(null);
    setScriptName("");
    setScriptDescription("");
    setScriptContent("");
    setScriptTags("");
    setMessageBlocks([{ id: "1", content: "", delay: 2 }]);
    setActiveTab("simple");
    setShowNewScriptDialog(true);
  };

  // Abrir diálogo para editar script existente
  const openEditScriptDialog = (script: MessageScript) => {
    setEditingScript(script);
    setScriptName(script.name);
    setScriptDescription(script.description || "");
    setScriptContent(script.content);
    setScriptTags(script.tags ? script.tags.join(", ") : "");

    // Verificar se o script tem blocos de mensagem
    if (script.messageBlocks && script.messageBlocks.length > 0) {
      setMessageBlocks(script.messageBlocks);
      setActiveTab("advanced");
    } else {
      // Se não tiver, criar um bloco com o conteúdo principal
      setMessageBlocks([{ id: "1", content: script.content, delay: 0 }]);
      setActiveTab("simple");
    }

    setShowNewScriptDialog(true);
  };

  // Adicionar um novo bloco de mensagem
  const addMessageBlock = () => {
    setMessageBlocks((prev) => [
      ...prev,
      { id: Date.now().toString(), content: "", delay: 2 },
    ]);
  };

  // Remover um bloco de mensagem
  const removeMessageBlock = (id: string) => {
    if (messageBlocks.length <= 1) return;
    setMessageBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  // Atualizar o conteúdo de um bloco de mensagem
  const updateMessageBlockContent = (id: string, content: string) => {
    setMessageBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, content } : block))
    );
  };

  // Atualizar o delay de um bloco de mensagem
  const updateMessageBlockDelay = (id: string, delay: number) => {
    setMessageBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, delay } : block))
    );
  };

  // Salvar script (novo ou editado)
  const handleSaveScript = async () => {
    if (!scriptName) {
      toast({
        title: "Erro",
        description: "Nome do script é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há conteúdo no modo simples ou avançado
    if (activeTab === "simple" && !scriptContent) {
      toast({
        title: "Erro",
        description: "Conteúdo do script é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (
      activeTab === "advanced" &&
      !messageBlocks.some((block) => block.content.trim())
    ) {
      toast({
        title: "Erro",
        description: "Pelo menos um bloco de mensagem deve ter conteúdo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Processar tags
      const tags = scriptTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Determinar o conteúdo principal e os blocos de mensagem
      const mainContent =
        activeTab === "simple"
          ? scriptContent
          : messageBlocks[0]?.content || "";

      const blocksToSave =
        activeTab === "advanced"
          ? messageBlocks
          : [{ id: "1", content: scriptContent, delay: 0 }];

      if (editingScript) {
        // Atualizar script existente
        const updatedScript = await messageScriptsService.updateScript(
          editingScript.id,
          {
            name: scriptName,
            description: scriptDescription || undefined,
            content: mainContent,
            messageBlocks: activeTab === "advanced" ? blocksToSave : undefined,
            tags: tags.length > 0 ? tags : undefined,
          }
        );

        if (updatedScript) {
          toast({
            title: "Script atualizado",
            description: "O script foi atualizado com sucesso",
          });
          await loadScripts();
        } else {
          throw new Error("Não foi possível atualizar o script");
        }
      } else {
        // Criar novo script
        const newScript = await messageScriptsService.addScript({
          name: scriptName,
          description: scriptDescription || undefined,
          content: mainContent,
          messageBlocks: activeTab === "advanced" ? blocksToSave : undefined,
          tags: tags.length > 0 ? tags : undefined,
          userId: "current-user", // Substituir pelo ID real do usuário quando implementar autenticação
        });

        toast({
          title: "Script criado",
          description: "O script foi criado com sucesso",
        });
        await loadScripts();
      }

      setShowNewScriptDialog(false);
    } catch (error: any) {
      console.error("Erro ao salvar script:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar script: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Excluir script
  const handleDeleteScript = async (script: MessageScript) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o script "${script.name}"?`
      )
    ) {
      try {
        const success = await messageScriptsService.deleteScript(script.id);

        if (success) {
          toast({
            title: "Script excluído",
            description: "O script foi excluído com sucesso",
          });
          await loadScripts();
        } else {
          throw new Error("Não foi possível excluir o script");
        }
      } catch (error: any) {
        console.error("Erro ao excluir script:", error);
        toast({
          title: "Erro",
          description: `Erro ao excluir script: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    // <div className="flex min-h-screen flex-col">
    //   <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    //     <div className="container flex h-16 items-center justify-between py-4 px-6">
    //       <Link
    //         href="/dashboard"
    //         className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
    //       >
    //         <ArrowLeft className="h-4 w-4" />
    //         Voltar ao Painel
    //       </Link>
    //       <nav className="flex items-center gap-4">
    //         <Link href="/compose">
    //           <Button variant="ghost" size="sm">
    //             Nova Mensagem
    //           </Button>
    //         </Link>
    //         <Link href="/automations">
    //           <Button variant="ghost" size="sm">
    //             Automações
    //           </Button>
    //         </Link>
    //       </nav>
    //     </div>
    //   </header>
    //   <main className="flex-1 container py-8 px-6">
    //     <div className="flex flex-col gap-8 max-w-4xl mx-auto">
    //       <div className="flex items-center justify-between">
    //         <h2 className="text-3xl font-bold tracking-tight">
    //           Scripts de Mensagem
    //         </h2>
    //         <Button onClick={openNewScriptDialog}>
    //           <Plus className="mr-2 h-4 w-4" />
    //           Novo Script
    //         </Button>
    //       </div>

    //       <div className="flex items-center gap-4">
    //         <div className="relative flex-1">
    //           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    //           <Input
    //             type="search"
    //             placeholder="Buscar scripts..."
    //             className="pl-10"
    //             value={searchTerm}
    //             onChange={(e) => setSearchTerm(e.target.value)}
    //           />
    //         </div>
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={loadScripts}
    //           disabled={loading}
    //         >
    //           <RefreshCw
    //             className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
    //           />
    //           <span className="sr-only">Atualizar</span>
    //         </Button>
    //       </div>

    //       {loading ? (
    //         <div className="space-y-4">
    //           {[1, 2, 3].map((i) => (
    //             <Card key={i} className="animate-pulse">
    //               <CardHeader className="pb-3">
    //                 <div className="h-6 w-48 bg-muted rounded"></div>
    //                 <div className="h-4 w-32 bg-muted rounded mt-2"></div>
    //               </CardHeader>
    //               <CardContent>
    //                 <div className="h-20 bg-muted rounded"></div>
    //               </CardContent>
    //             </Card>
    //           ))}
    //         </div>
    //       ) : filteredScripts.length === 0 ? (
    //         <Card>
    //           <CardContent className="flex flex-col items-center justify-center py-12 text-center">
    //             <div className="rounded-full bg-muted p-4 mb-4">
    //               <FileText className="h-8 w-8 text-muted-foreground" />
    //             </div>
    //             <h3 className="text-lg font-medium mb-2">
    //               {searchTerm
    //                 ? "Nenhum script encontrado"
    //                 : "Nenhum script de mensagem"}
    //             </h3>
    //             <p className="text-muted-foreground mb-6">
    //               {searchTerm
    //                 ? `Não encontramos scripts correspondentes a "${searchTerm}"`
    //                 : "Crie scripts de mensagem para reutilizar em suas comunicações."}
    //             </p>
    //             {!searchTerm && (
    //               <Button onClick={openNewScriptDialog}>
    //                 <Plus className="mr-2 h-4 w-4" />
    //                 Criar Primeiro Script
    //               </Button>
    //             )}
    //           </CardContent>
    //         </Card>
    //       ) : (
    //         <div className="grid gap-4 md:grid-cols-2">
    //           {filteredScripts.map((script) => (
    //             <Card key={script.id} className="overflow-hidden">
    //               <CardHeader className="pb-3">
    //                 <div className="flex items-center justify-between">
    //                   <CardTitle className="truncate">{script.name}</CardTitle>
    //                   <DropdownMenu>
    //                     <DropdownMenuTrigger asChild>
    //                       <Button
    //                         variant="ghost"
    //                         size="icon"
    //                         className="h-8 w-8"
    //                       >
    //                         <svg
    //                           xmlns="http://www.w3.org/2000/svg"
    //                           width="24"
    //                           height="24"
    //                           viewBox="0 0 24 24"
    //                           fill="none"
    //                           stroke="currentColor"
    //                           strokeWidth="2"
    //                           strokeLinecap="round"
    //                           strokeLinejoin="round"
    //                           className="h-4 w-4"
    //                         >
    //                           <circle cx="12" cy="12" r="1" />
    //                           <circle cx="19" cy="12" r="1" />
    //                           <circle cx="5" cy="12" r="1" />
    //                         </svg>
    //                       </Button>
    //                     </DropdownMenuTrigger>
    //                     <DropdownMenuContent align="end">
    //                       <DropdownMenuItem
    //                         onClick={() => openEditScriptDialog(script)}
    //                       >
    //                         <Edit className="mr-2 h-4 w-4" />
    //                         Editar
    //                       </DropdownMenuItem>
    //                       <DropdownMenuItem
    //                         className="text-destructive focus:text-destructive"
    //                         onClick={() => handleDeleteScript(script)}
    //                       >
    //                         <Trash2 className="mr-2 h-4 w-4" />
    //                         Excluir
    //                       </DropdownMenuItem>
    //                     </DropdownMenuContent>
    //                   </DropdownMenu>
    //                 </div>
    //                 {script.description && (
    //                   <CardDescription className="mt-1 line-clamp-2">
    //                     {script.description}
    //                   </CardDescription>
    //                 )}
    //               </CardHeader>
    //               <CardContent>
    //                 <div className="bg-muted/40 rounded-md p-3 text-sm max-h-32 overflow-y-auto">
    //                   {script.messageBlocks &&
    //                   script.messageBlocks.length > 1 ? (
    //                     <div className="space-y-2">
    //                       <div className="flex items-center gap-2">
    //                         <Badge variant="outline" className="text-xs">
    //                           {script.messageBlocks.length} blocos de mensagem
    //                         </Badge>
    //                       </div>
    //                       <pre className="whitespace-pre-wrap font-sans line-clamp-3">
    //                         {script.messageBlocks[0].content}
    //                         {script.messageBlocks.length > 1 && "..."}
    //                       </pre>
    //                     </div>
    //                   ) : (
    //                     <pre className="whitespace-pre-wrap font-sans">
    //                       {script.content}
    //                     </pre>
    //                   )}
    //                 </div>
    //                 {script.tags && script.tags.length > 0 && (
    //                   <div className="flex flex-wrap gap-2 mt-3">
    //                     {script.tags.map((tag) => (
    //                       <Badge
    //                         key={tag}
    //                         variant="outline"
    //                         className="flex items-center gap-1"
    //                       >
    //                         <Tag className="h-3 w-3" />
    //                         {tag}
    //                       </Badge>
    //                     ))}
    //                   </div>
    //                 )}
    //               </CardContent>
    //               <CardFooter className="flex justify-between py-3 text-xs text-muted-foreground">
    //                 <span>
    //                   Criado em{" "}
    //                   {new Date(script.createdAt).toLocaleDateString()}
    //                 </span>
    //                 <Button
    //                   variant="ghost"
    //                   size="sm"
    //                   className="h-8 px-2 text-xs"
    //                   onClick={() => openEditScriptDialog(script)}
    //                 >
    //                   <Edit className="mr-1 h-3 w-3" />
    //                   Editar
    //                 </Button>
    //               </CardFooter>
    //             </Card>
    //           ))}
    //         </div>
    //       )}
    //     </div>
    //   </main>

    //   {/* Diálogo para criar/editar script */}
    //   <Dialog open={showNewScriptDialog} onOpenChange={setShowNewScriptDialog}>
    //     <DialogContent className="sm:max-w-md md:max-w-2xl">
    //       <DialogHeader>
    //         <DialogTitle>
    //           {editingScript ? "Editar Script" : "Novo Script de Mensagem"}
    //         </DialogTitle>
    //         <DialogDescription>
    //           {editingScript
    //             ? "Edite os detalhes do script de mensagem."
    //             : "Crie um novo script de mensagem para reutilizar em suas comunicações."}
    //         </DialogDescription>
    //       </DialogHeader>
    //       <div className="grid gap-4 py-4">
    //         <div className="grid gap-2">
    //           <Label htmlFor="script-name">Nome</Label>
    //           <Input
    //             id="script-name"
    //             value={scriptName}
    //             onChange={(e) => setScriptName(e.target.value)}
    //             placeholder="Ex: Confirmação de Pedido"
    //           />
    //         </div>
    //         <div className="grid gap-2">
    //           <Label htmlFor="script-description">Descrição (opcional)</Label>
    //           <Input
    //             id="script-description"
    //             value={scriptDescription}
    //             onChange={(e) => setScriptDescription(e.target.value)}
    //             placeholder="Ex: Mensagem enviada após confirmação de pagamento"
    //           />
    //         </div>

    //         <Tabs
    //           value={activeTab}
    //           onValueChange={(value) =>
    //             setActiveTab(value as "simple" | "advanced")
    //           }
    //         >
    //           <TabsList className="grid grid-cols-2 mb-2">
    //             <TabsTrigger value="simple">Mensagem Simples</TabsTrigger>
    //             <TabsTrigger value="advanced">Múltiplos Blocos</TabsTrigger>
    //           </TabsList>

    //           <TabsContent value="simple" className="space-y-4 mt-2">
    //             <div className="grid gap-2">
    //               <Label htmlFor="script-content">Conteúdo do Script</Label>
    //               <Textarea
    //                 id="script-content"
    //                 value={scriptContent}
    //                 onChange={(e) => setScriptContent(e.target.value)}
    //                 placeholder="Olá {{nome}}, recebemos seu pedido #{{pedido_id}}!"
    //                 className="min-h-[150px]"
    //               />
    //               <p className="text-xs text-muted-foreground">
    //                 Use {"{{variavel}}"} para inserir dados dinâmicos como nome,
    //                 pedido, etc.
    //               </p>
    //             </div>
    //           </TabsContent>

    //           <TabsContent value="advanced" className="space-y-4 mt-2">
    //             <div className="space-y-3">
    //               <div className="flex justify-between items-center">
    //                 <Label className="text-base">Blocos de Mensagem</Label>
    //                 <Button
    //                   variant="outline"
    //                   size="sm"
    //                   onClick={addMessageBlock}
    //                 >
    //                   <PlusCircle className="mr-2 h-4 w-4" />
    //                   Adicionar Bloco
    //                 </Button>
    //               </div>

    //               <ScrollArea className="h-[350px] pr-4">
    //                 <div className="space-y-4">
    //                   {messageBlocks.map((block, index) => (
    //                     <div
    //                       key={block.id}
    //                       className="border rounded-md p-4 space-y-3"
    //                     >
    //                       <div className="flex justify-between items-center">
    //                         <h4 className="font-medium">
    //                           Mensagem {index + 1}
    //                         </h4>
    //                         {messageBlocks.length > 1 && (
    //                           <Button
    //                             variant="ghost"
    //                             size="sm"
    //                             onClick={() => removeMessageBlock(block.id)}
    //                             className="h-8 w-8 p-0"
    //                           >
    //                             <Trash2 className="h-4 w-4 text-destructive" />
    //                           </Button>
    //                         )}
    //                       </div>

    //                       <Textarea
    //                         value={block.content}
    //                         onChange={(e) =>
    //                           updateMessageBlockContent(
    //                             block.id,
    //                             e.target.value
    //                           )
    //                         }
    //                         className="min-h-[100px]"
    //                         placeholder={`Olá {{nome}}, recebemos seu pedido #{{pedido_id}}!`}
    //                       />

    //                       {index < messageBlocks.length - 1 && (
    //                         <div className="flex items-center gap-2">
    //                           <Label
    //                             htmlFor={`delay-${block.id}`}
    //                             className="whitespace-nowrap"
    //                           >
    //                             Delay após esta mensagem:
    //                           </Label>
    //                           <Input
    //                             id={`delay-${block.id}`}
    //                             type="number"
    //                             min="0"
    //                             value={block.delay}
    //                             onChange={(e) =>
    //                               updateMessageBlockDelay(
    //                                 block.id,
    //                                 Number.parseInt(e.target.value) || 0
    //                               )
    //                             }
    //                             className="w-20"
    //                           />
    //                           <span className="text-sm text-muted-foreground">
    //                             segundos
    //                           </span>
    //                         </div>
    //                       )}
    //                     </div>
    //                   ))}
    //                 </div>
    //               </ScrollArea>

    //               <p className="text-xs text-muted-foreground">
    //                 Use {"{{variavel}}"} para inserir dados dinâmicos. Configure
    //                 o delay entre mensagens.
    //               </p>
    //             </div>
    //           </TabsContent>
    //         </Tabs>

    //         <div className="grid gap-2">
    //           <Label htmlFor="script-tags">Tags (opcional)</Label>
    //           <Input
    //             id="script-tags"
    //             value={scriptTags}
    //             onChange={(e) => setScriptTags(e.target.value)}
    //             placeholder="pedido, confirmação, pagamento"
    //           />
    //           <p className="text-xs text-muted-foreground">
    //             Separe as tags por vírgulas.
    //           </p>
    //         </div>
    //       </div>
    //       <DialogFooter>
    //         <Button
    //           variant="outline"
    //           onClick={() => setShowNewScriptDialog(false)}
    //         >
    //           Cancelar
    //         </Button>
    //         <Button onClick={handleSaveScript} disabled={saving}>
    //           {saving ? (
    //             <>
    //               <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
    //               Salvando...
    //             </>
    //           ) : (
    //             <>
    //               <Save className="mr-2 h-4 w-4" />
    //               {editingScript ? "Atualizar" : "Salvar"}
    //             </>
    //           )}
    //         </Button>
    //       </DialogFooter>
    //     </DialogContent>
    //   </Dialog>
    // </div>
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
            <Link href="/compose">
              <Button variant="ghost" size="sm">
                Nova Mensagem
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

      <main className="flex-1 container py-12 px-6">
        <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
          <div className="bg-amber-100 dark:bg-amber-950/30 p-3 rounded-full mb-6">
            <Tool className="h-12 w-12 text-amber-600 dark:text-amber-500" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Funcionalidade em Manutenção
          </h1>

          <p className="text-xl text-muted-foreground mb-8">
            Estamos realizando melhorias para oferecer uma experiência ainda
            melhor.
          </p>

          <div className="grid gap-6 md:grid-cols-2 w-full mb-8">
            <div className="bg-card rounded-lg border p-6 flex flex-col items-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tempo Estimado</h3>
              <p className="text-muted-foreground text-center">
                Nossa equipe está trabalhando para restaurar o serviço o mais
                rápido possível. Agradecemos a compreensão.
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6 flex flex-col items-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                O que está acontecendo?
              </h3>
              <p className="text-muted-foreground text-center">
                Estamos atualizando nossos servidores e implementando novas
                funcionalidades para melhorar a performance e segurança.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">Voltar ao Painel</Link>
            </Button>
          </div>

          <div className="mt-12 p-4 bg-muted rounded-lg max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground">
              Se precisar de assistência imediata, entre em contato com nosso
              suporte pelo email{" "}
              <a
                href="mailto:suporte@notify.com"
                className="text-primary hover:underline"
              >
                suporte@notify.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16 px-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Notify. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Termos
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
