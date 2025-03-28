"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileText, RefreshCw, Check, Layers } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { messageScriptsService, type MessageScript } from "@/lib/message-scripts-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ScriptSelectorProps {
  onSelectScript: (script: MessageScript) => void
  buttonLabel?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
}

export default function ScriptSelector({
  onSelectScript,
  buttonLabel = "Selecionar Script",
  buttonVariant = "outline",
}: ScriptSelectorProps) {
  const [open, setOpen] = useState(false)
  const [scripts, setScripts] = useState<MessageScript[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)

  // Carregar scripts quando o diálogo for aberto
  useEffect(() => {
    if (open) {
      loadScripts()
    }
  }, [open])

  // Carregar scripts do serviço
  const loadScripts = async () => {
    setLoading(true)
    try {
      const allScripts = await messageScriptsService.getAllScripts()
      setScripts(allScripts)
    } catch (error) {
      console.error("Erro ao carregar scripts:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar scripts com base no termo de busca
  const filteredScripts = scripts.filter(
    (script) =>
      script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (script.description && script.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      script.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (script.tags && script.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))),
  )

  // Selecionar um script e fechar o diálogo
  const handleSelectScript = () => {
    if (selectedScriptId) {
      const script = scripts.find((s) => s.id === selectedScriptId)
      if (script) {
        onSelectScript(script)
        setOpen(false)
        setSelectedScriptId(null)
      }
    }
  }

  return (
    <>
      <Button variant={buttonVariant as any} onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Selecionar Script de Mensagem</DialogTitle>
            <DialogDescription>Escolha um script pré-pronto para usar em sua mensagem.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 my-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar scripts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={loadScripts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="sr-only">Atualizar</span>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 border rounded-md">
                  <div className="h-5 w-40 bg-muted rounded mb-2"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "Nenhum script encontrado" : "Nenhum script disponível"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? `Não encontramos scripts correspondentes a "${searchTerm}"`
                  : "Crie scripts de mensagem para reutilizar em suas comunicações."}
              </p>
              <Link href="/scripts">
                <Button variant="outline">Gerenciar Scripts</Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {filteredScripts.map((script) => (
                  <div
                    key={script.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      selectedScriptId === script.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedScriptId(script.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{script.name}</h4>
                        {script.messageBlocks && script.messageBlocks.length > 1 && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {script.messageBlocks.length} blocos
                          </Badge>
                        )}
                      </div>
                      {selectedScriptId === script.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    {script.description && <p className="text-sm text-muted-foreground mb-2">{script.description}</p>}

                    {script.messageBlocks && script.messageBlocks.length > 1 ? (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="preview">
                          <AccordionTrigger className="text-sm py-1">
                            Visualizar {script.messageBlocks.length} blocos de mensagem
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 mt-2">
                              {script.messageBlocks.map((block, index) => (
                                <div key={index} className="bg-muted/40 rounded-md p-2 text-sm">
                                  <div className="flex justify-between items-center mb-1 text-xs text-muted-foreground">
                                    <span>Bloco {index + 1}</span>
                                    {index < script.messageBlocks!.length - 1 && <span>Delay: {block.delay}s</span>}
                                  </div>
                                  <pre className="whitespace-pre-wrap font-sans text-xs">{block.content}</pre>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <div className="bg-muted/40 rounded-md p-2 text-sm max-h-24 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">{script.content}</pre>
                      </div>
                    )}

                    {script.tags && script.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {script.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSelectScript} disabled={!selectedScriptId}>
              Usar Script Selecionado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

