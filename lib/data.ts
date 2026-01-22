import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@/payload.config';

export const getPayloadClient = async () => {
    return await getPayloadHMR({ config });
};
