"use client"

import { useTransition, useState } from "react"
import { authenticate } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Compass } from "lucide-react"

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            const result = await authenticate(undefined, formData)
            if (result) {
                setErrorMessage(result)
            }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="absolute top-8 left-8 flex items-center gap-2 font-semibold text-slate-800">
                <Compass className="h-6 w-6 text-indigo-600" />
                <span>Compass</span>
            </div>

            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access the workspace
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>
                        {errorMessage && (
                            <div className="text-sm text-red-500 font-medium text-center">
                                {errorMessage}
                            </div>
                        )}
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
                            {isPending ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-xs text-muted-foreground">
                        Restricted Access • Professional Workflow System
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
