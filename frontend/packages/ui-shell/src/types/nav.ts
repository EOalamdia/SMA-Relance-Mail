import type { LucideIcon } from "lucide-react"

export type NavMatchStrategy = "exact" | "prefix"

export interface NavItem {
  title: string
  href: string
  icon?: LucideIcon
  activeMatch?: NavMatchStrategy
  disabled?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}
