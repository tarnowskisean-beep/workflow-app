"use client"

import { useState } from "react"
import { markAsRead, markAllAsRead } from "@/actions/notification-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, MailOpen, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    createdAt: Date
    link?: string | null
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
    const [optimisticNotifications, setOptimisticNotifications] = useState(notifications)

    async function handleMarkAsRead(id: string) {
        setOptimisticNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        await markAsRead(id)
    }

    async function handleMarkAllRead() {
        setOptimisticNotifications(prev => prev.map(n => ({ ...n, read: true })))
        await markAllAsRead()
    }

    const unreadCount = optimisticNotifications.filter(n => !n.read).length

    if (optimisticNotifications.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <MailOpen className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">All caught up!</p>
                    <p className="text-sm">You have no new notifications.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">Recent Alerts</h2>
                    <p className="text-sm text-muted-foreground">
                        You have {unreadCount} unread message{unreadCount !== 1 && 's'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {optimisticNotifications.map((notification) => (
                    <Card key={notification.id} className={`transition-all hover:shadow-md ${notification.read ? "opacity-75 bg-slate-50 border-slate-200" : "bg-white border-l-4 border-l-indigo-500 shadow-sm"}`}>
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-full ${notification.read ? "bg-slate-200" : "bg-indigo-50"}`}>
                                {notification.type === "SUCCESS" && <CheckCircle className={`h-5 w-5 ${notification.read ? "text-slate-500" : "text-green-600"}`} />}
                                {notification.type === "WARNING" && <AlertTriangle className={`h-5 w-5 ${notification.read ? "text-slate-500" : "text-yellow-600"}`} />}
                                {notification.type === "ERROR" && <AlertCircle className={`h-5 w-5 ${notification.read ? "text-slate-500" : "text-red-600"}`} />}
                                {(notification.type === "INFO" || !notification.type) && <Info className={`h-5 w-5 ${notification.read ? "text-slate-500" : "text-blue-600"}`} />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h4 className={`text-base font-medium ${notification.read ? "text-slate-700" : "text-slate-900"}`}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {notification.message}
                                </p>
                                {notification.link && (
                                    <div className="pt-2">
                                        <a href={notification.link} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                            View Details <div className="i-lucide-arrow-right h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                            {!notification.read && (
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-indigo-600" onClick={() => handleMarkAsRead(notification.id)} title="Mark as read">
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
