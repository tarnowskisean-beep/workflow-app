"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ComprehensiveReport, ReportGroupItem } from "@/actions/report-actions"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"

interface ReportsDashboardProps {
    report: ComprehensiveReport
}

export function ReportsDashboard({ report }: ReportsDashboardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const { summary, byProject, byUser, byTask } = report

    const donutData = [
        { name: 'Billable', value: summary.billableHours, color: '#3b82f6' }, // Blue
        { name: 'Non-billable', value: summary.nonBillableHours, color: '#93c5fd' }, // Light Blue
    ]

    // Deep drill-down logic
    const handleDrillDown = (id: string, type: 'user' | 'project' | 'task') => {
        const params = new URLSearchParams(searchParams.toString())

        if (type === 'project') {
            params.set('projectId', id)
            params.delete('taskId') // Clear task filter if focusing on project
            // Switch to Tasks tab to see breakdown
            router.push(`/reports?${params.toString()}&tab=tasks`)
        } else if (type === 'task') {
            params.set('taskId', id)
            // Switch to Team tab to see who worked on it
            router.push(`/reports?${params.toString()}&tab=team`)
        } else if (type === 'user') {
            params.set('userId', id)
            // Switch to Projects tab to see what they worked on
            router.push(`/reports?${params.toString()}&tab=projects`)
        }
    }

    const DetailTable = ({ data, showAvatar = false, type }: { data: ReportGroupItem[], showAvatar?: boolean, type: 'user' | 'project' | 'task' }) => (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="text-right">Billable Hours</TableHead>
                    <TableHead className="text-right">Billable Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item) => (
                    <TableRow
                        key={item.id}
                        className={type !== 'task' ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                        onClick={() => type !== 'task' && handleDrillDown(item.id, type)}
                    >
                        <TableCell className="w-[40%]">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 font-medium">
                                    {showAvatar && (
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={item.imageUrl || ""} />
                                            <AvatarFallback>{item.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <span>{item.name}</span>
                                </div>
                                {/* Progress Bar */}
                                <div className="flex h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${(item.billableHours / item.totalHours) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-blue-200"
                                        style={{ width: `${((item.totalHours - item.billableHours) / item.totalHours) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span
                                className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 cursor-pointer hover:text-blue-800"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDrillDown(item.id, type)
                                }}
                            >
                                {item.totalHours.toFixed(2)}
                            </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                            {item.billableHours.toFixed(2)} <span className="text-xs">({item.totalHours > 0 ? Math.round((item.billableHours / item.totalHours) * 100) : 0}%)</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {formatCurrency(item.billableAmount)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )

    return (
        <div className="space-y-8">
            {/* Header Summary Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b pb-8">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Hours</span>
                    <span className="text-5xl font-bold tracking-tight">{summary.totalHours.toFixed(2)}</span>
                </div>

                {/* Donut Chart */}
                <div className="flex items-center gap-4">
                    <div className="h-[120px] w-[120px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={55}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {donutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => (value || 0).toFixed(2)} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold">
                                {summary.totalHours > 0 ? Math.round((summary.billableHours / summary.totalHours) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-blue-500" />
                            <span className="font-medium">Billable</span>
                            <span className="font-bold ml-auto">{summary.billableHours.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-blue-200" />
                            <span className="font-medium">Non-billable</span>
                            <span className="font-bold ml-auto">{summary.nonBillableHours.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-12">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground font-medium">Billable Amount</span>
                        <span className="text-2xl font-bold">{formatCurrency(summary.billableAmount)}</span>
                    </div>

                </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue={searchParams.get('tab') || "projects"} className="space-y-6" key={searchParams.toString()}>
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger
                        value="projects"
                        className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Projects
                    </TabsTrigger>
                    <TabsTrigger
                        value="tasks"
                        className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Tasks
                    </TabsTrigger>
                    <TabsTrigger
                        value="team"
                        className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Team
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-4">
                    <DetailTable data={byProject} type="project" />
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                    <DetailTable data={byTask} type="task" />
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    <DetailTable data={byUser} showAvatar={true} type="user" />
                </TabsContent>
            </Tabs>
        </div>
    )
}
