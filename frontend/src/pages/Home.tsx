import { Link } from "react-router-dom"
import { ArrowRight, BarChart3, Bell, GraduationCap } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Badge variant="gradient">SMA – Système de Management Automatique</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des relances de formations</h1>
        <p className="max-w-3xl text-muted-foreground">
          Pilotez les échéances de formation de vos organismes, configurez les règles de relance,
          et suivez l'envoi automatique des notifications par e-mail.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tableau de bord
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Vue synthétique des échéances, retards et relances en attente.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
              Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Gérez le catalogue, les applicabilités et les sessions de formation.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Relances automatiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configurez les règles, modèles et suivez les envois d'e-mails.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Commencer</CardTitle>
          <CardDescription>Accédez au tableau de bord pour une vue d'ensemble de vos échéances.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dashboard">
              Ouvrir le tableau de bord
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
