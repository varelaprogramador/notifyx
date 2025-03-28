export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface WebhookLog {
  id: string
  timestamp: string
  status: "success" | "error" | "pending"
  message: string
  payload?: Json
  response?: Json
}

export interface Database {
  public: {
    Tables: {
      automations: {
        Row: {
          id: string
          name: string
          type: "webhook" | "api"
          active: boolean
          created_at: string
          updated_at: string
          config: Json
          logs: WebhookLog[] | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          type: "webhook" | "api"
          active?: boolean
          created_at?: string
          updated_at?: string
          config: Json
          logs?: WebhookLog[] | null
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: "webhook" | "api"
          active?: boolean
          created_at?: string
          updated_at?: string
          config?: Json
          logs?: WebhookLog[] | null
          user_id?: string
        }
      }
      instances: {
        Row: {
          id: string
          instance_name: string
          instance_id?: string
          token?: string
          status?: string
          qrcode?: string
          type: "whatsapp" | "instagram" | "telegram"
          created_at: string
          updated_at: string
          user_id: string
          config?: Json
        }
        Insert: {
          id?: string
          instance_name: string
          instance_id?: string
          token?: string
          status?: string
          qrcode?: string
          type: "whatsapp" | "instagram" | "telegram"
          created_at?: string
          updated_at?: string
          user_id: string
          config?: Json
        }
        Update: {
          id?: string
          instance_name?: string
          instance_id?: string
          token?: string
          status?: string
          qrcode?: string
          type?: "whatsapp" | "instagram" | "telegram"
          created_at?: string
          updated_at?: string
          user_id?: string
          config?: Json
        }
      }
      message_scripts: {
        Row: {
          id: string
          name: string
          description?: string
          content: string
          tags?: string[]
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          content: string
          tags?: string[]
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          content?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      automation_type: "webhook" | "api"
      instance_type: "whatsapp" | "instagram" | "telegram"
    }
  }
}

