import { useEffect, useState } from "react"

import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { Input } from "@ui-core/components/ui/input"
import { type EchoResponse, type PingResponse, starterApi } from "@/services/api"

export default function DevToolsPage() {
  const isDev = import.meta.env.DEV

  const [ping, setPing] = useState<PingResponse | null>(null)
  const [echo, setEcho] = useState<EchoResponse | null>(null)
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isDev) return

    starterApi
      .debugPing()
      .then(setPing)
      .catch((err: Error) => setError(err.message))
  }, [isDev])

  const submitEcho = async () => {
    if (!isDev) return

    setError(null)
    setLoading(true)
    try {
      const response = await starterApi.debugEcho(text)
      setEcho(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!isDev) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dev Tools</CardTitle>
          <CardDescription>Les endpoints debug sont desactives en production.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dev Tools</h1>

      <Card>
        <CardHeader>
          <CardTitle>Debug endpoints</CardTitle>
          <CardDescription>Utilise uniquement les endpoints dev-only exposes par le backend starter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-background/60 p-4 text-sm">
            <p>
              <strong>{ping?.message || "Ping en cours..."}</strong>
            </p>
            <p className="mt-1 text-muted-foreground">user_id: {ping?.user_id || "-"}</p>
            <p className="text-muted-foreground">user_email: {ping?.user_email || "-"}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Texte a renvoyer" />
            <Button type="button" onClick={submitEcho} disabled={!text || loading}>
              {loading ? "Envoi..." : "Tester /v1/starter/debug/echo"}
            </Button>
          </div>

          {echo ? (
            <div className="rounded-lg border bg-background/60 p-4 text-sm">
              echoed_text: <code>{echo.echoed_text}</code>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger">{error}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
