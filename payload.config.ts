import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';
import { Photographers } from './collections/Photographers';
import { Galleries } from './collections/Galleries';
import { Photos } from './collections/Photos';
import { ShareLinks } from './collections/ShareLinks';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
    admin: {
        user: 'photographers', // Use photographers collection for login (or create a dedicated 'users' collection)
    },
    collections: [Photographers, Galleries, Photos, ShareLinks],
    editor: lexicalEditor({}),
    secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: postgresAdapter({
        pool: {
            connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        },
    }),
});
