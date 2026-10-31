"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <HugeiconsIcon
          icon={visible ? EyeOffIcon : EyeIcon}
          strokeWidth={1.8}
          className="size-4"
        />
      </button>
    </div>
  )
}

export { PasswordInput }
