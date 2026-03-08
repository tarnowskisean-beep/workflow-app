"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSchedulesForDateRange } from "@/actions/schedule";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Status colors mapping
const STATUS_COLORS: Record<string, string> = {
    OOO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    VACATION: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    SICK: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    WFH: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    WFV: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    TRAIN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    "DC_9_5": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "DC_75_35": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    "DC_3_5": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

const STATUS_LABELS: Record<string, string> = {
    OOO: "OOO",
    VACATION: "Vacation",
    SICK: "Sick",
    WFH: "WFH",
    WFV: "WFV",
    TRAIN: "Train",
    "DC_9_5": "DC 9-5",
    "DC_75_35": "DC 7.5-3.5",
    "DC_3_5": "DC 3-5",
};

export function ScheduleCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Month boundary calculations
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Fetch data for the whole month
    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const data = await getSchedulesForDateRange(monthStart, monthEnd);
            setUsers(data);
        } catch (error) {
            toast({
                title: "Error fetching schedules",
                description: "Failed to load calendar data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [monthStart.getTime()]);

    const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));
    const handleToday = () => setCurrentDate(new Date());

    // Generate days grid
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday...

    // Prefix with empty slots for alignment
    const prefixEmptyDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center bg-card p-3 rounded-lg border shadow-sm">
                <h2 className="text-xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday} className="h-8">
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-sm font-semibold text-muted-foreground p-2">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                            Loading calendar...
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] divide-x divide-y border-x border-b">
                            {prefixEmptyDays.map((i) => (
                                <div key={`empty-${i}`} className="bg-muted/10 p-2 min-h-[120px]" />
                            ))}

                            {days.map((day) => {
                                const dayStr = format(day, "yyyy-MM-dd");

                                // Find all non-default schedules for this day
                                const daySchedules = users.flatMap(u => {
                                    const sched = (u.schedules || []).find((s: any) => format(new Date(s.date), "yyyy-MM-dd") === dayStr);
                                    if (sched && sched.status !== "OFFICE" && sched.status !== "CLEAR") {
                                        return [{
                                            userName: u.name || u.email,
                                            status: sched.status,
                                            notes: sched.notes
                                        }];
                                    }
                                    return [];
                                });

                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isCurrentDay = isToday(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={cn(
                                            "min-h-[120px] p-2 hover:bg-muted/30 transition-colors flex flex-col gap-1",
                                            !isCurrentMonth && "bg-muted/10 opacity-50",
                                            isCurrentDay && "bg-primary/5 shadow-[inset_0_3px_0_hsl(var(--primary))]"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={cn(
                                                "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                                isCurrentDay && "bg-primary text-primary-foreground"
                                            )}>
                                                {format(day, "d")}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[200px] no-scrollbar">
                                            {daySchedules.map((entry, idx) => {
                                                const label = STATUS_LABELS[entry.status] || entry.status;
                                                const colorClass = STATUS_COLORS[entry.status] || "bg-muted text-muted-foreground";

                                                // Get first name or email prefix for brief display
                                                const nameParts = entry.userName.split(" ");
                                                const shortName = nameParts.length > 1
                                                    ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
                                                    : nameParts[0].split('@')[0];

                                                return (
                                                    <div
                                                        key={`${dayStr}-${idx}`}
                                                        className={cn(
                                                            "text-[11px] px-1.5 py-0.5 rounded leading-tight truncate border border-transparent flex justify-between items-center",
                                                            colorClass
                                                        )}
                                                        title={`${entry.userName} - ${label}${entry.notes ? `\nNotes: ${entry.notes}` : ""}`}
                                                    >
                                                        <span className="font-medium truncate mr-1">{shortName}</span>
                                                        <span className="opacity-80 shrink-0 text-[10px] uppercase">{label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
