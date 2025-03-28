import { evolutionApi } from "@/lib/evolution-api"

export async function checkApiVersion() {
  return await evolutionApi.checkApiVersion()
}

