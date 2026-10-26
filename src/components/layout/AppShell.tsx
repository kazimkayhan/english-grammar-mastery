import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Cards01Icon,
  CheckListIcon,
  Dumbbell01Icon,
  HierarchySquare01Icon,
  Home01Icon,
  LanguageSkillIcon,
  LibraryIcon,
  Route01Icon,
  Settings01Icon,
  SortingAZ01Icon,
} from "@hugeicons/core-free-icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"
import { CommandMenu } from "@/components/layout/CommandMenu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { DueCount } from "@/components/flashcards/DueCount"
import { useSettingsSync } from "@/components/layout/useSettingsSync"

export interface ShellLevel {
  id: string
  title: string
  count: number
}

export interface ShellPillar {
  id: string
  number: number
  short: string
  family: string
}

interface AppShellProps {
  currentPath: string
  levels: ShellLevel[]
  pillars: ShellPillar[]
  children?: React.ReactNode
}

const TOOLS = [
  { href: "/mindmaps", label: "Mindmaps", icon: HierarchySquare01Icon },
  { href: "/practice", label: "Practice", icon: Dumbbell01Icon },
  { href: "/flashcards", label: "Flashcards", icon: Cards01Icon, badge: true },
  { href: "/persian-corner", label: "Grammar Tips", icon: LanguageSkillIcon },
  { href: "/grammar-index", label: "Grammar index", icon: SortingAZ01Icon },
  { href: "/reference", label: "Reference", icon: LibraryIcon },
  { href: "/coverage", label: "Coverage", icon: CheckListIcon },
]

const FAMILY_TITLES: Record<string, string> = {
  words: "Words",
  verbs: "Verbs",
  sentences: "Sentences",
  text: "Text",
}

const isActive = (current: string, href: string) =>
  href === "/" ? current === "/" : current === href || current.startsWith(`${href}/`)

function NavLink({
  href,
  current,
  children,
  tooltip,
}: {
  href: string
  current: string
  children: React.ReactNode
  tooltip?: string
}) {
  return (
    <SidebarMenuButton
      render={<a href={href} />}
      isActive={isActive(current, href)}
      tooltip={tooltip}
      aria-current={isActive(current, href) ? "page" : undefined}
    >
      {children}
    </SidebarMenuButton>
  )
}

export function AppShell({ currentPath, levels, pillars, children }: AppShellProps) {
  useSettingsSync()
  const families = ["words", "verbs", "sentences", "text"]

  return (
    <TooltipProvider>
      <Toaster>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" render={<a href="/" />} tooltip="English Grammar Mastery">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate font-heading text-sm font-bold">Grammar Mastery</span>
                      <span className="truncate text-xs text-muted-foreground">A1 → C2 English grammar</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <NavLink href="/" current={currentPath} tooltip="Home">
                        <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                        <span>Home</span>
                      </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <NavLink href="/roadmap" current={currentPath} tooltip="Roadmap">
                        <HugeiconsIcon icon={Route01Icon} strokeWidth={2} />
                        <span>Roadmap</span>
                      </NavLink>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Levels</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {levels.map((level) => (
                      <SidebarMenuItem key={level.id}>
                        <NavLink
                          href={`/levels/${level.id.toLowerCase()}`}
                          current={currentPath}
                          tooltip={`${level.id} · ${level.title}`}
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-[0.7rem] font-bold">
                            {level.id}
                          </span>
                          <span>{level.title}</span>
                        </NavLink>
                        <SidebarMenuBadge>{level.count}</SidebarMenuBadge>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {families.map((family) => (
                <SidebarGroup key={family}>
                  <SidebarGroupLabel>
                    <span className="mr-2 size-2 rounded-full" style={{ background: `var(--fam-${family})` }} />
                    {FAMILY_TITLES[family]}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {pillars
                        .filter((p) => p.family === family)
                        .map((p) => (
                          <SidebarMenuItem key={p.id}>
                            <NavLink href={`/pillars/${p.id}`} current={currentPath} tooltip={p.short}>
                              <span
                                className="flex size-6 shrink-0 items-center justify-center rounded-md text-[0.7rem] font-bold"
                                style={{ background: `var(--fam-${family}-soft)`, color: `var(--fam-${family})` }}
                              >
                                {p.number}
                              </span>
                              <span>{p.short}</span>
                            </NavLink>
                          </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}

              <SidebarGroup>
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {TOOLS.map((tool) => (
                      <SidebarMenuItem key={tool.href}>
                        <NavLink href={tool.href} current={currentPath} tooltip={tool.label}>
                          <HugeiconsIcon icon={tool.icon} strokeWidth={2} />
                          <span>{tool.label}</span>
                        </NavLink>
                        {tool.badge && (
                          <SidebarMenuBadge>
                            <DueCount />
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink href="/settings" current={currentPath} tooltip="Settings">
                    <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="min-w-0">
            <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-5 data-vertical:self-center" />
              <CommandMenu />
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <ThemeToggle />
              </div>
            </header>
            <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </Toaster>
    </TooltipProvider>
  )
}
