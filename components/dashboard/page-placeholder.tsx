import type { ReactNode } from "react"

export function PagePlaceholder({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-xs/relaxed text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-background/60 px-6 py-16">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {icon}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Nothing here yet</p>
            <p className="text-xs/relaxed text-muted-foreground">
              This page is intentionally blank — content comes in a later step.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
