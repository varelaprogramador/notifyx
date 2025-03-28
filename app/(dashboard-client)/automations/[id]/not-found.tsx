import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AutomationNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Automação não encontrada</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            A automação que você está procurando não existe ou foi removida.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/automations">
            <Button>Voltar para Automações</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
