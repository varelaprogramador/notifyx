import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Verificar se há automações disponíveis
    const automations = db.getAutomations()
    const webhookAutomations = automations.filter((a) => a.type === "webhook" && a.active)

    return NextResponse.json({
      success: true,
      message: "API de teste de webhook funcionando",
      automationsCount: automations.length,
      webhookAutomationsCount: webhookAutomations.length,
      webhookAutomations: webhookAutomations.map((a) => ({
        id: a.id,
        name: a.name,
        path: a.config.path,
        instance: a.config.instance,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao testar webhook: ${error.message || "Erro desconhecido"}`,
      },
      { status: 500 },
    )
  }
}

