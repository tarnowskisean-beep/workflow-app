import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state") ? cookieStore.get("sidebar_state")?.value === "true" : true

    if (!session) {
        redirect("/login")
    }

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <main className="w-full">
                <div className="flex h-16 items-center border-b px-4 gap-4">
                    <SidebarTrigger />
                    <span className="font-semibold text-sm">Task Management Application</span>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
