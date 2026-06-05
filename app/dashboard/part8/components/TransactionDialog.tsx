'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FinanceType } from '@prisma/client';
import { CURRENCIES, categoriesFor } from '@/app/lib/finance';
import { FinanceTransaction } from '@/types/finance';
import {
    createFinanceTransaction,
    updateFinanceTransaction,
} from '@/app/actions/finance';

interface TransactionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type: FinanceType;
    transaction?: FinanceTransaction | null;
}

const toDateInput = (d: Date | string) => new Date(d).toISOString().split('T')[0];

export default function TransactionDialog({ isOpen, onClose, type, transaction }: TransactionDialogProps) {
    const queryClient = useQueryClient();
    const isEdit = !!transaction;
    const isIncome = type === 'INCOME';

    const categories = categoriesFor(type);

    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('TL');
    const [category, setCategory] = useState<string>(categories[0].value);
    const [source, setSource] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(toDateInput(new Date()));

    useEffect(() => {
        if (isOpen) {
            if (transaction) {
                setAmount(String(transaction.amount));
                setCurrency(transaction.currency);
                setCategory(transaction.category);
                setSource(transaction.source ?? '');
                setDescription(transaction.description ?? '');
                setDate(toDateInput(transaction.transactionDate));
            } else {
                setAmount('');
                setCurrency('TL');
                setCategory(categories[0].value);
                setSource('');
                setDescription('');
                setDate(toDateInput(new Date()));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, transaction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseFloat(amount);
        if (!amount || isNaN(parsed) || parsed <= 0) {
            toast.error('Lütfen geçerli bir tutar girin');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                amount: parsed,
                currency: currency as any,
                category,
                source: source || null,
                description: description || null,
                transactionDate: new Date(date),
            };

            const res = isEdit
                ? await updateFinanceTransaction(transaction!.id, payload)
                : await createFinanceTransaction({ type, ...payload });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(isEdit ? 'İşlem güncellendi' : 'İşlem kaydedildi');
                queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
                queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
                queryClient.invalidateQueries({ queryKey: ['monthly-report'] });
                onClose();
            }
        } catch (err) {
            toast.error('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const accent = isIncome ? 'emerald' : 'rose';
    const title = isEdit
        ? isIncome ? 'Geliri Düzenle' : 'Gideri Düzenle'
        : isIncome ? 'Yeni Gelir Ekle' : 'Yeni Gider Ekle';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {isIncome
                            ? 'Bağış, ödeme veya diğer gelirleri kaydedin.'
                            : 'Personel, kira, etkinlik veya malzeme giderlerini kaydedin.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Tutar *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Para Birimi *</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label} {c.symbol && `(${c.symbol})`}{c.unit && `(${c.unit})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{isIncome ? 'Gelir Türü *' : 'Gider Kategorisi *'}</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="source">{isIncome ? 'Gelir Kaynağı' : 'Tedarikçi / Kaynak'}</Label>
                        <Input
                            id="source"
                            placeholder={isIncome ? 'Örn. Hayırsever, Etkinlik...' : 'Örn. Firma adı...'}
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Tarih *</Label>
                        <Input
                            id="date"
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama</Label>
                        <Textarea
                            id="description"
                            rows={2}
                            placeholder="İsteğe bağlı açıklama..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={
                                accent === 'emerald'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                            }
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
