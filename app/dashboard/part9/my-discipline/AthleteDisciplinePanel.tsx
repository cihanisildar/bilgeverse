'use client';

// Sporcunun kendi disiplin ekranı (salt okunur).
//
// Yönetim tarafındaki DisciplinePanel tüm kulübü listeliyor ve ihlal kaydı
// açıyor; burası yalnız oturumu açan sporcunun kendi kayıtlarını ve kulüp
// yönetmeliğini gösterir. Kayıtlar kişisel veri olduğu için sunucu tarafında
// da athleteId oturumdan türetiliyor (getMyDisciplineOverview).

import { useQuery } from '@tanstack/react-query';
import { getMyDisciplineOverview } from '@/app/actions/athlete-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gavel, ShieldCheck, AlertTriangle, ScrollText } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type Rule = { id: string; code: string | null; offense: string; penalty: string };
type Record_ = {
    id: string;
    offense: string;
    penalty: string;
    date: string;
    note: string | null;
    rule: { code: string | null; offense: string; penalty: string } | null;
};

function fmtDate(d: string | Date) {
    try {
        return format(new Date(d), 'd MMMM yyyy', { locale: tr });
    } catch {
        return '';
    }
}

export default function AthleteDisciplinePanel() {
    const { data: result, isLoading } = useQuery({
        queryKey: ['my-discipline'],
        queryFn: () => getMyDisciplineOverview(),
    });

    if (isLoading) {
        return (
            <div className="grid gap-4">
                {[0, 1].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
        );
    }

    if (result?.error || !result?.data) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                    {result?.error || 'Sporcu profiliniz bulunamadı. Lütfen kulüp yönetimiyle iletişime geçin.'}
                </p>
            </div>
        );
    }

    const { records, rules } = result.data as { records: Record_[]; rules: Rule[] };

    return (
        <div className="space-y-6">
            {/* Durum kartı — sicil temizse sporcunun ilk gördüğü şey bu olsun */}
            {records.length === 0 ? (
                <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-green-50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-emerald-800">Disiplin siciliniz temiz</p>
                            <p className="text-sm text-emerald-700">Adınıza kayıtlı bir disiplin işlemi bulunmuyor.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm bg-gradient-to-r from-rose-50 to-orange-50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-rose-800">
                                {records.length} disiplin kaydınız var
                            </p>
                            <p className="text-sm text-rose-700">
                                Son işlem: {fmtDate(records[0].date)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Kendi kayıtları */}
            {records.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Gavel className="h-5 w-5 text-rose-500" />Disiplin Kayıtlarım
                    </h2>
                    <div className="space-y-2">
                        {records.map((r) => (
                            <Card key={r.id} className="border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {r.rule?.code && (
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                                        Madde {r.rule.code}
                                                    </Badge>
                                                )}
                                                <p className="font-semibold text-gray-800">{r.offense}</p>
                                            </div>
                                            <p className="text-sm text-rose-700 mt-1">
                                                <span className="text-gray-500">Uygulanan yaptırım: </span>{r.penalty}
                                            </p>
                                            {r.note && <p className="text-xs text-gray-500 mt-1">{r.note}</p>}
                                        </div>
                                        <span className="text-sm text-gray-400 whitespace-nowrap">{fmtDate(r.date)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Yönetmelik — sporcu hangi ihlalin hangi cezaya karşılık geldiğini görsün */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-indigo-500" />Disiplin Yönetmeliği
                </h2>
                <p className="text-sm text-gray-500 mb-3">Kulüpte geçerli ihlaller ve karşılık gelen yaptırımlar.</p>

                {rules.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="py-10 text-center text-gray-500">
                            Yönetmelik henüz tanımlanmamış.
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="text-left font-medium px-4 py-2.5 w-20">Madde</th>
                                        <th className="text-left font-medium px-4 py-2.5">İhlal</th>
                                        <th className="text-left font-medium px-4 py-2.5">Yaptırım</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-gray-50/60">
                                            <td className="px-4 py-2.5 text-gray-400 align-top">{rule.code || '—'}</td>
                                            <td className="px-4 py-2.5 text-gray-800 align-top">{rule.offense}</td>
                                            <td className="px-4 py-2.5 text-gray-600 align-top">{rule.penalty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
