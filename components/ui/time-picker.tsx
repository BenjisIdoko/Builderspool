"use client"

import * as React from "react"
import { ClockIcon } from "@phosphor-icons/react/ssr"
import { cn } from "cn"
import { formatClock } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// shadcn-style time picker: a button that opens hour, minute and am/pm columns. `value` and `onChange` use
// 24-hour "HH:MM" (what is stored and compared); the button shows it as "5pm" or "7:50pm". With a `name` it
// also posts "HH:MM" in a form.
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

function parse(value: string): { h12: number; minute: number; pm: boolean } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  const h = Number(match[1])
  const minute = Number(match[2])
  if (h > 23 || minute > 59) return null
  return { h12: h % 12 === 0 ? 12 : h % 12, minute, pm: h >= 12 }
}

function build(h12: number, minute: number, pm: boolean): string {
  const h24 = (h12 % 12) + (pm ? 12 : 0)
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function Column({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      role="listbox"
      aria-label={label}
      className="flex max-h-56 min-w-14 flex-col gap-0.5 overflow-y-auto p-1 [scrollbar-width:thin]"
    >
      {children}
    </div>
  )
}

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      ref={(el) => {
        if (selected && el) el.scrollIntoView({ block: "nearest" })
      }}
      className={cn(
        "flex min-h-11 items-center justify-center rounded-md px-3 text-sm tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring lg:min-h-9",
        selected ? "bg-primary text-primary-foreground" : "text-ink hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

export function TimePicker({
  id,
  name,
  value,
  defaultValue,
  onChange,
  minuteStep = 5,
  placeholder = "Pick a time",
  required = false,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (hhmm: string) => void
  minuteStep?: number
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  "aria-label"?: string
}) {
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const current = value !== undefined ? value : inner
  const parts = parse(current)

  // The minute list steps by `minuteStep`; a saved minute off that grid (say 19:52) is kept in the list.
  const minutes = React.useMemo(() => {
    const list: number[] = []
    for (let m = 0; m < 60; m += minuteStep) list.push(m)
    if (parts && !list.includes(parts.minute)) list.push(parts.minute)
    return list.sort((a, b) => a - b)
  }, [minuteStep, parts])

  function set(next: { h12?: number; minute?: number; pm?: boolean }) {
    const base = parts ?? { h12: 9, minute: 0, pm: false }
    const hhmm = build(next.h12 ?? base.h12, next.minute ?? base.minute, next.pm ?? base.pm)
    if (value === undefined) setInner(hhmm)
    onChange?.(hhmm)
  }

  return (
    <div className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-required={required || undefined}
            data-empty={!parts}
            className="w-full justify-start gap-2 px-3 font-normal text-body text-ink tabular-nums data-[empty=true]:text-muted-foreground"
          >
            <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
            {parts ? formatClock(current) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto flex-row gap-0 p-1">
          <Column label="Hour">
            {HOURS.map((h) => (
              <Option key={h} selected={parts?.h12 === h} onClick={() => set({ h12: h })}>
                {h}
              </Option>
            ))}
          </Column>
          <Column label="Minute">
            {minutes.map((m) => (
              <Option key={m} selected={parts?.minute === m} onClick={() => set({ minute: m })}>
                {String(m).padStart(2, "0")}
              </Option>
            ))}
          </Column>
          <Column label="am or pm">
            <Option selected={parts ? !parts.pm : false} onClick={() => set({ pm: false })}>
              am
            </Option>
            <Option selected={parts ? parts.pm : false} onClick={() => set({ pm: true })}>
              pm
            </Option>
          </Column>
        </PopoverContent>
      </Popover>
    </div>
  )
}
