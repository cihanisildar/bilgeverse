'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Pencil, Trash2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, getCategoryLabel } from '@/app/lib/finance';
import { FinanceTransaction } from '@/types/finance';
import { deleteFinanceTransaction } from '@/app/actions/finance';

interface TransactionTableProps {
    transactions: FinanceTransaction[];
    onEdit: (t: FinanceTransaction) => void;
    /** hide the category column when the table is already grouped by category */
    hideCategory?: boolean;
    emptyText?: string;
}

export default function TransactionTable({
    transactions,
    onEdit,
    hideCategory,
    emptyText = 'Kayıt bulunamadı.',
}: TransactionTableProps) {
    const queryClient = useQueryClient();
    const [deleteTarget, setDeleteTarget] = useState<FinanceTransaction | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await deleteFinanceTransaction(deleteTarget.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('İşlem silindi');
                queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
                queryClient.invalidateQueries({ queryKey: ['monthly-report'] });
            }
        } catch {
            toast.error('Bir hata oluştu');
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    if (transactions.length === 0) {
        return <div className="py-12 text-center text-sm text-muted-foreground">{emptyText}</div>;
    }

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Tarih</TableHead>
                            {!hideCategory && <TableHead>Kategori</TableHead>}
                            <TableHead>Kaynak</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Tutar</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((t) => {
                            const locked = !!t.donationId;
                            return (
                                <TableRow key={t.id}>
                                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                        {new Date(t.transactionDate).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    {!hideCategory && (
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">
                                                {getCategoryLabel(t.type, t.category)}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-sm">
                                        <span className="flex items-center gap-1.5">
                                            {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                            {t.source || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate">
                                        {t.description || '—'}
                                    </TableCell>
                                    <TableCell
                                        className={`text-right font-semibold whitespace-nowrap ${
                                            t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                    >
                                        {t.type === 'INCOME' ? '+' : '−'}
                                        {formatCurrency(t.amount, t.currency)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onEdit(t)}
                                                disabled={locked}
                                                title={locked ? 'Bağışa bağlı kayıt — Bağışçılar bölümünden düzenleyin' : 'Düzenle'}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600 hover:text-rose-700"
                                                onClick={() => setDeleteTarget(t)}
                                                disabled={locked}
                                                title={locked ? 'Bağışa bağlı kayıt — Bağışçılar bölümünden silin' : 'Sil'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>İşlemi sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu kayıt kalıcı olarak silinecek ve kasa bakiyesinden düşülecektir. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={deleting}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            {deleting ? 'Siliniyor...' : 'Sil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
