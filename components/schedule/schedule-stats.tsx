"use client";

import { useState, useMemo, useEffect } from "react";
import { format, subDays, subMonths, parseISO, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getSchedulesForDateRange } from "@/actions/schedule";
import { DatePickerWithRange } from "../dashboard/date-range-picker";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const STATUS_MAP: Record<string, string> = {
    OOO: "Out of Office",
    VACATION: "Vacation",
    SICK: "Sick",
    WFH: "Work From Home",
    WFV: "Work From Vacation",
    TRAIN: "Train",
    OFFICE: "In Office (Total)",
    DC_9_5: "DC 9-5",
    DC_75_35: "DC 7.5-3.5",
    DC_3_5: "DC 3-5",
};

// Colors for the chart matching the map
const CHART_COLORS: Record<string, string> = {
    "Sick": "hsl(346, 87%, 60%)", // Rose
    "Vacation": "hsl(24, 95%, 53%)", // Orange
    "Out of Office": "hsl(0, 84%, 60%)", // Red
    "Work From Home": "hsl(221, 83%, 53%)", // Blue
    "Work From Vacation": "hsl(262, 83%, 58%)", // Purple
};

export function ScheduleStats() {
    // Default to last 30 days
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date()
    });

    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            if (!dateRange?.from || !dateRange?.to) return;

            setIsLoading(true);
            try {
                // Ensure full day coverage
                const start = startOfDay(dateRange.from);
                const end = endOfDay(dateRange.to);
                const data = await getSchedulesForDateRange(start, end);
                setUsers(data);
            } catch (error) {
                toast({
                    title: "Error fetching statistics",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [dateRange?.from, dateRange?.to]);

    // Aggregate Data for the Chart and Table
    const { chartData, tableData } = useMemo(() => {
        if (!users.length) return { chartData: [], tableData: [] };

        const aggChart: Record<string, Record<string, number>> = {};
        const tableStats = users.map(user => {
            const userCounts: Record<string, number> = {
                "SICK": 0, "VACATION": 0, "WFH": 0, "OOO": 0, "WFV": 0, "TRAIN": 0, "OFFICE": 0
            };

            (user.schedules || []).forEach((sched: any) => {
                if (sched.status && sched.status !== "CLEAR") {
                    // Normalize DC statuses as "Office" for aggregate stats
                    if (sched.status.startsWith("DC_") || sched.status === "OFFICE") {
                        userCounts["OFFICE"]++;
                    } else {
                        userCounts[sched.status] = (userCounts[sched.status] || 0) + 1;
                    }
                }
            });

            // Prepare chart bar (e.g. { name: "Sean", Sick: 2, WFH: 5, Vacation: 0 })
            aggChart[user.id] = {
                name: (user.name || user.email).split(" ")[0], // First name or short email
                "Sick": userCounts["SICK"] || 0,
                "Vacation": userCounts["VACATION"] || 0,
                "Work From Home": userCounts["WFH"] || 0,
                "Out of Office": userCounts["OOO"] || 0,
                "Work From Vacation": userCounts["WFV"] || 0,
            };

            return {
                id: user.id,
                name: user.name || user.email,
                counts: userCounts
            };
        });

        // Filter out people with 0 relevant stats for the chart to keep it clean,
        // unless they are the only ones, just show the array.
        const cData = Object.values(aggChart).filter(u =>
            u["Sick"] > 0 || u["Vacation"] > 0 || u["Work From Home"] > 0 || u["Out of Office"] > 0 || u["Work From Vacation"] > 0
        ).sort((a, b) => (b["Sick"] + b["Vacation"] + b["Out of Office"]) - (a["Sick"] + a["Vacation"] + a["Out of Office"]));

        return { chartData: cData, tableData: tableStats.sort((a, b) => a.name.localeCompare(b.name)) };
    }, [users]);


    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-4 rounded-lg border shadow-sm gap-4">
                <div className="text-sm font-medium text-muted-foreground mr-auto">
                    Analyze team absences and remote work distribution.
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Date Range:</span>
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Visual Chart */}
                <Card className="col-span-1 border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle>Remote & Absences Overview</CardTitle>
                        <CardDescription>
                            Total remote, sick, and vacation days taken by team members in the selected period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                Loading chart data...
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                                No absence or remote data found in this period.
                            </div>
                        ) : (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                            dy={10}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                                            cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Bar dataKey="Sick" stackId="a" fill={CHART_COLORS["Sick"]} radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Vacation" stackId="a" fill={CHART_COLORS["Vacation"]} />
                                        <Bar dataKey="Out of Office" stackId="a" fill={CHART_COLORS["Out of Office"]} />
                                        <Bar dataKey="Work From Home" stackId="a" fill={CHART_COLORS["Work From Home"]} />
                                        <Bar dataKey="Work From Vacation" stackId="a" fill={CHART_COLORS["Work From Vacation"]} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card className="col-span-1 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle>Detailed Breakdown</CardTitle>
                        <CardDescription>
                            Aggregated schedule counts per employee.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[400px]">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead>Team Member</TableHead>
                                        <TableHead className="text-right">Sick</TableHead>
                                        <TableHead className="text-right">Vacation</TableHead>
                                        <TableHead className="text-right">OOO</TableHead>
                                        <TableHead className="text-right">WFH</TableHead>
                                        <TableHead className="text-right text-muted-foreground">Office (DC)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                Loading data...
                                            </TableCell>
                                        </TableRow>
                                    ) : tableData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No schedule data available.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tableData.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="font-medium truncate max-w-[150px]" title={row.name}>{row.name}</TableCell>
                                                <TableCell className={`text-right ${row.counts["SICK"] > 0 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>{row.counts["SICK"]}</TableCell>
                                                <TableCell className={`text-right ${row.counts["VACATION"] > 0 ? 'text-orange-500 font-bold' : 'text-muted-foreground'}`}>{row.counts["VACATION"]}</TableCell>
                                                <TableCell className={`text-right ${row.counts["OOO"] > 0 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>{row.counts["OOO"]}</TableCell>
                                                <TableCell className={`text-right ${row.counts["WFH"] > 0 ? 'text-blue-500 font-bold' : 'text-muted-foreground'}`}>{row.counts["WFH"]}</TableCell>
                                                <TableCell className="text-right font-medium">{row.counts["OFFICE"] > 0 ? row.counts["OFFICE"] : "-"}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
