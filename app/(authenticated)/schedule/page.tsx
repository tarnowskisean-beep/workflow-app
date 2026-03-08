"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyGrid } from "@/components/schedule/weekly-grid";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { ScheduleStats } from "@/components/schedule/schedule-stats";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, LayoutGrid, BarChart3 } from "lucide-react";

export default function SchedulePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const initialTab = searchParams.get("tab") || "week";
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync state to URL 
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Schedule</h1>
                    <p className="text-muted-foreground mt-1">
                        Track daily locations and availability
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3 sm:w-[350px]">
                        <TabsTrigger value="week" className="flex items-center gap-1.5 text-xs">
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Weekly Input
                        </TabsTrigger>
                        <TabsTrigger value="month" className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            Monthly View
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="flex items-center gap-1.5 text-xs">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="mt-6 animation-fade-in relative min-h-[500px]">
                {activeTab === "week" && <WeeklyGrid />}
                {activeTab === "month" && <ScheduleCalendar />}
                {activeTab === "stats" && <ScheduleStats />}
            </div>
        </div>
    );
}
