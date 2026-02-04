import config from '@/payload.config';
import { getPayload } from 'payload'
import { getPayloadHMR } from '@payloadcms/next/utilities';

export const getPayloadClient = async () => {
    return await getPayload({ config });
};
