import { ReactNode } from 'react';
import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';

/**
 * Etkinlikler menüsel olarak Değerler Halkası Grupları'na (part 2) taşındı,
 * dosyalar ise yerinde kaldı. Bu yüzden erişim part7'ye değil part2'ye göre
 * denetlenir — yalnızca Paket 1 alan bir kurum bu sayfaya URL yazarak da
 * giremesin diye.
 */
export default function EventsLayout({ children }: { children: ReactNode }) {
  return <ProtectedPartLayout partId={2}>{children}</ProtectedPartLayout>;
}
