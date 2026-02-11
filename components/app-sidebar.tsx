"use strict"

import { Calendar, Home, Inbox, Search, Settings, FileClock, CheckSquare, Users, Folder, DollarSign, LayoutTemplate, BarChart, Briefcase, FileText } from "lucide-react"
import Link from "next/link"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { signOut, auth } from "@/auth"

// Menu items.
const items = [
    {
        title: "Insights",
        url: "/dashboard",
        icon: BarChart,
    },
    {
        title: "Reports",
        url: "/reports",
        icon: FileText,
    },
    {
        title: "Work",
        url: "/work",
        icon: CheckSquare,
    },
    {
        title: "Time",
        url: "/time",
        icon: FileClock,
    },
    {
        title: "Projects",
        url: "/projects",
        icon: Briefcase,
    },
    {
        title: "Templates",
        url: "/templates",
        icon: LayoutTemplate,
    },
    {
        title: "Files",
        url: "/files",
        icon: Folder,
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
    },
]



export async function AppSidebar() {
    const session = await auth()
    const role = session?.user?.role || "ASSOCIATE"

    const filteredItems = items.filter(item => {
        if (item.title === "Reports") {
            return role === "ADMIN" || role === "MANAGER"
        }
        return true
    })

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-4">
                <div className="flex flex-row items-center gap-3 group-data-[collapsible=icon]:!p-0">
                    {/* Compass Logo - White version for dark sidebar */}
                    <img
                        src="https://images.squarespace-cdn.com/content/v1/6284f705d45c7c5c809341df/1cb7444a-3f08-42c9-8d5b-58db77f873b3/download+%281%29.png?format=1500w"
                        alt="Compass Logo"
                        className="h-6 w-auto object-contain brightness-0 invert"
                    />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <Separator />
            </SidebarContent>
            <SidebarFooter className="p-4">
                <form action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                }}>
                    <button className="flex w-full items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
                        Sign Out
                    </button>
                </form>
            </SidebarFooter>
        </Sidebar>
    )
}
