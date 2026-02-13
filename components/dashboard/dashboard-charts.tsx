"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

interface DashboardChartsProps {
    taskStatusData: { name: string; value: number }[]
    timeLogData: { date: string; hours: number; fullDate?: string }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function DashboardCharts({ taskStatusData, timeLogData }: DashboardChartsProps) {
    const router = useRouter()

    // Filter out zero values for cleaner pie chart
    const activeTaskData = taskStatusData.filter(d => d.value > 0)

    const handleBarClick = (data: any) => {
        if (data && data.fullDate) {
            router.push(`/time?date=${data.fullDate}&view=day`)
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                {/* ... */}
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeLogData}>
                                {/* ... axes ... */}
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}h`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }} // use simplified cursor
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="hours"
                                    fill="#0f172a"
                                    radius={[4, 4, 0, 0]}
                                    className="fill-primary cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={handleBarClick}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Task Status</CardTitle>
                    <CardDescription>
                        Distribution of active tasks.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        {activeTaskData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={activeTaskData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {activeTaskData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                No tasks found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
