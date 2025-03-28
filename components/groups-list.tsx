"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Plus,
  Search,
  Users,
  RefreshCw,
  UserCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listInstances, listContacts } from "@/app/actions/instance-actions";
import type { Contact, Instance } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
export default function GroupsList() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar instâncias
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await listInstances();
        if (response.success && response.data) {
          setInstances(response.data);

          // Selecionar a primeira instância conectada, se houver
          console.log("Todas as instâncias para grupos:", response.data);
          const connectedInstance = response.data.find(
            (inst) => inst.status === "connected"
          );
          console.log(
            "Instância conectada selecionada para grupos:",
            connectedInstance
          );
          if (connectedInstance) {
            setSelectedInstance(connectedInstance.instanceName);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar instâncias:", err);
      }
    };

    fetchInstances();
  }, []);

  // Carregar contatos quando uma instância é selecionada
  useEffect(() => {
    if (selectedInstance) {
      fetchContacts(selectedInstance);
    }
  }, [selectedInstance]);

  // Filtrar contatos quando o termo de busca muda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(term) ||
            contact.number.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, contacts]);

  const fetchContacts = async (instanceName: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        `Buscando contatos para exibição na lista de grupos: ${instanceName}`
      );
      const response = await listContacts(instanceName);

      if (response.success && response.data) {
        console.log(`Contatos recebidos: ${response.data.length}`);

        // Mesmo que a resposta seja bem-sucedida, verificamos se há contatos
        if (response.data.length === 0) {
          console.log("Nenhum contato recebido da API");
          setContacts([]);
          setFilteredContacts([]);
          // Definir uma mensagem informativa em vez de um erro
          setError(
            "Não foi possível carregar contatos. A API pode não suportar esta funcionalidade."
          );
        } else {
          setContacts(response.data);
          setFilteredContacts(response.data);
        }
      } else {
        console.error("Erro na resposta:", response.error);
        setError(response.error || "Erro ao carregar contatos");
      }
    } catch (err) {
      console.error("Erro ao carregar contatos:", err);
      setError(
        "Erro ao carregar contatos: " +
          (err instanceof Error ? err.message : JSON.stringify(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceChange = (value: string) => {
    setSelectedInstance(value);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    if (selectedInstance) {
      fetchContacts(selectedInstance);
    }
  };

  const formatPhoneNumber = (contact: Contact) => {
    // Se o número contém @, extrair apenas a parte antes do @
    if (contact.number && contact.number.includes("@")) {
      return contact.number.split("@")[0];
    }
    return contact.number;
  };

  // Função para verificar se um contato é um grupo (começa com 12036)
  const isGroup = (contact: Contact) => {
    return contact.number.startsWith("12036");
  };

  console.log(JSON.stringify(contacts));
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Grupos e Contatos</CardTitle>
            <CardDescription className="mt-1">
              Gerencie seus grupos e listas de contatos do WhatsApp.
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-full max-w-xs">
              <Select
                value={selectedInstance || ""}
                onValueChange={handleInstanceChange}
              >
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
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading || !selectedInstance}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Atualizar</span>
            </Button>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar grupos e contatos..."
              className="pl-10"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedInstance && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Selecione uma instância conectada para ver os contatos.</p>
          </div>
        )}

        {selectedInstance && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-3">Nome</TableHead>
                  <TableHead className="py-3">Tipo</TableHead>
                  <TableHead className="text-right py-3">
                    Número/Membros
                  </TableHead>
                  <TableHead className="w-[50px] py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {searchTerm
                        ? "Nenhum contato encontrado para esta busca."
                        : "Nenhum contato disponível."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium py-3">
                        <div className="flex items-center gap-3">
                          {contact.image ? (
                            <Image
                              src={contact.image || "/placeholder.svg"}
                              alt={contact.name}
                              className="h-8 w-8 rounded-full object-cover"
                              width={32}
                              height={32}
                              onError={() => {
                                console.error(
                                  "Failed to load image for",
                                  contact.name
                                );
                              }}
                            />
                          ) : (
                            <UserCircle className="h-8 w-8 text-muted-foreground" />
                          )}
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={isGroup(contact) ? "default" : "secondary"}
                          className="py-1"
                        >
                          {isGroup(contact) && (
                            <Users className="mr-1 h-3 w-3" />
                          )}
                          {isGroup(contact) ? "Grupo WhatsApp" : "Contato"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        {isGroup(contact)
                          ? `${contact.members || 0} membros`
                          : formatPhoneNumber(contact)}
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Enviar Mensagem</DropdownMenuItem>
                            {isGroup(contact) && (
                              <DropdownMenuItem>Ver Membros</DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
