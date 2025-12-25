'use client';

import toast from 'react-hot-toast';

/**
 * Custom hook for toast notifications
 * Re-exports react-hot-toast to provide a consistent interface across the application
 */
export function useToast() {
    return toast;
}
