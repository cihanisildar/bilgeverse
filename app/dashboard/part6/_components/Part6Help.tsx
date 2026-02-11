'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Sparkles, Send, Layout, Info, Lightbulb } from 'lucide-react';

export default function Part6Help() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-teal-100 hover:bg-teal-50 transition-all group flex items-center gap-2">
                    <span className="text-sm font-medium text-teal-600">Yönetim Paneli</span>
                    <HelpCircle className="h-4 w-4 text-teal-400 group-hover:text-teal-600 transition-colors" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Info className="h-6 w-6 text-teal-600" />
                        Sosyal Medya Yönetimi Rehberi
                    </DialogTitle>
                    <DialogDescription>
                        Bilgeverse Sosyal Medya panelini nasıl kullanacağınızı öğrenin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <Sparkles className="h-5 w-5 text-cyan-500" />
                            1. İçerik Bileşenleri (Ingredients)
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pl-7">
                            Burası sizin içerik mutfağınızdır. Sürekli kullandığınız <strong>hashtag setlerini</strong>,
                            <strong>metin taslaklarını</strong> veya <strong>medya referanslarını</strong> burada oluşturun.
                            Gönderi hazırlarken bu bileşenleri kopyalayarak hız kazanabilirsiniz.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <Send className="h-5 w-5 text-teal-500" />
                            2. Sosyal Gönderiler
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pl-7">
                            Hazırladığınız içerikleri platformlara göre (Instagram, X, LinkedIn vb.) planlayın.
                            Gönderilerinizin durumunu <strong>Taslak</strong>, <strong>Planlandı</strong> veya <strong>Yayınlandı</strong> olarak takip ederek
                            sosyal medya takviminizi yönetin.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <Layout className="h-5 w-5 text-indigo-500" />
                            3. Belgeler ve Görseller
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pl-7">
                            Ortak kullanıma sunulan marka materyallerine, görsel şablonlarına ve diğer önemli belgelere
                            <strong>Belgeler</strong> sekmesinden hızlıca ulaşabilirsiniz. "Drive'a Git" butonu ile orijinal dosyalara erişebilirsiniz.
                        </p>
                    </section>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                        <Lightbulb className="h-6 w-6 text-amber-500 shrink-0" />
                        <div className="text-sm text-amber-800">
                            <strong>İpucu:</strong> Önce yaygın kullandığınız hashtagleri "Bileşenler" kısmına ekleyin.
                            Yeni bir gönderi oluştururken bu hashtagleri kopyalamak çok daha kolay olacaktır!
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            Anladım, Teşekkürler
                        </Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    );
}
