"use client"

import * as React from "react"
import { CalendarBlankIcon, XIcon } from "@phosphor-icons/react/ssr"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// A date as text, "2026-11-12", is what forms and the database see. These two keep the picker in
// whole local days, so no time zone can move a date by one.
export function ymdToDate(ymd: string | undefined | null): Date | undefined {
  if (!ymd) return undefined
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

export function dateToYmd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${m}-${d}`
}

const shown = (date: Date) => date.toLocaleDateString("en-NG", { dateStyle: "medium" })

// shadcn date picker: a button that opens a calendar. `value` and `onChange` use "YYYY-MM-DD". With a `name`
// it also posts the date in a form. `min` and `max` are "YYYY-MM-DD" and grey out days outside them.
export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onChange,
  min,
  max,
  placeholder = "Pick a date",
  required = false,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (ymd: string) => void
  min?: string
  max?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  "aria-label"?: string
}) {
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const [open, setOpen] = React.useState(false)
  const current = value !== undefined ? value : inner
  const selected = ymdToDate(current)
  const before = ymdToDate(min)
  const after = ymdToDate(max)

  function pick(date: Date | undefined) {
    const next = date ? dateToYmd(date) : ""
    if (value === undefined) setInner(next)
    onChange?.(next)
    setOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-required={required || undefined}
            data-empty={!selected}
            className="w-full justify-start gap-2 px-3 font-normal text-body text-ink data-[empty=true]:text-muted-foreground"
          >
            <CalendarBlankIcon className="size-4 shrink-0 text-muted-foreground" />
            {selected ? shown(selected) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={pick}
            defaultMonth={selected ?? before}
            disabled={[...(before ? [{ before }] : []), ...(after ? [{ after }] : [])]}
            autoFocus
          />
          {!required && selected && (
            <div className="border-t border-border p-1.5">
              <Button type="button" variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => pick(undefined)}>
                <XIcon className="size-3.5" />
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
