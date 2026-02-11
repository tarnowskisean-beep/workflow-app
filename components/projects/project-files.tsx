"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface ProjectFilesProps {
    files: any[] // WorkItems
}

export function ProjectFiles({ files }: ProjectFilesProps) {
    // Filter for items with driveLink
    const documents = files.filter(f => f.driveLink)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Documents</CardTitle>
                <CardDescription>
                    Files and deliverables linked to this project's tasks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-dashed border-2">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No documents found.</p>
                    </div>
                ) : (
                    <div className="border rounded-lg divide-y">
                        {documents.map((file) => (
                            <div key={file.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        {file.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        {file.status === "DONE" && <Badge variant="outline" className="text-[10px] h-5">Completed</Badge>}
                                        <span className="text-xs text-muted-foreground">• {new Date(file.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {file.driveLink && (
                                        <Link
                                            href={file.driveLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            Open <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
