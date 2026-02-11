"use client"

import { useState } from "react"
import { updateProfile, changePassword } from "@/actions/settings-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function SettingsForm({ user }: { user: { name?: string | null, email?: string | null } }) {
    const [pendingProfile, setPendingProfile] = useState(false)
    const [pendingPassword, setPendingPassword] = useState(false)
    const [profileMsg, setProfileMsg] = useState<string | null>(null)
    const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

    async function handleUpdateProfile(formData: FormData) {
        setPendingProfile(true)
        setProfileMsg(null)
        const result = await updateProfile(formData)
        if (result.error) {
            setProfileMsg(typeof result.error === 'string' ? "Error: " + result.error : "Validation failed")
        } else {
            setProfileMsg("✅ " + result.success)
        }
        setPendingProfile(false)
    }

    async function handleChangePassword(formData: FormData) {
        setPendingPassword(true)
        setPasswordMsg(null)
        const result = await changePassword(formData)
        if (result.error) {
            setPasswordMsg(typeof result.error === 'string' ? "Error: " + result.error : "Validation failed")
        } else {
            setPasswordMsg("✅ " + result.success)
            // Reset form
            const form = document.getElementById("password-form") as HTMLFormElement
            form?.reset()
        }
        setPendingPassword(false)
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your public profile details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user.email || ""} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" name="name" defaultValue={user.name || ""} required />
                        </div>
                        {profileMsg && <div className="text-sm font-medium">{profileMsg}</div>}
                        <Button type="submit" disabled={pendingProfile}>
                            {pendingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Profile
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Ensure your account is using a strong password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="password-form" action={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input id="currentPassword" name="currentPassword" type="password" required />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" name="newPassword" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" name="confirmPassword" type="password" required />
                            </div>
                        </div>
                        {passwordMsg && <div className="text-sm font-medium">{passwordMsg}</div>}
                        <Button type="submit" variant="secondary" disabled={pendingPassword}>
                            {pendingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
