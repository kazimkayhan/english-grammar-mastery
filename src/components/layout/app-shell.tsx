import {
  ArrowDown01Icon,
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
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { DueCount } from "@/components/flashcards/due-count";
import { CommandMenu } from "@/components/layout/command-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSettingsSync } from "@/components/layout/use-settings-sync";
import { Separator } from "@/components/ui/separator";
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
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface ShellLesson {
  href: string;
  number: number;
  title: string;
}

export interface ShellLevel {
  id: string;
  lessons: ShellLesson[];
  title: string;
}

export interface ShellPillar {
  family: string;
  id: string;
  number: number;
  short: string;
}

interface AppShellProps {
  children?: ReactNode;
  currentPath: string;
  levels: ShellLevel[];
  pillars: ShellPillar[];
}

const TOOLS = [
  { href: "/mindmaps", icon: HierarchySquare01Icon, label: "Mindmaps" },
  { href: "/practice", icon: Dumbbell01Icon, label: "Practice" },
  { badge: true, href: "/flashcards", icon: Cards01Icon, label: "Flashcards" },
  { href: "/grammar-tips", icon: LanguageSkillIcon, label: "Grammar Tips" },
  { href: "/grammar-index", icon: SortingAZ01Icon, label: "Grammar index" },
  { href: "/reference", icon: LibraryIcon, label: "Reference" },
  { href: "/coverage", icon: CheckListIcon, label: "Coverage" },
];

const FAMILY_TITLES: Record<string, string> = {
  sentences: "Sentences",
  text: "Text",
  verbs: "Verbs",
  words: "Words",
};

const isActive = (current: string, href: string) =>
  href === "/"
    ? current === "/"
    : current === href || current.startsWith(`${href}/`);

function NavLink({
  href,
  current,
  children,
  tooltip,
}: {
  href: string;
  current: string;
  children: ReactNode;
  tooltip?: string;
}) {
  return (
    <SidebarMenuButton
      aria-current={isActive(current, href) ? "page" : undefined}
      isActive={isActive(current, href)}
      render={<a href={href} />}
      tooltip={tooltip}
    >
      {children}
    </SidebarMenuButton>
  );
}

/** A level in the sidebar: a link to its overview, and a chevron that opens its lessons. */
function LevelItem({
  level,
  currentPath,
}: {
  level: ShellLevel;
  currentPath: string;
}) {
  const slug = level.id.toLowerCase();
  const inside =
    currentPath === `/levels/${slug}` ||
    currentPath.startsWith(`/lessons/${slug}/`);
  const [open, setOpen] = useState(inside);
  const listRef = useRef<HTMLUListElement>(null);

  // When the list opens, bring the lesson you are on into view inside it.
  useEffect(() => {
    if (open) {
      listRef.current
        ?.querySelector<HTMLElement>('[aria-current="page"]')
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <SidebarMenuItem>
      <NavLink
        current={currentPath}
        href={`/levels/${slug}`}
        tooltip={`${level.id} · ${level.title}`}
      >
        <span className="bg-sidebar-accent flex size-6 shrink-0 items-center justify-center rounded-md text-[0.7rem] font-bold">
          {level.id}
        </span>
        <span>{level.title}</span>
      </NavLink>
      {level.lessons.length > 0 && (
        <SidebarMenuAction
          aria-controls={open ? `level-${slug}-lessons` : undefined}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} ${level.id} lessons`}
          onClick={() => setOpen(!open)}
        >
          <HugeiconsIcon
            className={
              open ? "rotate-180 transition-transform" : "transition-transform"
            }
            icon={ArrowDown01Icon}
            strokeWidth={2}
          />
        </SidebarMenuAction>
      )}
      {open && level.lessons.length > 0 && (
        // Five rows are visible at once (10rem); the rest scroll inside the list.
        <SidebarMenuSub
          className="max-h-40 overflow-y-auto"
          id={`level-${slug}-lessons`}
          ref={listRef}
        >
          {level.lessons.map((lesson) => (
            <SidebarMenuSubItem key={lesson.href}>
              <SidebarMenuSubButton
                aria-current={
                  isActive(currentPath, lesson.href) ? "page" : undefined
                }
                isActive={isActive(currentPath, lesson.href)}
                render={<a href={lesson.href} />}
              >
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {lesson.number}
                </span>
                <span>{lesson.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

export function AppShell({
  currentPath,
  levels,
  pillars,
  children,
}: AppShellProps) {
  useSettingsSync();
  const families = ["words", "verbs", "sentences", "text"];

  return (
    <TooltipProvider>
      <Toaster>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<a href="/" />}
                    size="lg"
                    tooltip="English Grammar Mastery"
                  >
                    <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-xl">
                      <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="font-heading truncate text-sm font-bold">
                        Grammar Mastery
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        A1 → C2 English grammar
                      </span>
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
                      <NavLink current={currentPath} href="/" tooltip="Home">
                        <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                        <span>Home</span>
                      </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <NavLink
                        current={currentPath}
                        href="/roadmap"
                        tooltip="Roadmap"
                      >
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
                      <LevelItem
                        currentPath={currentPath}
                        key={level.id}
                        level={level}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {families.map((family) => (
                <SidebarGroup key={family}>
                  <SidebarGroupLabel>
                    <span
                      className="mr-2 size-2 rounded-full"
                      style={{ background: `var(--fam-${family})` }}
                    />
                    {FAMILY_TITLES[family]}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {pillars
                        .filter((p) => p.family === family)
                        .map((p) => (
                          <SidebarMenuItem key={p.id}>
                            <NavLink
                              current={currentPath}
                              href={`/pillars/${p.id}`}
                              tooltip={p.short}
                            >
                              <span
                                className="flex size-6 shrink-0 items-center justify-center rounded-md text-[0.7rem] font-bold"
                                style={{
                                  background: `var(--fam-${family}-soft)`,
                                  color: `var(--fam-${family})`,
                                }}
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
                        <NavLink
                          current={currentPath}
                          href={tool.href}
                          tooltip={tool.label}
                        >
                          <HugeiconsIcon icon={tool.icon} strokeWidth={2} />
                          <span>{tool.label}</span>
                        </NavLink>
                        {tool.badge ? (
                          <SidebarMenuBadge>
                            <DueCount />
                          </SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink
                    current={currentPath}
                    href="/settings"
                    tooltip="Settings"
                  >
                    <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="min-w-0">
            <header className="bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
              <SidebarTrigger className="-ml-1" />
              <Separator
                className="mr-1 h-5 data-vertical:self-center"
                orientation="vertical"
              />
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
  );
}
