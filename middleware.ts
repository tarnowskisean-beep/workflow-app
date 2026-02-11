import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

const authConfig = {
    providers: [],
    session: { strategy: "jwt" },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isLoginPage = nextUrl.pathname.startsWith('/login')

            // Define public pages (only login for now)
            const isPublicPage = isLoginPage

            if (isPublicPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/dashboard', nextUrl))
                }
                return true
            }

            if (!isLoggedIn) {
                return false
            }

            return true
        },
    },
    pages: {
        signIn: '/login',
    },
} satisfies NextAuthConfig

export default NextAuth(authConfig).auth

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
