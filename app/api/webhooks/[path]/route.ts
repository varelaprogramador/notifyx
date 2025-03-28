import {
  addLogToAutomation,
  executeWebhookAutomation,
  getAutomationByPath,
} from "@/app/actions/automation-actions";
import { type NextRequest, NextResponse } from "next/server";

// Adicionar uma função de log mais detalhada
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data !== undefined) {
    if (typeof data === "object") {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  logWithTimestamp("===== WEBHOOK REQUEST INICIADO =====");
  logWithTimestamp(`Path: ${params.path}`);
  logWithTimestamp(`Method: ${request.method}`);
  logWithTimestamp(`Headers:`, Object.fromEntries(request.headers.entries()));

  try {
    const path = params.path;
    logWithTimestamp(`Processando webhook para o caminho: ${path}`);

    // Buscar a automação correspondente ao path
    logWithTimestamp(`Buscando automação para o path: ${path}`);
    const automation = await getAutomationByPath(path);

    // Verificar se a automação existe
    if (!automation) {
      logWithTimestamp(`Automação não encontrada para o caminho: ${path}`);
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      );
    }

    logWithTimestamp(`Automação encontrada:`, {
      id: automation.id,
      name: automation.name,
      type: automation.type,
      active: automation.active,
      config: automation.config,
    });

    // Obter o corpo da requisição
    let body;
    try {
      body = await request.json();
      logWithTimestamp(`Corpo da requisição recebido:`, body);
    } catch (error) {
      logWithTimestamp(
        `Erro ao processar o corpo da requisição: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );

      // Registrar o log de erro
      await addLogToAutomation(automation.id, {
        status: "error",
        message: `Erro ao processar o corpo da requisição: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
        payload: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
      });

      return NextResponse.json(
        { error: "Corpo da requisição inválido" },
        { status: 400 }
      );
    }

    // Verificar a chave secreta, se configurada
    const secretHeader = request.headers.get("x-webhook-secret");
    logWithTimestamp(
      `Verificando chave secreta. Header recebido: ${secretHeader || "nenhum"}`
    );

    if (automation.config.secret && secretHeader !== automation.config.secret) {
      logWithTimestamp(
        `Chave secreta inválida. Esperado: ${automation.config.secret}, Recebido: ${secretHeader}`
      );

      // Registrar o log de erro de autenticação
      await addLogToAutomation(automation.id, {
        status: "error",
        message: "Chave secreta inválida",
        payload: body,
      });

      return NextResponse.json(
        { error: "Chave secreta inválida" },
        { status: 401 }
      );
    }

    logWithTimestamp(
      `Validação de chave secreta: ${
        automation.config.secret ? "Sucesso" : "Não necessária"
      }`
    );

    // Verificar se o corpo contém o telefone
    if (!body.telefone) {
      logWithTimestamp(
        `Campo 'telefone' não encontrado no corpo da requisição`
      );

      // Registrar o log de erro de validação
      await addLogToAutomation(automation.id, {
        status: "error",
        message: "Campo 'telefone' não encontrado no corpo da requisição",
        payload: body,
      });

      return NextResponse.json(
        { error: "O campo 'telefone' é obrigatório" },
        { status: 400 }
      );
    }

    // Executar a automação com os blocos de mensagem
    logWithTimestamp(`Executando automação com blocos de mensagem`);
    const result = await executeWebhookAutomation(automation, body);

    if (result.success) {
      logWithTimestamp(`Automação executada com sucesso`);
      logWithTimestamp("===== WEBHOOK REQUEST CONCLUÍDO COM SUCESSO =====");

      return NextResponse.json(
        {
          success: true,
          message: result.message,
          details: result.details,
        },
        { status: 200 }
      );
    } else {
      logWithTimestamp(`Erro ao executar automação: ${result.message}`);
      logWithTimestamp("===== WEBHOOK REQUEST CONCLUÍDO COM ERRO =====");

      return NextResponse.json(
        {
          success: false,
          message: result.message,
          details: result.details,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logWithTimestamp(
      `Erro ao processar webhook: ${error.message || "Erro desconhecido"}`
    );
    logWithTimestamp(`Stack trace: ${error.stack || "Não disponível"}`);
    logWithTimestamp("===== WEBHOOK REQUEST CONCLUÍDO COM EXCEÇÃO =====");

    // Tentar registrar o log de erro, mesmo sem saber a automação específica
    try {
      const automation = await getAutomationByPath(params.path);
      if (automation) {
        await addLogToAutomation(automation.id, {
          status: "error",
          message: `Erro interno ao processar webhook: ${
            error.message || "Erro desconhecido"
          }`,
          payload: {
            path: params.path,
            error: error.message,
            stack: error.stack,
          },
        });
      }
    } catch (logError) {
      console.error("Erro ao registrar log de erro:", logError);
    }

    return NextResponse.json(
      {
        error: `Erro interno ao processar webhook: ${
          error.message || "Erro desconhecido"
        }`,
      },
      { status: 500 }
    );
  }
}

// Adicionar suporte para requisições OPTIONS (para CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
    },
  });
}
