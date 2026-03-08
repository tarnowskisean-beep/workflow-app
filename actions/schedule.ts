"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSchedulesForDateRange(startDate: Date, endDate: Date) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Fetch all active users (to build the grid Y-axis) and their schedules in range
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            schedules: {
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    return users;
}

export async function upsertSchedule({
    userId,
    date,
    status,
    notes,
}: {
    userId: string;
    date: Date;
    status: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // We could add permission checks here (e.g. only MANAGER/ADMIN can edit others' schedules)
    // For now, allow logged in users to adjust schedules.

    if (!status) {
        // If status is cleared, we can delete the record or ignore it depending on exact requirements.
        // Assuming empty status means deleting the schedule for that day.
        try {
            await prisma.schedule.delete({
                where: {
                    userId_date: {
                        userId,
                        date,
                    },
                },
            });
        } catch (e) {
            // Ignore error if it doesn't exist
        }
    } else {
        await prisma.schedule.upsert({
            where: {
                userId_date: {
                    userId,
                    date,
                },
            },
            update: {
                status,
                notes: notes || null,
            },
            create: {
                userId,
                date,
                status,
                notes: notes || null,
            },
        });
    }

    revalidatePath("/schedule");
    return { success: true };
}
