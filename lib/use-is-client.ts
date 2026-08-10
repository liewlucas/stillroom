'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => { };

/**
 * True only after hydration.
 *
 * Device capabilities (share sheet support, in-app browser, localStorage) can
 * only be read on the client, but reading them in an effect and storing them in
 * state causes a cascading re-render. This lets them be derived during render
 * while keeping the server and first client render identical.
 */
export function useIsClient() {
    return useSyncExternalStore(subscribe, () => true, () => false);
}
