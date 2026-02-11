import { z } from "zod";

export type ActionState<T> = {
    data?: T;
    error?: string;
};

/**
 * Wraps a server action with standardized error handling and optional Zod validation.
 * 
 * @param schema - Zod schema to validate input (optional)
 * @param action - The async server action logic
 * @returns A wrapped server action that handles errors consistently
 */
export const safeAction = <TInput, TOutput>(
    schema: z.Schema<TInput> | null,
    action: (data: TInput) => Promise<TOutput>
) => {
    return async (data: TInput): Promise<ActionState<TOutput>> => {
        try {
            if (schema) {
                const parsed = schema.safeParse(data);
                if (!parsed.success) {
                    return { error: parsed.error.message };
                }
                return { data: await action(parsed.data) };
            }
            return { data: await action(data) };
        } catch (e: any) {
            // Log the error internally (e.g. Sentry/console)
            console.error("Server Action Error:", e);

            // Return a safe error message to the client
            // In dev, maybe expose more, but in prod stick to generic unless specific
            if (e instanceof Error && (e.message === "Unauthorized" || e.message.includes("Invalid"))) {
                return { error: e.message };
            }
            return { error: "An unexpected error occurred." };
        }
    };
};
