import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/api/photos/upload', '/api/share']);

export default clerkMiddleware(async (auth, req) => {
    if (isDashboardRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
