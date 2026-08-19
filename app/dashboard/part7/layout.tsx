import { ReactNode } from 'react';
import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import Part7Shell from './Part7Shell';

/**
 * Part 7 (Bilgeverse) sunucu tarafı kapısı.
 *
 * Diğer tüm bölümler `ProtectedPartLayout` ile korunuyordu; part7 ise yalnızca
 * client tarafında rol bakan bir layout'a sahipti. Part 7 artık lisanslanabilir
 * bir paket (Paket 1) olduğu için burada da kurum + rol kontrolü yapılıyor.
 */
export default function Part7Layout({ children }: { children: ReactNode }) {
  return (
    <ProtectedPartLayout partId={7}>
      <Part7Shell>{children}</Part7Shell>
    </ProtectedPartLayout>
  );
}
