"use client"

import { usePathname } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const titles: Record<string, string> = {
  "/dashboard": "Jobs",
  "/dashboard/jobs": "Jobs",
  "/dashboard/resume": "Resume",
  "/dashboard/profile": "Profile",
  "/dashboard/application-status": "Application Status",
  "/dashboard/billing": "Billing / Credits",
  "/dashboard/settings": "Profile Settings",
}

export function DashboardHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? "Dashboard"

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <span className="truncate text-sm font-medium">{title}</span>
      </div>

      <SignOutButton />
    </header>
  )
}
