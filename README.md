# Stillroom

A professional photography gallery management and sharing platform built for photographers to securely deliver photos to clients and showcase their work.

## Overview

Stillroom is a modern, full-stack web application that enables photographers to:
- Create and manage photo galleries
- Upload and organize photos with automatic metadata extraction
- Share galleries via public URLs or secure, expiring share links
- Control access with public/private gallery settings
- Download photos individually or in bulk
- Showcase work at custom photographer URLs

## Tech Stack

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development

### Backend & CMS
- **PayloadCMS 3** - Headless CMS for content management
- **PostgreSQL** - Database via @payloadcms/db-postgres
- **GraphQL** - API query layer

### Authentication & Authorization
- **Clerk** - User authentication and session management

### Storage
- **Cloudflare R2** - Object storage for photos
- **AWS SDK S3** - S3-compatible API for R2 integration
- **Sharp** - Image processing and optimization

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **next-themes** - Dark mode support
- **Sonner** - Toast notifications

### Additional Features
- **react-dropzone** - Drag-and-drop file uploads
- **date-fns** - Date formatting and manipulation
- **archiver** - Bulk photo downloads as ZIP files

## Project Structure

```
stillroom/
├── app/
│   ├── (main)/                    # Main application routes
│   │   ├── [username]/            # Public photographer profiles
│   │   │   └── [gallerySlug]/     # Public gallery views
│   │   ├── dashboard/             # Photographer dashboard
│   │   │   └── galleries/         # Gallery management
│   │   ├── login/                 # Authentication
│   │   └── share/[token]/         # Shareable gallery links
│   ├── (payload)/                 # PayloadCMS admin panel
│   │   ├── admin/                 # CMS admin UI
│   │   ├── api/                   # CMS API endpoints
│   │   └── graphql/               # GraphQL endpoint
│   └── api/                       # Custom API routes
│       ├── galleries/             # Gallery operations
│       ├── photos/                # Photo management
│       ├── share/                 # Share link generation
│       └── uploads/               # S3 presigned URLs
├── collections/                   # PayloadCMS collections
│   ├── Photographers.ts           # Photographer user accounts
│   ├── Galleries.ts               # Photo galleries
│   ├── Photos.ts                  # Individual photos
│   └── ShareLinks.ts              # Temporary share links
├── components/                    # React components
│   ├── gallery-*.tsx              # Gallery-related components
│   ├── photo.tsx                  # Photo display component
│   ├── share-generator.tsx        # Share link generator
│   └── ui/                        # Reusable UI components
└── lib/                           # Utility functions
```

## Key Features

### Gallery Management
- Create and organize photo galleries
- Set galleries as public or private
- Custom slug-based URLs for easy sharing
- Edit gallery metadata (title, description)
- Delete galleries with automatic photo cleanup

### Photo Operations
- Drag-and-drop photo uploads
- Direct upload to Cloudflare R2 via presigned URLs
- Automatic metadata extraction (dimensions, file size)
- Lightbox viewer with navigation
- Individual photo downloads
- Bulk photo downloads as ZIP
- Bulk photo deletion

### Sharing & Access Control
- Public galleries accessible at `/{username}/{gallery-slug}`
- Private galleries require authentication
- Generate temporary share links with:
  - Expiration dates
  - Download limits
  - Unique tokens for security

### User Experience
- Responsive design for all devices
- Dark mode support
- Real-time upload progress
- Toast notifications for user feedback
- Optimized image loading with Sharp

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Cloudflare R2 bucket
- Clerk account for authentication

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_URL=postgresql://user:password@host:port/database

# Payload CMS
PAYLOAD_SECRET=your-secret-key-here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

# Cloudflare R2 / S3
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=photos
R2_PUBLIC_URL=https://your-r2-public-url
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations (if needed)
npm run payload migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment

This project is configured for deployment on **Cloudflare Pages** with the following setup:

- Build command: `npm run build`
- Build output directory: `.next`
- Node.js compatibility enabled via `wrangler.toml`
- R2 bucket binding configured for photo storage

### Cloudflare Configuration

The `wrangler.toml` file includes:
- R2 bucket binding (`PHOTOS_BUCKET`)
- Node.js compatibility flags
- Pages build output directory

Ensure your Cloudflare environment variables match those in `.env.local`.

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier-compatible formatting (via Tailwind CSS)

## PayloadCMS Collections

### Photographers
User accounts for photographers with authentication credentials and profile information.

### Galleries
Photo galleries with:
- Title and description
- Unique slug for URLs
- Public/private visibility toggle
- Relationship to photographer

### Photos
Individual photos with:
- Relationship to gallery
- R2 storage key
- Dimensions (width, height)
- File size metadata

### ShareLinks
Temporary sharing links with:
- Unique tokens
- Expiration dates
- Download limits
- Relationship to gallery

## API Routes

### Gallery Management
- `GET /api/galleries` - List galleries
- `GET /api/galleries/[galleryId]` - Get gallery details
- `PUT /api/galleries/[galleryId]` - Update gallery
- `DELETE /api/galleries/[galleryId]` - Delete gallery

### Photo Operations
- `POST /api/photos/upload` - Upload photos
- `POST /api/photos/complete` - Complete upload
- `GET /api/photos/[photoId]/download` - Download photo
- `POST /api/photos/bulk-download` - Download multiple photos as ZIP
- `DELETE /api/photos/bulk-delete` - Delete multiple photos

### Sharing
- `POST /api/share` - Generate share link
- `GET /api/uploads/sign` - Get presigned S3 URL

## Contributing

This is a private project. For questions or contributions, please contact the maintainer.

## License

All rights reserved.
