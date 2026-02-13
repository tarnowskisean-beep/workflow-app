"use client"

import { useState } from "react"
import { TimeEntryList } from "@/components/work/time-entry-list"
import { TimeLogDialog } from "@/components/work/time-log-dialog"
import { useRouter } from "next/navigation"
import { parseLocalDate, formatLocalDate } from "@/lib/date-utils"
import { TimeEntryWithFullRelations, ProjectOption, TaskOption } from "@/types"

import { TimeEntryWeekView } from "./time-entry-week-view"
import { useTimer } from "@/components/providers/timer-provider"

interface TimeEntryListWrapperProps {
    entries: TimeEntryWithFullRelations[]
    tasks: TaskOption[]
    projects: ProjectOption[]
    view?: string
    date?: string
}

export function TimeEntryListWrapper({ entries, tasks, projects, view = "day", date }: TimeEntryListWrapperProps) {
    const [editingEntry, setEditingEntry] = useState<TimeEntryWithFullRelations | null>(null)
    const [startingEntry, setStartingEntry] = useState<TimeEntryWithFullRelations | null>(null)
    const router = useRouter()
    const { startTimer, activeTimer } = useTimer()

    const parsedDate = date ? parseLocalDate(date) : new Date()

    const handleStart = async (entry: any) => {
        if (activeTimer) {
            alert("A timer is already running. Please stop it first.")
            return
        }

        // Start timer immediately with entry details
        // Note: entry.taskType is preferred, fallback to task logic if needed
        await startTimer(
            entry.projectId,
            entry.taskType || undefined,
            entry.workItemId || undefined,
            "" // Start with empty notes or maybe copy? Let's keep empty for fresh start
        )
        router.refresh()
    }

    return (
        <>
            {view === 'week' ? (
                <TimeEntryWeekView
                    entries={entries}
                    onEdit={setEditingEntry}
                    onStart={handleStart}
                    date={parsedDate}
                />
            ) : (
                <TimeEntryList
                    entries={entries}
                    onEdit={(entry) => setEditingEntry(entry)}
                    onStart={handleStart}
                />
            )}

            {/* Editing Dialog */}
            {editingEntry && (
                <TimeLogDialog
                    open={!!editingEntry}
                    onOpenChange={(open) => !open && setEditingEntry(null)}
                    tasks={tasks}
                    projects={projects}
                    defaultDate={new Date(editingEntry.startedAt).toISOString().split("T")[0]}
                    entryToEdit={editingEntry}
                    onComplete={() => {
                        setEditingEntry(null)
                        router.refresh()
                    }}
                />
            )}

            {/* Starting Dialog (Duplicate) */}
            {startingEntry && (
                <TimeLogDialog
                    open={!!startingEntry}
                    onOpenChange={(open) => !open && setStartingEntry(null)}
                    tasks={tasks}
                    projects={projects}
                    defaultDate={formatLocalDate(new Date())}
                    initialValues={{
                        projectId: startingEntry.projectId || undefined,
                        taskId: startingEntry.workItemId || undefined,
                        notes: "" // Clear notes for new entry
                    }}
                    onComplete={() => {
                        setStartingEntry(null)
                        router.refresh()
                    }}
                />
            )}
        </>
    )
}

