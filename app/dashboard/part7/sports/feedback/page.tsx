'use client';

import React from 'react';
import SportFeedbackPanel from '@/app/dashboard/part9/_components/SportFeedbackPanel';

// part9'daki gibi yönetici kısıtı yok — geri bildirim sporcunun da kullandığı
// bir ekran. Menüde şimdilik yalnız yönetici/rehber tarafında listeleniyor.
export default function Part7SportsFeedbackPage() {
    return <SportFeedbackPanel />;
}
