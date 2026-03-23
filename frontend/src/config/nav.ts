import { Database, Home, Layers3, Settings2, Wrench } from "lucide-react"

import type { NavSection } from "@ui-shell/types/nav"

export type { NavItem, NavSection } from "@ui-shell/types/nav"

export function buildNavConfig(isDev: boolean): NavSection[] {
  const sections: NavSection[] = [
    {
      title: "Workspace",
      items: [
        {
          title: "Accueil",
          href: "/",
          icon: Home,
        },
        {
          title: "Modules",
          href: "/modules",
          icon: Layers3,
        },
        {
          // PLACEHOLDER: renommer title et href selon le domaine metier cible
          title: "Items (demo)",
          href: "/items",
          icon: Database,
        },
        {
          title: "Parametres",
          href: "/settings",
          icon: Settings2,
        },
      ],
    },
  ]

  if (isDev) {
    sections.push({
      title: "Development",
      items: [
        {
          title: "Dev Tools",
          href: "/dev-tools",
          icon: Wrench,
        },
      ],
    })
  }

  return sections
}
