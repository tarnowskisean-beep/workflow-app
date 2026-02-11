
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@prisma/client"

interface ProjectTeamCardProps {
    manager: User | null
    senior: User | null
    associate: User | null
}

export function ProjectTeamCard({ manager, senior, associate }: ProjectTeamCardProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Core Team</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Manager</p>
                        <p className="text-xs text-muted-foreground">
                            {manager ? (manager.name || manager.email) : "Unassigned"}
                        </p>
                    </div>
                    {manager ? (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={manager.avatarUrl || ""} />
                            <AvatarFallback>{manager.name?.[0] || "M"}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-dashed flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">-</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Senior</p>
                        <p className="text-xs text-muted-foreground">
                            {senior ? (senior.name || senior.email) : "Unassigned"}
                        </p>
                    </div>
                    {senior ? (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={senior.avatarUrl || ""} />
                            <AvatarFallback>{senior.name?.[0] || "S"}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-dashed flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">-</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Associate</p>
                        <p className="text-xs text-muted-foreground">
                            {associate ? (associate.name || associate.email) : "Unassigned"}
                        </p>
                    </div>
                    {associate ? (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={associate.avatarUrl || ""} />
                            <AvatarFallback>{associate.name?.[0] || "A"}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-dashed flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">-</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
