import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"

const settingsRows = [
  {
    key: "Base path",
    value: import.meta.env.BASE_URL,
  },
  {
    key: "API URL",
    value: import.meta.env.VITE_API_URL || "Non configure",
  },
  {
    key: "Mode",
    value: import.meta.env.DEV ? "development" : "production",
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Parametres shell</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuration frontend</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {settingsRows.map((row) => (
              <div key={row.key} className="rounded-lg border bg-background/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.key}</dt>
                <dd className="mt-2 break-all font-mono text-sm">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
