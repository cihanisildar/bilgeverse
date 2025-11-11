'use client';

import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";
import { AnnouncementsSkeleton } from "@/components/announcements-skeleton";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
  };
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements");
        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setAnnouncements(data);
        } else {
          console.error("Unexpected response format:", data);
          setAnnouncements([]);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast({
          title: "Error",
          description: "Failed to fetch announcements",
          variant: "destructive",
        });
        setAnnouncements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              Duyuru Panosu
            </h1>
            <p className="text-gray-500 text-sm mt-1">Öğrenciler için yapılan duyuruları takip edin</p>
          </div>
        </div>

        {isLoading ? (
          <AnnouncementsSkeleton />
        ) : announcements.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-100 p-4 rounded-full">
                <Bell className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Henüz duyuru bulunmamaktadır</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Yeni duyurular eklendiğinde burada görüntülenecektir.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {announcements.map((announcement) => (
              <Card 
                key={announcement.id} 
                className="p-6 hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm border-l-4 border-l-blue-500 group"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {announcement.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="block w-1 h-1 rounded-full bg-blue-500"></span>
                      </span>
                      {format(new Date(announcement.createdAt), "dd.MM.yyyy HH:mm")} -{" "}
                      {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                    </p>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 