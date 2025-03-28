/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// Importe a função de teste
import {
  testApiConnection,
  checkApiDocumentation,
  checkApiVersion,
} from "@/app/actions/test-connection";
import { EVOLUTION_API_URL } from "@/lib/config";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, KeyRound, User, Smartphone } from "lucide-react";
import Link from "next/link";
import InstanceManager from "@/components/instance-manager";

function TestConnectionButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkingDocs, setCheckingDocs] = useState(false);
  const [docsResult, setDocsResult] = useState<any>(null);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [versionResult, setVersionResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await testApiConnection();
      setResult(response);
    } catch (err) {
      setResult({
        success: false,
        error: `Erro inesperado: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDocs = async () => {
    setCheckingDocs(true);
    try {
      const response = await checkApiDocumentation();
      setDocsResult(response);
    } catch (err) {
      setDocsResult({
        success: false,
        error: `Erro inesperado: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
      });
    } finally {
      setCheckingDocs(false);
    }
  };

  const handleCheckVersion = async () => {
    setCheckingVersion(true);
    try {
      const response = await checkApiVersion();
      setVersionResult(response);
    } catch (err) {
      setVersionResult({
        success: false,
        error: `Erro inesperado: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
      });
    } finally {
      setCheckingVersion(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleTest}
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            "Testar Conexão"
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleCheckDocs}
          disabled={checkingDocs}
        >
          {checkingDocs ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Documentação"
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleCheckVersion}
          disabled={checkingVersion}
        >
          {checkingVersion ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Versão"
          )}
        </Button>
      </div>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <AlertTitle>
            {result.success ? "Conexão bem-sucedida" : "Erro de conexão"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {result.success ? (
              <p>A API está respondendo corretamente.</p>
            ) : (
              <div>
                <p>{result.error}</p>
                {result.status && (
                  <p className="mt-1">Status HTTP: {result.status}</p>
                )}
                {result.body && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">
                      Ver detalhes da resposta
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
                      {result.body}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {docsResult && (
        <Alert variant={docsResult.success ? "default" : "destructive"}>
          <AlertTitle>
            {docsResult.success
              ? "Documentação encontrada"
              : "Documentação não encontrada"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {docsResult.success ? (
              <div>
                <p>Endpoints de documentação disponíveis:</p>
                <ul className="list-disc pl-5 mt-2">
                  {docsResult.data.endpoints.map((endpoint: string) => (
                    <li key={endpoint}>
                      <a
                        href={`${EVOLUTION_API_URL}${endpoint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {endpoint}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>{docsResult.error}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {versionResult && (
        <Alert variant={versionResult.success ? "default" : "destructive"}>
          <AlertTitle>
            {versionResult.success
              ? "Versão da API"
              : "Erro ao verificar versão"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {versionResult.success ? (
              <p>Versão: {versionResult.data.version}</p>
            ) : (
              <p>{versionResult.error}</p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
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
      <main className="flex-1 container py-8 px-6">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>

          <InstanceManager />
        </div>
      </main>
    </div>
  );
}
