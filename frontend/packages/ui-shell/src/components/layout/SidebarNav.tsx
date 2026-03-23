import { Link, useLocation } from "react-router-dom"
import { cn } from "@ui-core/lib/utils"
import { buttonVariants } from "@ui-core/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@ui-core/components/ui/tooltip"
import type { NavItem, NavSection } from "@ui-shell/types/nav"

interface SidebarNavProps {
  config: NavSection[]
  isCollapsed: boolean
  onItemClick?: () => void
}

function normalizePath(path: string): string {
  if (!path) return "/"
  if (path === "/") return "/"
  return path.endsWith("/") ? path.slice(0, -1) : path
}

function isNavItemActive(pathname: string, item: NavItem): boolean {
  const currentPath = normalizePath(pathname)
  const targetPath = normalizePath(item.href)
  const strategy = item.activeMatch ?? (targetPath === "/" ? "exact" : "prefix")

  if (strategy === "exact") {
    return currentPath === targetPath
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

export function SidebarNav({ config, isCollapsed, onItemClick }: SidebarNavProps) {
  const location = useLocation()

  return (
    <div className="flex flex-col gap-4 py-2" data-collapsed={isCollapsed}>
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <TooltipProvider delayDuration={0}>
          {config.map((section, index) => (
            <div key={index} className="flex flex-col gap-1">
              {section.title && !isCollapsed && (
                 <h4 className="px-2 mt-4 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                 </h4>
              )}
              {section.title && isCollapsed && (
                <div className="h-px bg-border mx-2 my-2" />
              )}

              {section.items.map((item, itemIndex) => {
                const isActive = isNavItemActive(location.pathname, item)
                const Icon = item.icon
                const baseItemClass = item.disabled ? "pointer-events-none opacity-50" : ""

                if (isCollapsed) {
                  return (
                    <Tooltip key={itemIndex} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          onClick={onItemClick}
                          className={cn(
                            buttonVariants({ variant: isActive ? "default" : "ghost", size: "icon" }),
                            "h-9 w-9",
                            baseItemClass,
                            isActive && "bg-primary text-primary-foreground dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                          )}
                          aria-disabled={item.disabled || undefined}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          <span className="sr-only">{item.title}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-4">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <Link
                    key={itemIndex}
                    to={item.href}
                    onClick={onItemClick}
                    className={cn(
                      buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" }),
                      isActive && "bg-gradient-to-r from-primary to-secondary/60 text-primary-foreground shadow-md shadow-primary/20",
                      baseItemClass,
                      "justify-start"
                    )}
                    aria-disabled={item.disabled || undefined}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {item.title}
                  </Link>
                )
              })}
            </div>
          ))}
        </TooltipProvider>
      </nav>
    </div>
  )
}
