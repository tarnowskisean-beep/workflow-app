import { auth } from "@/auth"
import { getComprehensiveReport } from "@/actions/report-actions"
import { getProjects } from "@/actions/project-actions"
import { getUsers } from "@/actions/user-actions"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import { ReportFilters } from "@/components/reports/report-filters"
import { ExportButton } from "@/components/reports/export-button"
import { startOfMonth, endOfDay, startOfWeek, endOfWeek } from "date-fns"

export default async function ReportsPage({
    searchParams
}: {
    searchParams: Promise<{ from?: string, to?: string, projectId?: string, userId?: string, taskId?: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) return null

    const resolvedParams = await searchParams

    // Date Range Logic
    const from = resolvedParams.from ? new Date(resolvedParams.from) : startOfWeek(new Date())
    const to = resolvedParams.to ? new Date(resolvedParams.to) : endOfWeek(new Date())

    // Filters
    const projectId = resolvedParams.projectId
    const userId = resolvedParams.userId
    const taskId = resolvedParams.taskId

    // Fetch Data in Parallel
    const [report, projects, users] = await Promise.all([
        getComprehensiveReport(from, to, projectId, userId, taskId),
        getProjects(),
        getUsers()
    ])

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Performance, time tracking, and team insights.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton from={from} to={to} projectId={projectId} userId={userId} taskId={taskId} />
                </div>
            </div>

            <ReportFilters projects={projects} users={users} />

            <ReportsDashboard report={report} />
        </div>
    )
}
