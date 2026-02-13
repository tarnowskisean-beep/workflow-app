"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { getActiveTimer, startTimer as startTimerAction, stopTimer as stopTimerAction, discardTimer as discardTimerAction } from "@/actions/time-actions"

interface TimerType {
    id: string
    projectId: string
    workItemId?: string
    notes?: string
    startedAt: Date
    project?: { name: string }
    workItem?: { title: string }
    taskType?: string
}

interface TimerContextType {
    activeTimer: TimerType | null
    isLoading: boolean
    startTimer: (projectId: string, taskType?: string, workItemId?: string, notes?: string) => Promise<any>
    stopTimer: (notes?: string) => Promise<any>
    discardTimer: () => Promise<any>
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: ReactNode }) {
    const [activeTimer, setActiveTimer] = useState<TimerType | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Poll for active timer on mount (or could pass initial state from server component)
    useEffect(() => {
        const fetchTimer = async () => {
            try {
                const timer = await getActiveTimer()
                if (timer) setActiveTimer(timer as any)
            } finally {
                setIsLoading(false)
            }
        }
        fetchTimer()
    }, [])

    const startTimer = async (projectId: string, taskType?: string, workItemId?: string, notes?: string) => {
        setIsLoading(true)
        let result: any // Declare result outside try block to be accessible for return
        try {
            result = await startTimerAction(projectId, taskType, workItemId, notes)
            if (result.error) {
                // handle error
                console.error(result.error)
            } else if (result.entry) {
                setActiveTimer(result.entry as any)
            }
        } finally {
            setIsLoading(false)
        }
        return result
    }

    const stopTimer = async (notes?: string) => {
        if (!activeTimer) return
        setIsLoading(true)
        const result = await stopTimerAction(activeTimer.id, notes)
        if (result.success) {
            setActiveTimer(null)
        }
        setIsLoading(false)
        return result
    }

    const discardTimer = async () => {
        if (!activeTimer) return
        setIsLoading(true)
        const result = await discardTimerAction(activeTimer.id)
        if (result.success) {
            setActiveTimer(null)
        }
        setIsLoading(false)
        return result
    }

    return (
        <TimerContext.Provider value={{ activeTimer, isLoading, startTimer, stopTimer, discardTimer }}>
            {children}
        </TimerContext.Provider>
    )
}

export function useTimer() {
    const context = useContext(TimerContext)
    if (context === undefined) {
        throw new Error("useTimer must be used within a TimerProvider")
    }
    return context
}
