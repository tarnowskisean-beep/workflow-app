"use client"

import { useTimer } from "@/components/providers/timer-provider"
import { Button } from "@/components/ui/button"
import { Play, Square, X } from "lucide-react"
import { useEffect, useState } from "react"

function formatSeconds(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function GlobalTimer() {
    const { activeTimer, stopTimer, discardTimer, isLoading } = useTimer()
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!activeTimer) {
            setElapsed(0)
            return
        }

        const interval = setInterval(() => {
            const start = new Date(activeTimer.startedAt).getTime()
            const now = new Date().getTime()
            setElapsed(Math.floor((now - start) / 1000))
        }, 1000)

        // Set initial
        const start = new Date(activeTimer.startedAt).getTime()
        const now = new Date().getTime()
        setElapsed(Math.floor((now - start) / 1000))

        return () => clearInterval(interval)
    }, [activeTimer])

    if (!activeTimer) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-zinc-900 border shadow-lg rounded-lg p-3 flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium truncate max-w-[150px]">
                    {activeTimer.project?.name || "No Project"}
                </span>
                <span className="text-sm font-semibold truncate max-w-[150px]">
                    {activeTimer.taskType || activeTimer.workItem?.title || "No Task"}
                </span>
            </div>

            <div className="font-mono text-xl font-bold min-w-[80px] text-center">
                {formatSeconds(elapsed)}
            </div>

            <div className="flex gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                        if (confirm("Discard this timer?")) discardTimer()
                    }}
                    disabled={isLoading}
                    title="Discard"
                >
                    <X className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => stopTimer()}
                    disabled={isLoading}
                    title="Stop"
                >
                    <Square className="h-4 w-4 fill-current" />
                </Button>
            </div>
        </div>
    )
}
