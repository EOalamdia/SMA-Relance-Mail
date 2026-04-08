import * as React from "react"
import { cn } from "@ui-core/lib/utils"
import { Button } from "@ui-core/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@ui-core/components/ui/sheet"
import { SidebarNav } from "./SidebarNav"
import { UserNav, type UserProfile } from "./UserNav"
import type { NavSection } from "@ui-shell/types/nav"
import { Menu, ChevronLeft, ChevronRight } from "lucide-react"

interface AppLayoutProps {
    children: React.ReactNode
    logo?: React.ReactNode
    appName?: string
    navConfig: NavSection[]
    user?: UserProfile
    onLogout?: () => void
    onHubReturn?: () => void
    className?: string
}

export default function AppLayout({ 
    children, 
    logo, 
    appName = "Application", 
    navConfig, 
    user,
    onLogout,
    onHubReturn,
    className
}: AppLayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [isMobileOpen, setIsMobileOpen] = React.useState(false)

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed)
    }

    return (
        <div className={cn("flex h-screen overflow-hidden bg-background", className)}>
            {/* Sidebar (Desktop) */}
            <aside 
                className={cn(
                    "hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out relative",
                    isCollapsed ? "w-[52px]" : "w-64"
                )}
            >
                {/* Sidebar Header (Logo & Toggle) */}
                <div className={cn(
                    "flex items-center h-[52px]", 
                    isCollapsed ? "justify-center" : "justify-between px-4"
                )}>
                    {isCollapsed ? (
                        <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
                             <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <>
                             {logo ? logo : (
                                <div className="flex items-center gap-2">
                                     <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary/60 flex items-center justify-center font-bold text-primary-foreground shadow-sm">
                                        {appName.charAt(0)}
                                    </div>
                                    <span className="font-bold text-lg tracking-tight truncate">
                                        {appName}
                                    </span>
                                </div>
                            )}
                            <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8 text-muted-foreground">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
                
                 <div className="h-px bg-border mx-2" />

                {/* Sidebar Navigation */}
                <div className="flex-1 overflow-auto py-2">
                    <SidebarNav config={navConfig} isCollapsed={isCollapsed} />
                </div>

                {/* Sidebar Footer (User only) */}
                <div className="mt-auto border-t p-0">
                    {user && (
                        <UserNav 
                            user={user} 
                            isCollapsed={isCollapsed} 
                            onLogout={onLogout}
                            onHubReturn={onHubReturn}
                        />
                    )}
                </div>
            </aside>

              {/* Main Content */}
              <main className="flex-1 flex flex-col overflow-hidden">
                 {/* Mobile Header Trigger - Visible only on mobile */}
                <div className="md:hidden h-14 border-b flex items-center px-4 justify-between bg-card shrink-0">
                    <span className="font-bold">{appName}</span>
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu size={20} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-0 flex flex-col">
                             <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                             <SheetDescription className="sr-only">Menu principal de navigation sur mobile</SheetDescription>
                             <div className="h-14 flex items-center px-6 border-b">
                                {logo ? logo : (
                                    <div className="flex items-center gap-2">
                                         <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary/60 flex items-center justify-center font-bold text-primary-foreground shadow-sm">
                                            {appName.charAt(0)}
                                        </div>
                                        <span className="font-bold text-lg tracking-tight truncate">
                                            {appName}
                                        </span>
                                    </div>
                                )}
                             </div>
                             <div className="flex-1 overflow-auto py-4">
                                <SidebarNav 
                                    config={navConfig} 
                                    isCollapsed={false} 
                                    onItemClick={() => setIsMobileOpen(false)} 
                                />
                             </div>
                             <div className="mt-auto border-t p-0">
                                {user && (
                                    <UserNav 
                                        user={user} 
                                        isCollapsed={false} 
                                        onLogout={onLogout}
                                        onHubReturn={onHubReturn}
                                    />
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 pb-10 w-full">
                    <div className="max-w-6xl mx-auto"> 
                        {children}
                    </div>
                </div>
              </main>
        </div>
    )
}
