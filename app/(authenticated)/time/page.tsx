import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { parseLocalDate, formatLocalDate } from "@/lib/date-utils"
import { getWeeklyEntries } from "@/actions/time-actions"
import { WeekNavigator } from "@/components/work/week-navigator"
import { WeekTabs } from "@/components/work/week-tabs"
import { TimeEntryList } from "@/components/work/time-entry-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TimeLogDialogWrapper } from "@/components/work/time-log-dialog-wrapper"
import { TimeEntryListWrapper } from "@/components/work/time-entry-list-wrapper"

export default async function TimePage({ searchParams }: { searchParams: Promise<{ date?: string, view?: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return null

    const resolvedParams = await searchParams
    const dateStr = resolvedParams.date || formatLocalDate(new Date())
    const date = parseLocalDate(resolvedParams.date || "")
    const view = resolvedParams.view || "day"

    // Always fetch weekly entries to populate the tabs
    const [weeklyEntries, tasks, projects, allUserEntries] = await Promise.all([
        getWeeklyEntries(date),
        prisma.workItem.findMany({
            where: {
                status: { not: "DONE" },
                OR: [
                    { assigneeId: session.user.id },
                    { assigneeId: null }
                ]
            },
            select: { id: true, title: true, projectId: true, project: { select: { name: true } } },
            orderBy: { title: 'asc' }
        }),
        prisma.project.findMany({
            select: { id: true, name: true, allowedTaskTypes: true },
            orderBy: { name: 'asc' }
        }),
        prisma.timeEntry.findMany({
            where: { userId: session.user.id },
            select: { createdAt: true }
        })
    ])

    const loggedDates = allUserEntries.map(e => e.createdAt)

    // Filter for the specific day view if needed
    const dailyEntries = weeklyEntries.filter(e => {
        const entryDate = new Date(e.startedAt)
        return entryDate.toDateString() === date.toDateString()
    })

    const entriesToDisplay = view === 'week' ? weeklyEntries : dailyEntries

    // Transform tasks for the dialog
    const taskOptions = tasks.map(t => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId, // Pass projectId for filtering
        projectName: t.project?.name
    }))

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header / Nav */}
            <div className="flex flex-col gap-6 border-b pb-0">
                <div className="flex justify-between items-center">
                    <WeekNavigator loggedDates={loggedDates} />
                    <div className="hidden sm:block">
                        <TimeLogDialogWrapper tasks={taskOptions} projects={projects} date={dateStr} />
                    </div>
                </div>

                {/* Day Tabs - Only show in Day view */}
                {view === 'day' && (
                    <WeekTabs currentDateStr={dateStr} weeklyEntries={weeklyEntries} />
                )}
            </div>

            {/* Mobile "Track Time" button */}
            <div className="sm:hidden w-full">
                <TimeLogDialogWrapper tasks={taskOptions} projects={projects} date={dateStr} />
            </div>

            {/* Main Content */}
            <div>
                <TimeEntryListWrapper entries={entriesToDisplay} tasks={taskOptions} projects={projects} view={view} date={dateStr} />
            </div>
        </div>
    )
}


