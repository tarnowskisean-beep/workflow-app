"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TimeLogDialog } from "@/components/work/time-log-dialog"
import { useRouter } from "next/navigation"

export function TimeLogDialogWrapper({ tasks, projects, date }: { tasks: any[], projects: any[], date: string }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    return (
        <>
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" size="lg" onClick={() => setOpen(true)}>
                <Plus className="h-5 w-5" /> Track Time
            </Button>

            <TimeLogDialog
                open={open}
                onOpenChange={setOpen}
                tasks={tasks} // Pass tasks for dropdown
                projects={projects} // Pass projects for generic time logging
                defaultDate={date}
                onComplete={() => {
                    setOpen(false)
                    router.refresh()
                }}
            />
        </>
    )
}
