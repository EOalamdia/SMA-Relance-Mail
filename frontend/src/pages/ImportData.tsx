import { useState } from "react"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { ImportResult } from "../types/sma"
import { importApi } from "../services/api"

export default function ImportDataPage() {
  const [orgFile, setOrgFile] = useState<File | null>(null)
  const [sessFile, setSessFile] = useState<File | null>(null)
  const [importingOrg, setImportingOrg] = useState(false)
  const [importingSess, setImportingSess] = useState(false)
  const [orgResult, setOrgResult] = useState<ImportResult | null>(null)
  const [sessResult, setSessResult] = useState<ImportResult | null>(null)
  const [orgError, setOrgError] = useState<string | null>(null)
  const [sessError, setSessError] = useState<string | null>(null)

  async function handleImportOrgs() {
    if (!orgFile) return
    setImportingOrg(true); setOrgError(null); setOrgResult(null)
    try { const r = await importApi.organizations(orgFile); setOrgResult(r) }
    catch (e) { setOrgError(e instanceof Error ? e.message : "Erreur") }
    finally { setImportingOrg(false) }
  }

  async function handleImportSessions() {
    if (!sessFile) return
    setImportingSess(true); setSessError(null); setSessResult(null)
    try { const r = await importApi.sessions(sessFile); setSessResult(r) }
    catch (e) { setSessError(e instanceof Error ? e.message : "Erreur") }
    finally { setImportingSess(false) }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Import</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" /> Import de données CSV
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Importez vos organismes et sessions de formation depuis des fichiers CSV. Les doublons sont ignorés automatiquement.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organizations import */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Import Organismes
            </CardTitle>
            <CardDescription>
              Colonnes attendues : <code className="bg-muted px-1 py-0.5 rounded text-xs">name, type_name, address, phone, email</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input type="file" accept=".csv" onChange={e => { setOrgFile(e.target.files?.[0] ?? null); setOrgResult(null); setOrgError(null) }}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90" />
            <Button onClick={handleImportOrgs} disabled={!orgFile || importingOrg}>
              {importingOrg ? "Import…" : "Importer"}
            </Button>
            {orgResult && <ResultCard result={orgResult} />}
            {orgError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{orgError}</p>}
          </CardContent>
        </Card>

        {/* Sessions import */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Import Sessions
            </CardTitle>
            <CardDescription>
              Colonnes attendues : <code className="bg-muted px-1 py-0.5 rounded text-xs">organization_name, course_code, session_date, provider</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input type="file" accept=".csv" onChange={e => { setSessFile(e.target.files?.[0] ?? null); setSessResult(null); setSessError(null) }}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90" />
            <Button onClick={handleImportSessions} disabled={!sessFile || importingSess}>
              {importingSess ? "Import…" : "Importer"}
            </Button>
            {sessResult && <ResultCard result={sessResult} />}
            {sessError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{sessError}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ResultCard({ result }: { result: ImportResult }) {
  return (
    <div className="rounded-md border p-3 space-y-1">
      <p className="text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> <strong>{result.inserted}</strong> insérés, <strong>{result.skipped}</strong> ignorés</p>
      {result.errors.length > 0 && (
        <div className="text-xs text-destructive space-y-0.5">
          {result.errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}
    </div>
  )
}
