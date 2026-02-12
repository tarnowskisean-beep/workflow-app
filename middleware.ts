import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth
// Force Deployment v5 - Ensure debug-page is accessible

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|debug-page).*)"],
}
