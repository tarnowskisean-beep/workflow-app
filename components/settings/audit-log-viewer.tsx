"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useDebounce } from "use-debounce"

import { getAuditLogs } from "@/actions/audit-actions"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AuditLogViewer() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [actionFilter, setActionFilter] = useState("ALL")
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [debouncedSearch] = useDebounce(search, 500)

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true)
            try {
                const data = await getAuditLogs({
                    action: actionFilter === "ALL" ? undefined : actionFilter,
                    search: debouncedSearch,
                    startDate,
                    endDate
                })
                setLogs(data)
            } catch (error) {
                console.error("Failed to load audit logs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [actionFilter, debouncedSearch, startDate, endDate])

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
                <CardDescription>Recent security and system events (SOC 2 Compliance)</CardDescription>
                <div className="flex flex-col gap-4 pt-4">
                    <div className="flex gap-4">
                        <div className="w-full max-w-sm">
                            <Input
                                placeholder="Search actor, entity ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Actions</SelectItem>
                                <SelectItem value="USER_ROLE_UPDATED">User Role Updated</SelectItem>
                                <SelectItem value="PROJECT_UPDATED">Project Updated</SelectItem>
                                <SelectItem value="TASK_CREATED">Task Created</SelectItem>
                                <SelectItem value="TASK_UPDATED">Task Updated</SelectItem>
                                <SelectItem value="TASK_DELETED">Task Deleted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-4 items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Start Date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <span className="text-muted-foreground">-</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>End Date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {(startDate || endDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStartDate(undefined)
                                    setEndDate(undefined)
                                }}
                            >
                                Clear Dates
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Metadata</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No logs found</TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap font-mono text-xs">
                                        {new Date(log.occurredAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.actor?.name || "Unknown"}</span>
                                            <span className="text-xs text-muted-foreground">{log.actor?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.action}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono">{log.entityType}</span>
                                            <span className="text-xs text-muted-foreground">{log.entityId.substring(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-xs font-mono text-muted-foreground">
                                        {log.metadata}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
