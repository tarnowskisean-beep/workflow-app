"use client"

import { TimerProvider } from "@/components/providers/timer-provider"
import { GlobalTimer } from "@/components/work/global-timer"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TimerProvider>
            {children}
            <GlobalTimer />
        </TimerProvider>
    )
}
