import { BookOpenCheck, Database, ShieldCheck } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

const modules = [
  {
    title: "Auth & Session",
    description: "Branche le contexte utilisateur ForwardAuth et gere les actions logout/hub return.",
    icon: ShieldCheck,
  },
  {
    title: "Data Access",
    description: "Centralise les clients API et adapters Supabase dans des services dedies.",
    icon: Database,
  },
  {
    title: "Use Cases",
    description: "Expose des ecrans metier independants, relies au menu lateral par sections.",
    icon: BookOpenCheck,
  },
]

export default function ModulesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="outline-brand">Architecture</Badge>
        <h1 className="text-2xl font-bold tracking-tight">Structure frontend standard</h1>
        <p className="text-muted-foreground">Chaque nouvelle app peut reprendre cette base sans repartir de zero.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Card key={module.title}>
              <CardHeader className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Personnalise ce bloc pour ton domaine metier.</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
