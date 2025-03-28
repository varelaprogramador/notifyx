import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { MessageSquare, Settings, Users, FileText } from "lucide-react"

export function MainNav() {
  return (
    <div className="flex items-center space-x-4 lg:space-x-6 mx-6">
      <Logo className="mr-4" />
      <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
        <Link href="/">
          <Users className="h-4 w-4 mr-2" />
          Contatos
        </Link>
      </Button>
      <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
        <Link href="/compose">
          <MessageSquare className="h-4 w-4 mr-2" />
          Enviar Mensagem
        </Link>
      </Button>
      <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
        <Link href="/automations">
          <FileText className="h-4 w-4 mr-2" />
          Automações
        </Link>
      </Button>
      <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
        <Link href="/scripts">
          <FileText className="h-4 w-4 mr-2" />
          Scripts
        </Link>
      </Button>
      <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
        <Link href="/settings">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Link>
      </Button>
    </div>
  )
}

