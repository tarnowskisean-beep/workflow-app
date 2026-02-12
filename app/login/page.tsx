"use client"

import { useTransition, useState } from "react"
import { authenticate } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans">
            <Card className="w-full max-w-[480px] overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-500">
                <CardContent className="flex flex-col items-center p-8 sm:p-12">
                    {/* Simulated Logo Area */}
                    <div className="mb-8 flex flex-col items-center justify-center">
                        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded bg-[#2C2C2C] px-10 py-4 shadow-sm">
                            <div className="flex items-center gap-3 text-2xl tracking-[0.2em] text-white">
                                <Compass className="h-7 w-7 text-white" strokeWidth={1.5} />
                                <span className="font-light">COMPASS</span>
                            </div>
                            <div className="mt-1 w-full text-center text-[0.65rem] font-medium uppercase tracking-[0.4em] text-gray-300">
                                Professional
                            </div>
                        </div>
                    </div>

                    <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
                        Workflow Management
                    </h1>
                    <p className="mb-8 text-center text-sm font-medium text-slate-500">
                        Professional Employee Portal
                    </p>

                    <form onSubmit={handleSubmit} className="w-full space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                required
                                className="h-11 border-slate-200 bg-slate-50 text-base placeholder:text-slate-400 focus:border-slate-800 focus:ring-0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                Password
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="h-11 border-slate-200 bg-slate-50 text-base placeholder:text-slate-400 focus:border-slate-800 focus:ring-0"
                            />
                        </div>

                        {errorMessage && (
                            <div className="rounded-md bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                                {errorMessage}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="h-11 w-full bg-[#1a202c] text-base font-semibold text-white hover:bg-black"
                            disabled={isPending}
                        >
                            {isPending ? "Signing In..." : "Sign In to Dashboard"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <footer className="mt-12 text-center text-xs text-slate-500">
                <p className="mb-2">© 2026 Compass Professional. All rights reserved.</p>
                <div className="flex justify-center gap-4">
                    <span className="cursor-pointer hover:text-slate-300">Privacy Policy</span>
                    <span>•</span>
                    <span className="cursor-pointer hover:text-slate-300">Terms of Service</span>
                </div>
            </footer>
        </div>
    )
}
