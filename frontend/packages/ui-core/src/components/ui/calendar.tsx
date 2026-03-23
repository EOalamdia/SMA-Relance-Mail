import * as React from "react"
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

type CalendarProps = {
  value?: Date
  onChange?: (date: Date) => void
}

const DAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]

export function Calendar({ value, onChange }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    value ?? new Date()
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = []
  let day = gridStart

  while (day <= gridEnd) {
    days.push(day)
    day = new Date(day.setDate(day.getDate() + 1))
  }

  return (
    <div className="w-[320px] rounded-lg border bg-card p-3 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <button
          className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0")}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-sm font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </div>

        <button
          className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0")}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* DAYS HEADER */}
      <div className="grid grid-cols-7 text-xs text-muted-foreground mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d) => {
          const isSelected = value && isSameDay(d, value)
          const isCurrentMonth = isSameMonth(d, currentMonth)

          return (
            <button
              key={d.toISOString()}
              onClick={() => onChange?.(d)}
              className={cn(
                "h-10 w-10 text-sm rounded-full mx-auto",
                !isCurrentMonth && "text-muted-foreground opacity-40",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected &&
                  "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {format(d, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
