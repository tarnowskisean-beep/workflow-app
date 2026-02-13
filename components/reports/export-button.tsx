"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { getComprehensiveReport, TimeReportEntry } from "@/actions/report-actions"
import { format } from "date-fns"
import { useState } from "react"
import { DATE_FORMATS } from "@/lib/format"

interface ExportButtonProps {
    from: Date
    to: Date
    projectId?: string
    userId?: string
    taskId?: string
    filename?: string
}

export function ExportButton({ from, to, projectId, userId, taskId, filename = "report-data" }: ExportButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            const report = await getComprehensiveReport(from, to, projectId, userId, taskId, true)
            const data = report.entries

            if (!data || data.length === 0) {
                alert("No data to export")
                return
            }

            // CSV Header
            const headers = ["Date", "User", "Project", "Task", "Description", "Hours", "Billable Amount"]

            // CSV Rows
            const rows = data.map((entry: TimeReportEntry) => [
                format(new Date(entry.date), DATE_FORMATS.ISO),
                `"${(entry.userName || "").replace(/"/g, '""')}"`,
                `"${(entry.projectName || "").replace(/"/g, '""')}"`,
                `"${(entry.taskTitle || "").replace(/"/g, '""')}"`,
                `"${(entry.description || "").replace(/"/g, '""')}"`,
                entry.hours.toFixed(2),
                entry.billableAmount.toFixed(2)
            ])

            const csvContent = [
                headers.join(","),
                ...rows.map((row: string[]) => row.join(","))
            ].join("\n")

            // Create Blob and Download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `${filename}-${format(new Date(), DATE_FORMATS.ISO)}.csv`)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error("Export failed", error)
            alert("Failed to export data")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
        </Button>
    )
}
