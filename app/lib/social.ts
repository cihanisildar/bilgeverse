import { SocialPlatform, PostStatus, SocialEventType, ContentIdeaStatus } from '@prisma/client';

// --- Platforms (icon names map to lucide-react icons in components) ---
export interface PlatformMeta {
    id: SocialPlatform;
    label: string;
    icon: string; // lucide-react icon component name
    color: string;
    bg: string;
}

export const PLATFORMS: PlatformMeta[] = [
    { id: SocialPlatform.INSTAGRAM, label: 'Instagram', icon: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: SocialPlatform.YOUTUBE, label: 'YouTube', icon: 'Youtube', color: 'text-red-600', bg: 'bg-red-50' },
    { id: SocialPlatform.TIKTOK, label: 'TikTok', icon: 'Music2', color: 'text-gray-900', bg: 'bg-gray-100' },
    { id: SocialPlatform.TWITTER, label: 'Twitter / X', icon: 'Twitter', color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: SocialPlatform.FACEBOOK, label: 'Facebook', icon: 'Facebook', color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: SocialPlatform.LINKEDIN, label: 'LinkedIn', icon: 'Linkedin', color: 'text-blue-800', bg: 'bg-blue-50' },
];

export function getPlatformMeta(id: string): PlatformMeta {
    return PLATFORMS.find((p) => p.id === id) || PLATFORMS[0];
}

// --- Content types (#2) — string-based for flexibility ---
export const CONTENT_TYPES: { value: string; label: string }[] = [
    { value: 'POST', label: 'Gönderi' },
    { value: 'REELS', label: 'Reels' },
    { value: 'STORY', label: 'Hikaye' },
    { value: 'CAROUSEL', label: 'Karusel' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'SHORT', label: 'Short' },
    { value: 'LIVE', label: 'Canlı Yayın' },
    { value: 'TWEET', label: 'Tweet' },
];

export function getContentTypeLabel(value?: string | null): string {
    if (!value) return 'Belirtilmedi';
    return CONTENT_TYPES.find((c) => c.value === value)?.label || value;
}

// --- Statuses (#3) ---
export interface StatusMeta {
    id: PostStatus;
    label: string;
    icon: string;
    color: string;
    bg: string;
}

export const STATUSES: StatusMeta[] = [
    { id: PostStatus.DRAFT, label: 'Taslak', icon: 'FileText', color: 'text-gray-500', bg: 'bg-gray-100' },
    { id: PostStatus.PLANNED, label: 'Planlandı', icon: 'Calendar', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: PostStatus.APPROVED, label: 'Onaylandı', icon: 'CheckCircle2', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: PostStatus.PUBLISHED, label: 'Paylaşıldı', icon: 'Send', color: 'text-violet-500', bg: 'bg-violet-50' },
    { id: PostStatus.ARCHIVED, label: 'Arşivlendi', icon: 'AlertCircle', color: 'text-amber-500', bg: 'bg-amber-50' },
];

export function getStatusMeta(id: string): StatusMeta {
    return STATUSES.find((s) => s.id === id) || STATUSES[0];
}

// --- Social event types (#8) ---
export const EVENT_TYPES: { id: SocialEventType; label: string; color: string; bg: string }[] = [
    { id: SocialEventType.HOLIDAY, label: 'Özel Gün', color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: SocialEventType.EVENT, label: 'Etkinlik', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: SocialEventType.CAMPAIGN, label: 'Kampanya', color: 'text-amber-600', bg: 'bg-amber-50' },
];

export function getEventTypeMeta(id: string) {
    return EVENT_TYPES.find((e) => e.id === id) || EVENT_TYPES[1];
}

// --- Idea statuses (#7) ---
export const IDEA_STATUSES: { id: ContentIdeaStatus; label: string; color: string; bg: string }[] = [
    { id: ContentIdeaStatus.NEW, label: 'Yeni', color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: ContentIdeaStatus.IN_PROGRESS, label: 'Hazırlanıyor', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: ContentIdeaStatus.CONVERTED, label: 'Gönderiye Dönüştü', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: ContentIdeaStatus.ARCHIVED, label: 'Arşiv', color: 'text-gray-500', bg: 'bg-gray-100' },
];

