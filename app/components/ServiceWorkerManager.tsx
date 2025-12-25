'use client';

import { useEffect } from 'react';

export default function ServiceWorkerManager() {
    useEffect(() => {
        // Only run in development to avoid service worker issues
        if (process.env.NODE_ENV === 'development') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => {
                        registration.unregister();
                    });
                });
            }
        }
    }, []);

    return null;
}
