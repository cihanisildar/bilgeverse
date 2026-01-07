'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Trophy, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Activity {
    name: string;
    participationCount: number;
}

interface FavoriteActivitiesDialogProps {
    activities: Activity[];
}

export default function FavoriteActivitiesDialog({ activities }: FavoriteActivitiesDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 border-pink-200 hover:bg-pink-50 text-pink-700 hover:text-pink-800 transition-all duration-300"
                >
                    <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
                    Sevilen Etkinlikler
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Grubun En Sevdiği Etkinlikler
                    </DialogTitle>
                    <DialogDescription>
                        Sınıfınızda en çok katılım sağlanan ilk 3 etkinlik tipi
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-3">
                    {activities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p>Henüz yeterli etkinlik verisi bulunmuyor.</p>
                        </div>
                    ) : (
                        activities.map((activity, index) => (
                            <div
                                key={activity.name}
                                className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 ${index === 0
                                    ? 'bg-yellow-50/50 border-yellow-200'
                                    : index === 1
                                        ? 'bg-slate-50/50 border-slate-200'
                                        : 'bg-orange-50/50 border-orange-100'
                                    }`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${index === 0
                                            ? 'bg-yellow-100 text-yellow-600'
                                            : index === 1
                                                ? 'bg-slate-100 text-slate-600'
                                                : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {index === 0 ? (
                                                <Trophy className="h-6 w-6" />
                                            ) : (
                                                <span className="text-lg font-bold">#{index + 1}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg leading-tight uppercase tracking-tight">
                                                {activity.name}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                                                <Users className="h-3.5 w-3.5" />
                                                <span>{activity.participationCount} Toplam Katılım</span>
                                            </div>
                                        </div>
                                    </div>

                                    {index === 0 && (
                                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 shadow-none">
                                            Favori
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 text-[10px] text-gray-500 text-center italic">
                    "Bu veriler yalnızca mevcut sınıfınızdaki katılım istatistiklerini baz almaktadır."
                </div>
            </DialogContent>
        </Dialog>
    );
}
