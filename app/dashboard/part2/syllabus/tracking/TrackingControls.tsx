'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/app/hooks/use-debounce';

export default function TrackingControls() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSearch = searchParams.get('q') || '';

    const [searchValue, setSearchValue] = useState(currentSearch);
    const debouncedSearch = useDebounce(searchValue, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch) {
            params.set('q', debouncedSearch);
        } else {
            params.delete('q');
        }
        // Reset to page 1 on search
        params.delete('p');

        router.push(`/dashboard/part2/syllabus/tracking?${params.toString()}`);
    }, [debouncedSearch, router, searchParams]);

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Sınıf veya öğretmen ara..."
                className="pl-10 bg-white/80 backdrop-blur-sm border-cyan-100 focus:ring-cyan-500 rounded-lg shadow-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
            />
        </div>
    );
}
