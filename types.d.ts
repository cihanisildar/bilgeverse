declare module 'react-hot-toast' {
  import { ReactNode } from 'react';
  
  export interface ToastOptions {
    id?: string;
    icon?: ReactNode;
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
  }
  
  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
    toastOptions?: ToastOptions;
  }
  
  interface Toast {
    (message: ReactNode, options?: ToastOptions): string;
    error: (message: ReactNode, options?: ToastOptions) => string;
    success: (message: ReactNode, options?: ToastOptions) => string;
    loading: (message: ReactNode, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
  }
  
  export const toast: Toast;
  export function Toaster(props?: ToasterProps): JSX.Element;
  
  export default toast;
} 