export function getIdeaStatusMeta(id: string) {
    return IDEA_STATUSES.find((s) => s.id === id) || IDEA_STATUSES[0];
}

// --- Sample caption templates (#4) ---
export interface SampleCaption {
    id: string;
    title: string;
    text: string;
}

export const SAMPLE_CAPTIONS: SampleCaption[] = [
    {
        id: 'announcement',
        title: 'Etkinlik Duyurusu',
        text: '📢 Heyecanla duyuruyoruz! [Etkinlik adı] [tarih] tarihinde [yer/platform] üzerinde sizlerle. Kaçırmak istemezsiniz! Detaylar profilimizde 👉 #bilgeverse',
    },
    {
        id: 'motivation',
        title: 'Motivasyon / İlham',
        text: '✨ "Başarı, küçük çabaların her gün tekrarlanmasıyla gelir." Bugün attığın küçük adım, yarının büyük başarısı. Sen de bu yolculuğa katıl! 💪 #motivasyon #eğitim',
    },
    {
        id: 'behind-scenes',
        title: 'Kamera Arkası',
        text: '🎬 Perde arkasından kareler! Ekibimiz [proje/etkinlik] için yoğun çalışıyor. Bu emeğin meyvelerini yakında hep birlikte göreceğiz. 🙌 #kameraarkası',
    },
    {
        id: 'celebration',
        title: 'Özel Gün Kutlaması',
        text: '🎉 [Özel gün] kutlu olsun! Bu anlamlı günde tüm [hedef kitle] yanımızda. Nice güzel günlere birlikte... ❤️ #kutlama',
    },
    {
        id: 'tip',
        title: 'Bilgi / İpucu',
        text: '💡 Biliyor muydun? [İlginç bilgi / ipucu]. Daha fazlası için bizi takipte kal! 📚 #bilgi #öğren',
    },
    {
        id: 'recap',
        title: 'Etkinlik Sonrası',
        text: '🙏 [Etkinlik adı] muhteşemdi! Katılan herkese teşekkür ederiz. Birlikte unutulmaz anlar biriktirdik. Bir sonraki buluşmada görüşmek üzere! 📸 #teşekkürler',
    },
];

// --- Turkish special days seed (#8) — annual recurring (month/day) ---
export interface SpecialDay {
    month: number; // 1-12
    day: number;
    title: string;
}

export const TR_SPECIAL_DAYS: SpecialDay[] = [
    { month: 1, day: 1, title: 'Yılbaşı' },
    { month: 2, day: 14, title: 'Sevgililer Günü' },
    { month: 3, day: 8, title: 'Dünya Kadınlar Günü' },
    { month: 3, day: 18, title: 'Çanakkale Zaferi' },
    { month: 4, day: 23, title: 'Ulusal Egemenlik ve Çocuk Bayramı' },
    { month: 5, day: 1, title: 'Emek ve Dayanışma Günü' },
    { month: 5, day: 19, title: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
    { month: 7, day: 15, title: 'Demokrasi ve Millî Birlik Günü' },
    { month: 8, day: 30, title: 'Zafer Bayramı' },
    { month: 10, day: 29, title: 'Cumhuriyet Bayramı' },
    { month: 11, day: 10, title: "Atatürk'ü Anma Günü" },
    { month: 11, day: 24, title: 'Öğretmenler Günü' },
];

/**
 * Returns upcoming special days within the given window (days from today).
 * Recurs annually — computes this year's (or next year's) occurrence.
 */
export function getUpcomingFromSpecialDays(
    windowDays: number = 30,
    from: Date = new Date()
): { title: string; date: Date; daysUntil: number }[] {
    const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const result: { title: string; date: Date; daysUntil: number }[] = [];

    for (const sd of TR_SPECIAL_DAYS) {
        let occurrence = new Date(today.getFullYear(), sd.month - 1, sd.day);
        if (occurrence < today) {
            occurrence = new Date(today.getFullYear() + 1, sd.month - 1, sd.day);
        }
        const daysUntil = Math.round((occurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= windowDays) {
            result.push({ title: sd.title, date: occurrence, daysUntil });
        }
    }

    return result.sort((a, b) => a.daysUntil - b.daysUntil);
}
