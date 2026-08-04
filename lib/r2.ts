import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
    // R2 does not implement the flexible-checksum headers the SDK adds by default
    // (x-amz-checksum-crc32). Leaving them on breaks presigned PUT signatures.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'photos';

/** Largest original we accept. Mirrors the copy in the uploader dropzone. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
