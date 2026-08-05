import config from '@/payload.config';
import { getPayload } from 'payload'

export const getPayloadClient = async () => {
    return await getPayload({ config });
};
