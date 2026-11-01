"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Briefcase01Icon,
  Chart01Icon,
  Coins01Icon,
  CreditCardIcon,
  File01Icon,
  Settings01Icon,
  SparklesIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const navigation = [
  { title: "Jobs", href: "/dashboard/jobs", icon: Briefcase01Icon },
  { title: "Resume", href: "/dashboard/resume", icon: File01Icon },
  { title: "Profile", href: "/dashboard/profile", icon: UserIcon },
  {
    title: "Application Status",
    href: "/dashboard/application-status",
    icon: Chart01Icon,
  },
] as const

const footerNavigation = [
  {
    title: "Billing / Credits",
    href: "/dashboard/billing",
    icon: CreditCardIcon,
  },
  {
    title: "Profile Settings",
    href: "/dashboard/settings",
    icon: Settings01Icon,
  },
] as const

// Placeholder numbers until billing is wired up.
const CREDITS_USED = 12
const CREDITS_TOTAL = 50
const CREDITS_LEFT = CREDITS_TOTAL - CREDITS_USED
const CREDITS_PERCENT = Math.round((CREDITS_USED / CREDITS_TOTAL) * 100)

// Bigger rows and icons keep the expanded rail from looking sparse.
const menuItemClass =
  "h-10 gap-2.5 text-sm [&_svg]:size-5 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5! data-active:bg-primary/15 data-active:text-foreground data-active:hover:bg-primary/20"

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function CreditsCard() {
  return (
    <Link
      href="/dashboard/billing"
      className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3.5 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <HugeiconsIcon
            icon={Coins01Icon}
            strokeWidth={2}
            className="size-4 text-primary"
          />
          AI credits
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {CREDITS_USED} / {CREDITS_TOTAL}
        </span>
      </div>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-sidebar-border">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${CREDITS_PERCENT}%` }}
        />
      </div>

      <p className="mt-2 text-xs/relaxed text-muted-foreground">
        {CREDITS_LEFT} credits left this month.
      </p>
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="JobBuddy AI"
              className="h-14 gap-3 [&_svg]:size-5 group-data-[collapsible=icon]:size-10!"
              render={<Link href="/dashboard/jobs" />}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                <span className="truncate text-base font-semibold tracking-tight">
                  JobBuddy AI
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Career copilot
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.title}
                    className={menuItemClass}
                    render={<Link href={item.href} />}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <CreditsCard />

        <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`${CREDITS_LEFT} credits left`}
              className={menuItemClass}
              render={<Link href="/dashboard/billing" />}
            >
              <HugeiconsIcon icon={Coins01Icon} strokeWidth={2} />
              <span>Credits</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="mx-0" />

        <SidebarMenu>
          {footerNavigation.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive(pathname, item.href)}
                tooltip={item.title}
                className={menuItemClass}
                render={<Link href={item.href} />}
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
