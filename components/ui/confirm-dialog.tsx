'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    /** When true, the confirm button uses a destructive (red) style. Defaults to true. */
    destructive?: boolean;
    /** Disable the confirm button (e.g. while the mutation is pending). */
    loading?: boolean;
}

/**
 * Reusable confirmation dialog for destructive actions. Replaces ad-hoc inline
 * AlertDialogs and silent deletes so every "are you sure?" looks the same.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = 'Emin misiniz?',
    description = 'Bu işlem geri alınamaz.',
    confirmText = 'Evet, Sil',
    cancelText = 'Vazgeç',
    destructive = true,
    loading = false,
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className={
                            destructive
                                ? 'bg-rose-600 hover:bg-rose-700 text-white border-none'
                                : undefined
                        }
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmDialog;
