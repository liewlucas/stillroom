import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
// Image bytes go browser -> R2 via presigned PUT, so no route handler ever
// receives a large request body (Vercel caps those at 4.5MB regardless).
const nextConfig = {};

export default withPayload(nextConfig);
