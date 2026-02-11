"use client"

import { Button } from "@/components/ui/button"
import { Play, Edit, Trash2, Folder, Briefcase, FileText } from "lucide-react"
import { format } from "date-fns"
// In real app, would use specific types
import { deleteTimeEntry } from "@/actions/time-actions"

interface TimeEntryListProps {
    entries: any[]
    onEdit: (entry: any) => void
    onStart?: (entry: any) => void
}

export function TimeEntryList({ entries, onEdit, onStart }: TimeEntryListProps) {
    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50 text-muted-foreground">
                <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No time logged</h3>
                <p>Click "Track Time" to add an entry for this day.</p>
            </div>
        )
    }

    // Group by Project (Optional improvement, Harvest does this flat-ish or grouped)
    // Let's keep it flat list for now, sorted descending by start time usually.

    return (
        <div className="divide-y border-t border-b sm:border rounded-none sm:rounded-lg shadow-sm bg-background">
            {entries.map((entry) => (
                <div key={entry.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-1">
                            <span className="font-semibold text-gray-900 truncate">
                                {entry.project?.name || "No Project"}
                            </span>
                            {entry.workItem && (
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {entry.workItem.title}
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                            {entry.notes || <span className="italic opacity-50">No notes</span>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="text-right">
                            <div className="text-xl font-semibold tracking-tight tabular-nums">
                                {formatDuration(entry.durationSeconds)}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Start button for quick duplicate/restart */}


                            <Button variant="outline" size="sm" onClick={() => onEdit(entry)} className="h-8 px-2 sm:px-3">
                                <Edit className="h-3.5 w-3.5 sm:mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}`
}
