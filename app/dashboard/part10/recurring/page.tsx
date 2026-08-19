import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RecurringTasksView from './RecurringTasksView';

export default function RecurringTasksPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/part10">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Gençlik Merkezine Dön</Button>
                </Link>
                <RecurringTasksView />
            </div>
        </div>
    );
}
