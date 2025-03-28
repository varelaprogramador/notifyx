export const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || "https://evo.matratecnologia.com").replace(/\/$/, "")
export const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "jwZWHndXnnnIAejEjFsyjN8xMfIvgQxm"

// Tipos de instância disponíveis
export const INSTANCE_TYPES = ["whatsapp", "instagram", "telegram"] as const
export type InstanceType = (typeof INSTANCE_TYPES)[number]

