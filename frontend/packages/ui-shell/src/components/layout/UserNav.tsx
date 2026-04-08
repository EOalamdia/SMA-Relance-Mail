import { useState } from "react"
import {
  ChevronsUpDown,
  LogOut,
  LayoutGrid,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  X,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui-core/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@ui-core/components/ui/avatar"
import { Button } from "@ui-core/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui-core/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@ui-core/components/ui/dialog"
import { cn } from "@ui-core/lib/utils"
import { usePWAInstall } from "../../hooks/usePWAInstall"

export interface UserProfile {
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
}

interface UserNavProps {
    user: UserProfile
    isCollapsed: boolean
    onLogout?: () => void
    onHubReturn?: () => void
}

function normalizeText(value?: string | null): string {
    return (value ?? "").trim()
}

function nameFromEmail(email: string): string {
    const localPart = email.split("@")[0] ?? ""
    if (!localPart) return ""
    return localPart
        .replace(/[._-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ")
}

function buildInitials(name: string, email: string): string {
    const source = name || nameFromEmail(email) || "U"
    const letters = source
        .replace(/[^a-zA-Z0-9 ]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    return (letters || "U").slice(0, 2)
}

// Modale d'aide à l'installation PWA selon OS/navigateur
function PWAInstallHelpModal({
  open,
  onClose,
  isIOS,
  isAndroid,
  promptReady,
  appName,
}: {
  open: boolean
  onClose: () => void
  isIOS: boolean
  isAndroid: boolean
  promptReady: boolean
  appName: string
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Installer {appName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Instructions pour installer l'application sur votre appareil
          </DialogDescription>
        </DialogHeader>

        {isIOS && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Pour ajouter <strong>{appName}</strong> à votre écran d'accueil sur iPhone/iPad :
            </p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <span>Appuyez sur le bouton <Share className="inline h-4 w-4 text-blue-500" /> <strong>Partager</strong> en bas de Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <span>Faites défiler et appuyez sur <PlusSquare className="inline h-4 w-4" /> <strong>Sur l'écran d'accueil</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                <span>Appuyez sur <strong>Ajouter</strong> en haut à droite</span>
              </li>
            </ol>
          </div>
        )}

        {isAndroid && !promptReady && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Pour ajouter <strong>{appName}</strong> à votre écran d'accueil :
            </p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <span>Appuyez sur le menu <MoreVertical className="inline h-4 w-4" /> <strong>⋮ (3 points)</strong> de votre navigateur</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <span>Sélectionnez <strong>Ajouter à l'écran d'accueil</strong> ou <strong>Installer l'application</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                <span>Confirmez en appuyant sur <strong>Ajouter</strong></span>
              </li>
            </ol>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              💡 Pour une installation complète (icône + mode app), utilisez <strong>Chrome</strong> ou <strong>Edge</strong>.
            </p>
          </div>
        )}

        {!isIOS && !isAndroid && !promptReady && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Pour installer <strong>{appName}</strong> sur votre ordinateur :
            </p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <span>Dans Chrome, cliquez sur l'icône <Download className="inline h-4 w-4" /> dans la barre d'adresse</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <span>Cliquez sur <strong>Installer</strong></span>
              </li>
            </ol>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="mr-1 h-3 w-3" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function UserNav({ user, isCollapsed, onLogout, onHubReturn }: UserNavProps) {
    const displayEmail = normalizeText(user.email) || "email-inconnu@hub.local"
    const displayName = normalizeText(user.name) || nameFromEmail(displayEmail) || "Utilisateur Hub"
    const displayAvatarUrl = normalizeText(user.avatarUrl)
    const initials = buildInitials(displayName, displayEmail)
    const { isInstallable, isIOS, isAndroid, promptReady, handleInstallClick } = usePWAInstall()
    const appName = import.meta.env.VITE_APP_NAME || "l'application"
    const [showInstallHelp, setShowInstallHelp] = useState(false)

    const onInstallAction = async () => {
        const result = await handleInstallClick()
        // Si le prompt natif a été déclenché : rien d'autre à faire
        if (result === 'prompt') return
        // Sinon, afficher la modale d'aide manuelle
        setShowInstallHelp(true)
    }

    return (
        <>
            <DropdownMenu>
                <TooltipProvider disableHoverableContent>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "relative h-14 w-full justify-start rounded-none border-t px-2 text-foreground",
                                        isCollapsed ? "h-14 justify-center px-0" : "px-3"
                                    )}
                                >
                                    <Avatar className="h-9 w-9 border">
                                        {displayAvatarUrl && <AvatarImage src={displayAvatarUrl} alt={displayName} />}
                                        <AvatarFallback className="bg-primary/12 font-semibold text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>

                                    {!isCollapsed && (
                                        <>
                                            <div className="ml-3 flex flex-col items-start text-left text-sm">
                                                <span className="font-semibold text-foreground">{displayName}</span>
                                                <span className="w-40 truncate text-xs text-foreground/75" title={displayEmail}>
                                                    {displayEmail}
                                                </span>
                                            </div>
                                            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                                        </>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right" className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{displayName}</span>
                                    <span className="text-xs text-muted-foreground">{displayEmail}</span>
                                </div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {displayEmail}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onHubReturn}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>Retour au Hub</span>
                    </DropdownMenuItem>
                    {isInstallable && (
                        <DropdownMenuItem onClick={onInstallAction}>
                            <Smartphone className="mr-2 h-4 w-4" />
                            <span>{promptReady ? "Installer l'app" : isIOS ? "Installer sur iPhone" : "Ajouter à l'écran d'accueil"}</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Déconnexion</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <PWAInstallHelpModal
                open={showInstallHelp}
                onClose={() => setShowInstallHelp(false)}
                isIOS={isIOS}
                isAndroid={isAndroid}
                promptReady={promptReady}
                appName={appName}
            />
        </>
    )
}
