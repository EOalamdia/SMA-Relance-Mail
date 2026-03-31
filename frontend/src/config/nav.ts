import {
  BarChart3, Building2, CalendarDays, ClipboardList, GraduationCap, Home, Link2,
  Mail, MailCheck, MailX, MessageSquare, Bell, Send, Tags, Target, Users,
} from "lucide-react"

import type { NavSection } from "@ui-shell/types/nav"

export type { NavItem, NavSection } from "@ui-shell/types/nav"

export function buildNavConfig(_isDev: boolean): NavSection[] {
  return [
    {
      title: "Accueil",
      items: [
        { title: "Accueil", href: "/", icon: Home },
        { title: "Tableau de bord", href: "/dashboard", icon: BarChart3 },
      ],
    },
    {
      title: "Referentiels",
      items: [
        { title: "Types d'organismes", href: "/organization-types", icon: Tags },
        { title: "Organismes", href: "/organizations", icon: Building2 },
        { title: "Contacts", href: "/contacts", icon: Users },
      ],
    },
    {
      title: "Formation",
      items: [
        { title: "Catalogue", href: "/training-courses", icon: GraduationCap },
        { title: "Applicabilité", href: "/course-applicability", icon: Link2 },
        { title: "Sessions", href: "/training-sessions", icon: CalendarDays },
        { title: "Echeances", href: "/due-items", icon: Target },
      ],
    },
    {
      title: "Relances",
      items: [
        { title: "Jobs de relance", href: "/reminder-jobs", icon: Send },
        { title: "Historique envois", href: "/email-deliveries", icon: MailCheck },
      ],
    },
    {
      title: "Désinscription",
      items: [
        { title: "Topics de communication", href: "/communication-topics", icon: MessageSquare },
        { title: "Abonnements email", href: "/email-subscriptions", icon: MailX },
        { title: "Journal désinscriptions", href: "/unsubscribe-events", icon: ClipboardList },
      ],
    },
    {
      title: "Parametrage",
      items: [
        { title: "Règles de relance", href: "/reminder-rules", icon: Bell },
        { title: "Templates email", href: "/email-templates", icon: Mail },
      ],
    },
  ]
}
