import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    providers: [],
    session: { strategy: "jwt" },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isLoginPage = nextUrl.pathname.startsWith('/login')

            // Define public pages
            const isPublicPage = isLoginPage


            console.log("Middleware Auth Check:", {
                pathname: nextUrl.pathname,
                isLoggedIn,
                isPublicPage
            })

            if (isPublicPage) {
                if (isLoggedIn) {
                    // If logged in and on login page, redirect to dashboard
                    return Response.redirect(new URL('/dashboard', nextUrl))
                }
                // Allow access to login page
                return true
            }

            // All other pages are protected by default (application routes)
            // If not logged in, redirect to login
            if (!isLoggedIn) {
                return false
            }

            // Allow access to protected pages
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                console.log("JWT Callback: User role:", user.role)
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session?.user && token?.sub) {
                session.user.id = token.sub
                session.user.role = token.role as string
                console.log("Session Callback: User role set to:", session.user.role)
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
} satisfies NextAuthConfig
