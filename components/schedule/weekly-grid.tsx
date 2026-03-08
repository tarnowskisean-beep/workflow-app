"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, subWeeks, addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSchedulesForDateRange, upsertSchedule } from "@/actions/schedule";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const SCHEDULE_OPTIONS = [
    { value: "OFFICE", label: "In Office" },
    { value: "OOO", label: "OOO (Out of Office)" },
    { value: "WFH", label: "WFH (Working from Home)" },
    { value: "DC_9_5", label: "DC 9-5 (all day)" },
    { value: "DC_75_35", label: "DC 7.5-3.5 (early)" },
    { value: "DC_3_5", label: "DC 3-5 (part day)" },
    { value: "VACATION", label: "Vacation" },
    { value: "WFV", label: "WFV (Working on Vacation)" },
    { value: "TRAIN", label: "Train (Commuting)" },
    { value: "SICK", label: "Sick" },
];

export function WeeklyGrid() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i)); // Mon-Fri

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const data = await getSchedulesForDateRange(weekDays[0], weekDays[4]);
            setUsers(data);
        } catch (error) {
            toast({
                title: "Error fetching schedules",
                description: "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [weekStart.getTime()]);

    const handlePrevWeek = () => setCurrentDate((prev) => subWeeks(prev, 1));
    const handleNextWeek = () => setCurrentDate((prev) => addWeeks(prev, 1));
    const handleCurrentWeek = () => setCurrentDate(new Date());

    const handleScheduleChange = async (userId: string, date: Date, status: string, notes: string = "") => {
        try {
            await upsertSchedule({ userId, date, status, notes });

            // Optimistically update local state instead of re-fetching entire table
            setUsers(prev => prev.map(u => {
                if (u.id === userId) {
                    const newSchedules = (u.schedules || []).filter(
                        (s: any) => format(s.date, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")
                    );
                    if (status !== "CLEAR") {
                        newSchedules.push({ date, status, notes });
                    }
                    return { ...u, schedules: newSchedules };
                }
                return u;
            }));

            toast({
                title: "Schedule updated",
                description: "Successfully saved schedule changes.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update schedule.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex justify-end items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevWeek}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
                    Current Week
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[200px_repeat(5,1fr)] bg-muted/50 border-b">
                            <div className="p-4 font-semibold text-sm flex items-center gap-2 border-r">
                                <UserIcon className="h-4 w-4" />
                                Team Member
                            </div>
                            {weekDays.map((day) => (
                                <div key={day.toISOString()} className="p-4 text-center border-r last:border-r-0">
                                    <div className="font-semibold">{format(day, "EEEE")}</div>
                                    <div className="text-sm text-muted-foreground">{format(day, "MMM d")}</div>
                                </div>
                            ))}
                        </div>

                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading schedules...</div>
                        ) : users.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No users found.</div>
                        ) : (
                            <div className="divide-y">
                                {users.map((user) => (
                                    <div key={user.id} className="grid grid-cols-[200px_repeat(5,1fr)] hover:bg-muted/30 transition-colors">
                                        <div className="p-4 font-medium text-sm flex items-center border-r">
                                            {user.name || user.email}
                                        </div>
                                        {weekDays.map((day) => {
                                            const dayStr = format(day, "yyyy-MM-dd");
                                            const schedule = (user.schedules || []).find(
                                                (s: any) => format(new Date(s.date), "yyyy-MM-dd") === dayStr
                                            );
                                            const currentStatus = schedule?.status || "OFFICE"; // Default to Office

                                            return (
                                                <div key={dayStr} className="p-2 border-r last:border-r-0 flex flex-col gap-2">
                                                    <Select
                                                        value={currentStatus}
                                                        onValueChange={(value) => handleScheduleChange(user.id, day, value, schedule?.notes)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SCHEDULE_OPTIONS.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                            <SelectItem value="CLEAR" className="text-red-500 font-medium text-xs">Clear Status</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Notes input for things like WFV times */}
                                                    {(currentStatus === "WFV" || currentStatus === "OOO" || currentStatus === "TRAIN" || currentStatus === "VACATION" || currentStatus.startsWith("DC_")) && (
                                                        <Input
                                                            placeholder="Notes / Times..."
                                                            className="h-7 text-xs bg-muted/30 border-dashed"
                                                            defaultValue={schedule?.notes || ""}
                                                            onBlur={(e) => {
                                                                if (e.target.value !== (schedule?.notes || "")) {
                                                                    handleScheduleChange(user.id, day, currentStatus, e.target.value);
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="max-w-3xl flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg">
                <div><strong className="text-foreground">DC 9-5:</strong> in DC office all day</div>
                <div><strong className="text-foreground">DC 7.5-3.5:</strong> in DC office early hours</div>
                <div><strong className="text-foreground">DC 3-5:</strong> in DC office part of the day</div>
                <div><strong className="text-foreground">WFV:</strong> working while on vacation (add times)</div>
                <div><strong className="text-foreground">Train:</strong> commuting but reachable</div>
            </div>
        </div>
    );
}
