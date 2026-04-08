import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"

import AppLayout from "@ui-shell/components/layout/AppLayout"
import type { UserProfile } from "@ui-shell/components/layout/UserNav"
import { buildNavConfig } from "@/config/nav"
import { starterApi } from "@/services/api"

const DEFAULT_USER: UserProfile = {
  name: "Utilisateur Hub",
  email: "forward-auth@hub.local",
}

const navConfig = buildNavConfig(import.meta.env.DEV)
const DEFAULT_ICON = "📧"
const DEFAULT_TITLE_PREFIX = "SMA"

function deriveDisplayName(email?: string): string {
  const localPart = (email ?? "").split("@")[0] ?? ""
  if (!localPart) return "Utilisateur Hub"
  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ")
}

function isImageIcon(iconUrl: string): boolean {
  return /^(https?:\/\/|\/|data:image\/)/i.test(iconUrl)
}

function toEmojiFaviconDataUrl(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function resolveFaviconHref(iconUrl: string | null): string {
  const icon = (iconUrl ?? "").trim()
  if (!icon) {
    return `${import.meta.env.BASE_URL}icon.svg`
  }
  if (isImageIcon(icon)) {
    return icon
  }
  return toEmojiFaviconDataUrl(icon)
}

function ShellLogo({ appName, iconUrl }: { appName: string; iconUrl: string | null }) {
  const icon = (iconUrl ?? "").trim()
  const imageIcon = icon && isImageIcon(icon)
  const glyphIcon = icon && !imageIcon ? icon : DEFAULT_ICON

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-secondary/60 text-primary-foreground shadow-sm">
        {imageIcon ? (
          <img src={icon} alt={`${appName} icône`} className="h-5 w-5 object-contain" />
        ) : (
          <span className="text-base leading-none">{glyphIcon}</span>
        )}
      </div>
      <span className="truncate text-lg font-bold tracking-tight">{appName}</span>
    </div>
  )
}

import { AuthProvider, SessionExpiredModal } from "@ui-shell"

function MainLayoutChild() {
  const defaultAppName = import.meta.env.VITE_APP_NAME || "SMA"
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER)
  const [shell, setShell] = useState<{ appName: string; iconUrl: string | null }>({
    appName: defaultAppName,
    iconUrl: null,
  })

  useEffect(() => {
    let cancelled = false
    starterApi
      .me()
      .then((user) => {
        if (cancelled) return
        const email = (user.user_email ?? user.forwarded_user ?? "").trim()
        const name = deriveDisplayName(email)
        setCurrentUser({
          name,
          email: email || DEFAULT_USER.email,
        })
      })
      .catch(() => {
        if (cancelled) return
        setCurrentUser(DEFAULT_USER)
      })

    starterApi
      .appShell()
      .then((appShell) => {
        if (cancelled) return
        const appName = (appShell.app_name ?? "").trim() || defaultAppName
        const iconUrl = (appShell.icon_url ?? "").trim() || null
        setShell({ appName, iconUrl })
      })
      .catch(() => {
        if (cancelled) return
        setShell((prev: any) => prev)
      })

    return () => {
      cancelled = true
    }
  }, [defaultAppName])

  useEffect(() => {
    document.title = shell.appName ? `${shell.appName} | ${DEFAULT_TITLE_PREFIX}` : DEFAULT_TITLE_PREFIX
    const faviconHref = resolveFaviconHref(shell.iconUrl)

    const ensureFavicon = (selector: string) => {
      let link = document.querySelector<HTMLLinkElement>(selector)
      if (!link) {
        link = document.createElement("link")
        if (selector.includes("shortcut icon")) {
          link.rel = "shortcut icon"
        } else {
          link.rel = "icon"
          link.type = "image/svg+xml"
        }
        document.head.appendChild(link)
      }
      link.href = faviconHref
    }

    ensureFavicon("link[rel='icon']")
    ensureFavicon("link[rel='shortcut icon']")
  }, [shell.appName, shell.iconUrl])

  const handleLogout = () => {
    // Shared state for multi-tab logout
    localStorage.setItem('auth-status', 'logged-out')
    // Small delay to ensure storage event is dispatched (though optional)
    setTimeout(() => {
      window.location.href = "/auth/logout"
    }, 10)
  }

  const handleHubReturn = () => {
    window.location.href = "/"
  }

  return (
    <AppLayout
      appName={shell.appName}
      logo={<ShellLogo appName={shell.appName} iconUrl={shell.iconUrl} />}
      navConfig={navConfig}
      user={currentUser}
      onLogout={handleLogout}
      onHubReturn={handleHubReturn}
    >
      <Outlet />
      <SessionExpiredModal />
    </AppLayout>
  )
}

function MainLayout() {
  return (
    <AuthProvider>
      <MainLayoutChild />
    </AuthProvider>
  )
}

export default MainLayout
