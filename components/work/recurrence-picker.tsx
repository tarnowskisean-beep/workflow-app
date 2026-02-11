"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

export type RecurrenceInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | null

interface RecurrencePickerProps {
    interval: RecurrenceInterval
    onIntervalChange: (interval: RecurrenceInterval) => void
    days: string[] // ["Mon", "Tue", etc] or ["1", "2"] depending on storage preference. Let's use 3-char string for simplicity in UI, map to numbers in backend if needed.
    onDaysChange: (days: string[]) => void
}

const INTERVALS: { value: RecurrenceInterval; label: string }[] = [
    { value: null, label: "Does not repeat" },
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "YEARLY", label: "Yearly" },
]

const DAYS_OF_WEEK = [
    { label: "S", value: "Sun" },
    { label: "M", value: "Mon" },
    { label: "T", value: "Tue" },
    { label: "W", value: "Wed" },
    { label: "T", value: "Thu" },
    { label: "F", value: "Fri" },
    { label: "S", value: "Sat" },
]

export function RecurrencePicker({ interval, onIntervalChange, days, onDaysChange }: RecurrencePickerProps) {
    const [open, setOpen] = useState(false)

    // Helper to toggle a day
    const toggleDay = (day: string) => {
        if (days.includes(day)) {
            onDaysChange(days.filter(d => d !== day))
        } else {
            onDaysChange([...days, day])
        }
    }

    const handleMonthDayChange = (val: string) => {
        // Ensure numeric 1-31
        const num = parseInt(val)
        if (!val || (num >= 1 && num <= 31)) {
            onDaysChange([val])
        }
    }

    const handleYearDateChange = (date: Date | undefined) => {
        if (!date) return
        // Store as MM-DD
        const mm = (date.getMonth() + 1).toString().padStart(2, '0')
        const dd = date.getDate().toString().padStart(2, '0')
        onDaysChange([`${mm}-${dd}`])
    }

    return (
        <div className="space-y-3">
            <Label>Repeats</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                    >
                        {interval ? INTERVALS.find((i) => i.value === interval)?.label : "Does not repeat"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                        <CommandList>
                            <CommandGroup>
                                {INTERVALS.map((int) => (
                                    <CommandItem
                                        key={int.label}
                                        value={int.label}
                                        onSelect={() => {
                                            onIntervalChange(int.value)
                                            setOpen(false)
                                            // Reset days when interval changes to avoid incompatible data
                                            if (int.value !== interval) onDaysChange([])
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                interval === int.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {int.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {interval === "WEEKLY" && (
                <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <Label className="text-xs text-muted-foreground mb-2 block">On these days</Label>
                    <div className="flex justify-between gap-1">
                        {DAYS_OF_WEEK.map((day) => {
                            const isSelected = days.includes(day.value)
                            return (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={cn(
                                        "h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all border",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-muted hover:border-primary/50"
                                    )}
                                >
                                    {day.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {(interval === "MONTHLY" || interval === "QUARTERLY") && (
                <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200 space-y-2">
                    <Label className="text-xs text-muted-foreground block">Day of the month</Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="1"
                            max="31"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Day (1-31)"
                            value={days[0] || ""}
                            onChange={(e) => handleMonthDayChange(e.target.value)}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Task will repeat on day {days[0] || "..."} of every {interval === "MONTHLY" ? "month" : "quarter"}.
                    </p>
                </div>
            )}

            {interval === "YEARLY" && (
                <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200 space-y-2">
                    <Label className="text-xs text-muted-foreground block">Annual Date (Month / Day)</Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            // Dummy year 2024 for leap year support, display format depends on browser locale but input requires YYYY-MM-DD
                            value={`2024-${days[0] || "01-01"}`}
                            onChange={(e) => {
                                if (e.target.valueAsDate) handleYearDateChange(e.target.valueAsDate)
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Task will repeat annually on {days[0] ? new Date(`2024-${days[0]}`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : "..."}.
                    </p>
                </div>
            )}
        </div>
    )
}
