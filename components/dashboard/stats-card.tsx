import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import Link from "next/link"

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: "up" | "down" | "neutral"
    className?: string
    href?: string
    variant?: "default" | "destructive" | "warning"
}

export function StatsCard({ title, value, icon: Icon, description, trend, className, href, variant = "default" }: StatsCardProps) {
    const variantStyles = {
        default: "",
        destructive: "border-red-200 bg-red-50 text-red-900 hover:bg-red-100",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-900 hover:bg-yellow-100"
    }

    const iconStyles = {
        default: "text-muted-foreground",
        destructive: "text-red-500",
        warning: "text-yellow-500"
    }

    const Content = (
        <Card className={cn(
            className,
            "h-full transition-all",
            href && "hover:shadow-md cursor-pointer",
            variantStyles[variant]
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-sm font-medium", variant === "destructive" && "text-red-700", variant === "warning" && "text-yellow-700")}>
                    {title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", iconStyles[variant])} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className={cn("text-xs mt-1", variant === "default" ? "text-muted-foreground" : "opacity-80")}>
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )

    if (href) {
        return <Link href={href}>{Content}</Link>
    }

    return Content
}
