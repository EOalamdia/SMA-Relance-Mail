import { Link } from "react-router-dom"
import { ArrowRight, Layers3, Rocket, Shield } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Badge variant="gradient">Starter Frontend Shell</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Base applicative prete a reutiliser</h1>
        <p className="max-w-3xl text-muted-foreground">
          Ce shell fournit une navigation laterale, des sous-pages, une structure de modules et un socle UI aligne
          avec le Style-Guide du hub.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-primary" />
              Demarrage rapide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ajoute des pages metier dans `src/pages` puis les routes dans `src/App.tsx`.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers3 className="h-5 w-5 text-primary" />
              Modules clairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Organise chaque domaine dans `features/*` cote backend et une page frontend dediee.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Securite by default
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Les appels API conservent cookies + CSRF, et les endpoints debug restent dev-only.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Prochaine etape</CardTitle>
          <CardDescription>Configure le menu lateral et ajoute tes sous-pages metier.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/modules">
              Ouvrir la structure modules
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
