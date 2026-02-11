"use client"

import { useState, useMemo } from "react"
import { Folder, FileText, ChevronRight, Home, ArrowLeft, ExternalLink, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Project {
    id: string
    name: string
}

interface User {
    id: string
    name: string | null
}

interface WorkItem {
    id: string
    title: string
    projectId: string | null
    project?: Project | null
    assignee?: User | null
    updatedAt: Date
    driveLink: string | null
    driveFileName?: string | null
    status: string
    taskType?: string | null
}

interface FileExplorerProps {
    data: WorkItem[]
}

type FileSystemItem = {
    id: string
    name: string
    type: 'folder' | 'file'
    kind?: 'project' | 'task' | 'type' // 'type' for task type folders
    updatedAt?: Date
    children?: FileSystemItem[]
    meta?: any // Store original object (Project or WorkItem)
}

export function FileExplorer({ data }: FileExplorerProps) {
    const [currentPath, setCurrentPath] = useState<string[]>([])

    // Transform flat data into a file system hierarchy
    const fileSystem = useMemo(() => {
        // Group by Project ID
        const projectsMap = new Map<string, FileSystemItem>()
        // Helper to find or create a task type folder within a project
        const getTaskTypeFolder = (projectFolder: FileSystemItem, taskType: string): FileSystemItem => {
            if (!projectFolder.children) projectFolder.children = []

            let typeFolder = projectFolder.children.find(c => c.name === taskType && c.kind === 'type')
            if (!typeFolder) {
                typeFolder = {
                    id: `${projectFolder.id}-${taskType}`,
                    name: taskType,
                    type: 'folder',
                    kind: 'type',
                    updatedAt: new Date(), // Placeholder
                    children: []
                }
                projectFolder.children.push(typeFolder)
                // Sort children by name to keep folders organized
                projectFolder.children.sort((a, b) => a.name.localeCompare(b.name))
            }
            return typeFolder
        }

        const orphanFiles: FileSystemItem[] = []

        data.forEach(item => {
            // Determine name for the file: User requested "Underlying document should be the name of the google drive link document"
            // We use the driveFileName if available (populated by backfill or API), otherwise fallback to task title.
            const fileName = item.driveFileName || item.title

            if (item.projectId && item.project) {
                if (!projectsMap.has(item.projectId)) {
                    projectsMap.set(item.projectId, {
                        id: item.projectId,
                        name: item.project.name,
                        type: 'folder',
                        kind: 'project',
                        updatedAt: new Date(),
                        children: [],
                        meta: item.project
                    })
                }
                const projectFolder = projectsMap.get(item.projectId)!
                const taskType = item.status === 'DONE' && !item.driveLink ? 'Completed Tasks' : (item.taskType || "General") // Use "General" if no type

                // Only create a file node if there is a drive link, or should we list tasks without links?
                // The prompt implies we are looking at a "files module", so likely only items with links matters?
                // But the previous implementation showed everything. The user said "The Underlying document..."
                // Data passed to this component is already filtered by `driveLink: { not: null }` in page.tsx!
                // So all items here HAVE a drive link.

                if (item.driveLink) {
                    // Get or create the Type folder
                    const typeFolder = getTaskTypeFolder(projectFolder, taskType)

                    typeFolder.children?.push({
                        id: item.id,
                        name: fileName,
                        type: 'file',
                        updatedAt: item.updatedAt,
                        meta: { ...item, driveLink: item.driveLink }
                    })
                }
            } else {
                // Orphans
                if (item.driveLink) {
                    orphanFiles.push({
                        id: item.id,
                        name: fileName,
                        type: 'file',
                        updatedAt: item.updatedAt,
                        meta: { ...item, driveLink: item.driveLink }
                    })
                }
            }
        })

        // Sort projects alphabetically
        const sortedProjects = Array.from(projectsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

        const root: FileSystemItem[] = [...sortedProjects]

        // Add orphan files to a "Unassigned" project folder
        if (orphanFiles.length > 0) {
            root.push({
                id: 'unassigned',
                name: 'Unassigned',
                type: 'folder',
                kind: 'project',
                children: orphanFiles,
                updatedAt: new Date()
            })
        }

        return root
    }, [data])

    // Traverse to current folder
    const currentFolderContents = useMemo(() => {
        let currentLevel = fileSystem

        // Traverse down the path
        for (const segmentId of currentPath) {
            const foundFolder = currentLevel.find(item => item.id === segmentId)
            if (foundFolder && foundFolder.children) {
                currentLevel = foundFolder.children
            } else {
                // If path is invalid (shouldn't happen), return empty or root?
                // Returning empty array to be safe
                return []
            }
        }
        return currentLevel
    }, [fileSystem, currentPath])

    // Get current breadcrumbs
    const breadcrumbs = useMemo(() => {
        const crumbs: { id: string, name: string }[] = []
        let currentLevel = fileSystem

        for (const segmentId of currentPath) {
            const found = currentLevel.find(item => item.id === segmentId)
            if (found) {
                crumbs.push({ id: found.id, name: found.name })
                if (found.children) {
                    currentLevel = found.children
                }
            }
        }
        return crumbs
    }, [fileSystem, currentPath])


    const handleNavigate = (item: FileSystemItem) => {
        if (item.type === 'folder') {
            setCurrentPath(prev => [...prev, item.id])
        } else if (item.type === 'file' && item.meta?.driveLink) {
            window.open(item.meta.driveLink, '_blank')
        }
    }

    const handleNavigateUp = () => {
        setCurrentPath(prev => prev.slice(0, -1))
    }

    const handleBreadcrumbClick = (index: number) => {
        setCurrentPath(prev => prev.slice(0, index + 1))
    }

    const handleRootClick = () => {
        setCurrentPath([])
    }


    return (
        <div className="border rounded-xl shadow-sm bg-card overflow-hidden flex flex-col h-[600px]">
            {/* Toolbar / Navigation Bar */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 border-b">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNavigateUp}
                        disabled={currentPath.length === 0}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-4 w-px bg-border mx-2" />

                {/* Breadcrumbs */}
                <div className="flex items-center text-sm flex-1 overflow-x-auto no-scrollbar mask-linear-fade">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRootClick}
                        className={cn("h-8 px-2 text-muted-foreground hover:text-foreground", currentPath.length === 0 && "font-semibold text-foreground bg-muted")}
                    >
                        <HardDrive className="h-4 w-4 mr-2" />
                        Root
                    </Button>

                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center animate-in fade-in slide-in-from-left-2 duration-300">
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-0.5" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBreadcrumbClick(index)}
                                className={cn(
                                    "h-8 px-2 text-muted-foreground hover:text-foreground max-w-[150px] truncate block",
                                    index === breadcrumbs.length - 1 && "font-semibold text-foreground bg-muted"
                                )}
                            >
                                {crumb.name}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* File List Area */}
            <div className="flex-1 overflow-auto bg-card">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50%]">Name</TableHead>
                            <TableHead>Date Modified</TableHead>
                            <TableHead>Kind</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentFolderContents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Folder className="h-8 w-8 text-muted-foreground/30" />
                                        <span>This folder is empty</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentFolderContents.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                    onClick={() => handleNavigate(item)}
                                >
                                    <TableCell className="font-medium py-3">
                                        <div className="flex items-center gap-3">
                                            {item.type === 'folder' ? (
                                                <div className="relative">
                                                    <Folder className={cn(
                                                        "h-5 w-5 fill-current transition-colors",
                                                        item.kind === 'project' ? "text-blue-500/90 dark:text-blue-400" : "text-amber-400/90 dark:text-amber-300"
                                                    )} />
                                                </div>
                                            ) : (
                                                <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            )}
                                            <span className="truncate max-w-[300px]">{item.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm py-3">
                                        {item.updatedAt ? item.updatedAt.toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm capitalize py-3">
                                        {item.kind || item.type}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        {item.type === 'file' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                asChild
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                            >
                                                <Link href={item.meta.driveLink} target="_blank">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        {item.type === 'folder' && (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between items-center select-none">
                <span>{currentFolderContents.length} item{currentFolderContents.length !== 1 ? 's' : ''}</span>
                <span className="opacity-50">Local Drive</span>
            </div>
        </div>
    )
}
