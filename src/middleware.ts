import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protegemos todas las rutas (dashboard) excepto el portal de alumnos, login y webhooks públicos
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/webhooks(.*)', '/student(.*)']);

export default clerkMiddleware(async (auth, request) => {
    const isStudentRoute = request.nextUrl.pathname.startsWith('/student');
    const isStudentLogin = request.nextUrl.pathname.startsWith('/student/login');

    if (!isPublicRoute(request) && !isStudentRoute) {
        await auth.protect();
    }

    if (isStudentRoute && !isStudentLogin) {
        const studentCookie = request.cookies.get("studentToken");
        if (!studentCookie?.value) {
            const url = new URL('/student/login', request.url);
            return Response.redirect(url);
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
