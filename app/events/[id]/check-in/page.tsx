'use client';

import { useParams, useSearchParams } from 'next/navigation';
import CheckInComponent from '@/app/components/CheckInComponent';

export default function PublicCheckInPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const eventId = params.id as string;
    const qrToken = searchParams.get('token') || undefined;

    return (
        <CheckInComponent
            eventId={eventId}
            qrToken={qrToken}
            redirectUrl={`/events/${eventId}`}
        />
    );
}
