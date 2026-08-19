/**
 * Yeni bir kurum oluşturulduğunda o kuruma kopyalanan varsayılan kayıtlar.
 *
 * Bunlar eskiden global (tek kurumlu) tablolardı. Çok kurumlu yapıda her kurum
 * kendi kopyasıyla başlar; aksi halde yeni kurumda ne etkinlik tipi ne de aktif
 * dönem olur ve `periodId`'ye bağlı sayfaların tamamı boş gelir.
 *
 * `lib/org-bootstrap.ts` ve `scripts/seed-sport-branches.ts` bu listeleri kullanır.
 */

export const DEFAULT_SPORT_BRANCHES = [
  { name: 'Futbol', description: 'Futbol branşı eğitim ve müsabakaları' },
  { name: 'Basketbol', description: 'Basketbol branşı eğitim ve müsabakaları' },
  { name: 'Voleybol', description: 'Voleybol branşı eğitim ve müsabakaları' },
  { name: 'Yüzme', description: 'Yüzme branşı eğitim ve müsabakaları' },
  { name: 'Okçuluk', description: 'Okçuluk branşı eğitim ve müsabakaları' },
];

export const DEFAULT_EVENT_TYPES = [
  { name: 'Seminer', description: 'Seminer ve konferans etkinlikleri' },
  { name: 'Gezi', description: 'Kültürel ve sosyal geziler' },
  { name: 'Atölye', description: 'Uygulamalı atölye çalışmaları' },
  { name: 'Spor', description: 'Spor etkinlikleri ve turnuvalar' },
  { name: 'Sosyal Sorumluluk', description: 'Gönüllülük ve yardım faaliyetleri' },
];

export const DEFAULT_PART2_EVENT_TYPES = [
  { name: 'Buluşma', description: 'Haftalık grup buluşması' },
  { name: 'Kamp', description: 'Değerler Halkası kampı' },
  { name: 'Veli Toplantısı', description: 'Veli bilgilendirme toplantısı' },
];
