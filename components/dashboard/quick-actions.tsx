"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Clock, FileText, UserPlus } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center hover:border-primary/50 hover:text-primary">
                    <Link href="/templates">
                        <Plus className="h-5 w-5" />
                        <span>Run Template</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center hover:border-primary/50 hover:text-primary">
                    <Link href="/time">
                        <Clock className="h-5 w-5" />
                        <span>Log Time</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center hover:border-primary/50 hover:text-primary">
                    <Link href="/clients/new">
                        <UserPlus className="h-5 w-5" />
                        <span>New Client</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center hover:border-primary/50 hover:text-primary">
                    <Link href="/work">
                        <FileText className="h-5 w-5" />
                        <span>View All Work</span>
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
