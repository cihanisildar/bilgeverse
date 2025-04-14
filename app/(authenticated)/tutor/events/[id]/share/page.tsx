"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  Download,
  Facebook,
  Link2,
  Linkedin,
  Mail,
  MessageSquare,
  QrCode,
  Settings2,
  Share2,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: "online" | "in-person" | "hybrid";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  capacity: number;
  enrolledStudents: number;
};

const socialPlatforms = [
  {
    name: "Facebook",
    icon: <Facebook className="h-4 w-4" />,
    color: "bg-blue-600",
    textColor: "text-white",
    link: (url: string, title: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}&quote=${encodeURIComponent(title)}`,
  },
  {
    name: "Twitter",
    icon: <Twitter className="h-4 w-4" />,
    color: "bg-sky-500",
    textColor: "text-white",
    link: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "LinkedIn",
    icon: <Linkedin className="h-4 w-4" />,
    color: "bg-blue-700",
    textColor: "text-white",
    link: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}&title=${encodeURIComponent(title)}`,
  },
  {
    name: "WhatsApp",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "bg-green-500",
    textColor: "text-white",
    link: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
];

export default function ShareEvent() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareableLink, setShareableLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [reminderOption, setReminderOption] = useState("google");
  const [shareAccessOption, setShareAccessOption] = useState("link");
  const [shareSettings, setShareSettings] = useState({
    requireLogin: false,
    trackClicks: true,
    expireAfter: "never",
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/events/${eventId}`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch event details");
        }

        const data = await response.json();
        const eventData = data.event;

        const formattedEvent = {
          id: eventData._id || eventData.id,
          title: eventData.title,
          description: eventData.description,
          startDate: eventData.startDateTime || eventData.startDate,
          endDate: eventData.endDateTime || eventData.endDate,
          location: eventData.location,
          type: eventData.type,
          status: eventData.status,
          capacity: eventData.capacity,
          enrolledStudents: eventData.enrolledStudents || 0,
        };

        setEvent(formattedEvent);

        // Set shareable link
        setShareableLink(
          `${window.location.origin}/events/${formattedEvent.id}/join`
        );

        // Pre-populate email fields
        if (formattedEvent) {
          setEmailSubject(`Davet: ${formattedEvent.title}`);

          const eventDate = new Date(formattedEvent.startDate);
          const formattedDate = new Intl.DateTimeFormat("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(eventDate);

          setEmailBody(
            `Merhaba,

"${formattedEvent.title}" etkinliğine davetlisiniz!

Tarih ve Saat: ${formattedDate}
Konum: ${formattedEvent.location}

Etkinlik açıklaması:
${formattedEvent.description}

Etkinliğe katılmak için lütfen aşağıdaki bağlantıyı kullanın:
${window.location.origin}/events/${formattedEvent.id}/join

Saygılarımızla,
Öğretmen Takip Sistemi`
          );
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        setError("Etkinlik bilgileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setLinkCopied(true);

    toast({
      title: "Bağlantı kopyalandı",
      description: "Etkinlik bağlantısı panoya kopyalandı.",
    });

    // Reset the copied state after a delay
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareViaEmail = () => {
    if (!emailRecipients.trim()) {
      toast({
        title: "Alıcı belirtilmedi",
        description: "Lütfen en az bir e-posta adresi girin.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, send an API request to send emails

    toast({
      title: "E-posta gönderildi",
      description: "Etkinlik davetiyesi e-posta ile gönderildi.",
    });
  };

  const downloadCalendarFile = (type: string) => {
    if (!event) return;

    // In a real app, generate and download an .ics file

    toast({
      title: "Takvim dosyası indirildi",
      description: `Etkinlik ${
        type === "ics" ? "ICS" : "Google Takvim"
      } formatında indirildi.`,
    });
  };

  const downloadQrCode = () => {
    // In a real app, generate and download a QR code

    toast({
      title: "QR kodu indirildi",
      description: "Etkinlik QR kodu indirildi.",
    });
  };

  const handleShareSocialMedia = (platform: any) => {
    if (!event) return;

    const shareUrl = platform.link(shareableLink, event.title);
    window.open(shareUrl, "_blank");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {error || "Etkinlik bulunamadı"}
          </h2>
          <p className="text-red-600 mb-4">
            İstediğiniz etkinlik mevcut değil veya erişim izniniz yok.
          </p>
          <Button asChild>
            <Link href="/tutor/events">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Etkinlik Listesine Dön
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Etkinliği Paylaş
            </span>
          </h1>
          <p className="text-gray-500">{event.title}</p>
        </div>{" "}
        <Button variant="outline" size="sm" className="mr-4" asChild>
          <Link href={`/tutor/events/${eventId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Etkinliğe Dön
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="link" className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">
                    Paylaşım Seçenekleri
                  </CardTitle>
                  <TabsList>
                    <TabsTrigger value="link" className="flex items-center">
                      <Link2 className="mr-2 h-4 w-4" />
                      Bağlantı
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      E-posta
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Takvim
                    </TabsTrigger>
                    <TabsTrigger value="qr" className="flex items-center">
                      <QrCode className="mr-2 h-4 w-4" />
                      QR Kod
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Etkinliğinizi öğrencilerle farklı yollarla paylaşın
                </CardDescription>
              </CardHeader>

              <CardContent>
                <TabsContent value="link" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shareLink" className="mb-2 block">
                        Paylaşım Bağlantısı
                      </Label>
                      <div className="flex">
                        <Input
                          id="shareLink"
                          value={shareableLink}
                          readOnly
                          className="rounded-r-none"
                        />
                        <Button className="rounded-l-none" onClick={copyLink}>
                          {linkCopied ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Kopyalandı!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Kopyala
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-base font-medium mb-3">
                        Sosyal Medyada Paylaş
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {socialPlatforms.map((platform, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className={`${platform.color} ${platform.textColor} border-none hover:opacity-90`}
                            onClick={() => handleShareSocialMedia(platform)}
                          >
                            {platform.icon}
                            <span className="ml-2">{platform.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-medium">
                          Paylaşım Ayarları
                        </h3>
                        <Settings2 className="h-4 w-4 text-gray-500" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="requireLogin">
                              Giriş Zorunluluğu
                            </Label>
                            <p className="text-sm text-gray-500">
                              Öğrencilerin etkinlik için giriş yapması gerekir
                            </p>
                          </div>
                          <Switch
                            id="requireLogin"
                            checked={shareSettings.requireLogin}
                            onCheckedChange={(checked) =>
                              setShareSettings({
                                ...shareSettings,
                                requireLogin: checked,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="trackClicks">
                              Tıklamaları Takip Et
                            </Label>
                            <p className="text-sm text-gray-500">
                              Davet bağlantısının etkileşimini izle
                            </p>
                          </div>
                          <Switch
                            id="trackClicks"
                            checked={shareSettings.trackClicks}
                            onCheckedChange={(checked) =>
                              setShareSettings({
                                ...shareSettings,
                                trackClicks: checked,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expiration">Bağlantı Süresi</Label>
                          <Select
                            value={shareSettings.expireAfter}
                            onValueChange={(value) =>
                              setShareSettings({
                                ...shareSettings,
                                expireAfter: value,
                              })
                            }
                          >
                            <SelectTrigger id="expiration">
                              <SelectValue placeholder="Bağlantının geçerlilik süresi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">Sınırsız</SelectItem>
                              <SelectItem value="1day">1 Gün</SelectItem>
                              <SelectItem value="7days">7 Gün</SelectItem>
                              <SelectItem value="30days">30 Gün</SelectItem>
                              <SelectItem value="event">
                                Etkinlik sonuna kadar
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="mt-0 space-y-4">
                  <div>
                    <Label htmlFor="emailRecipients" className="mb-2 block">
                      Alıcılar
                    </Label>
                    <Textarea
                      id="emailRecipients"
                      placeholder="E-posta adreslerini virgülle ayırarak girin"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      className="h-20"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Örnek: ornek@mail.com, ornek2@mail.com
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="emailSubject" className="mb-2 block">
                      Konu
                    </Label>
                    <Input
                      id="emailSubject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailBody" className="mb-2 block">
                      İçerik
                    </Label>
                    <Textarea
                      id="emailBody"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="h-48"
                    />
                  </div>

                  <Button onClick={shareViaEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    E-posta Gönder
                  </Button>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0 space-y-4">
                  <div>
                    <Label className="mb-3 block">Takvim Formatı</Label>
                    <RadioGroup
                      defaultValue="google"
                      value={reminderOption}
                      onValueChange={setReminderOption}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="google" id="google" />
                        <Label htmlFor="google" className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                          Google Takvim
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ics" id="ics" />
                        <Label htmlFor="ics" className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          ICS Dosyası (Apple, Outlook)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-medium mb-2">Etkinlik Detayları</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Başlık:</span>{" "}
                        {event.title}
                      </p>
                      <p>
                        <span className="font-medium">Başlangıç:</span>{" "}
                        {formatDate(event.startDate)}
                      </p>
                      <p>
                        <span className="font-medium">Bitiş:</span>{" "}
                        {formatDate(event.endDate)}
                      </p>
                      <p>
                        <span className="font-medium">Konum:</span>{" "}
                        {event.location}
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => downloadCalendarFile(reminderOption)}>
                    <Download className="mr-2 h-4 w-4" />
                    {reminderOption === "google"
                      ? "Google Takvime Ekle"
                      : "Takvim Dosyasını İndir"}
                  </Button>
                </TabsContent>

                <TabsContent value="qr" className="mt-0 space-y-4">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-64 h-64 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                      {/* In a real app, would be an actual QR code */}
                      <div className="w-48 h-48 bg-[url('/placeholder-qr.svg')] bg-contain bg-no-repeat bg-center"></div>
                    </div>
                    <p className="text-sm text-gray-500">
                      QR kodunu tarayarak doğrudan etkinlik sayfasına
                      ulaşabilirsiniz.
                      <br />
                      Bağlantı: {shareableLink}
                    </p>
                    <Button onClick={downloadQrCode}>
                      <Download className="mr-2 h-4 w-4" />
                      QR Kodunu İndir
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        {/* Sidebar - Event preview */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg">Etkinlik Önizlemesi</CardTitle>
              <CardDescription>Etkinliğin paylaşım görünümü</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(event.startDate).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(event.endDate).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={
                    event.type === "online"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : event.type === "in-person"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-purple-100 text-purple-800 border-purple-200"
                  }
                >
                  {event.type === "online"
                    ? "Online"
                    : event.type === "in-person"
                    ? "Yüz Yüze"
                    : "Karma"}
                </Badge>

                <Separator />

                <div className="text-sm">
                  <p className="mb-3">{event.description}</p>

                  <div className="flex items-center justify-between text-gray-500 text-xs">
                    <span>
                      {event.enrolledStudents}/{event.capacity} katılımcı
                    </span>

                    <div className="flex items-center">
                      <Share2 className="h-3 w-3 mr-1" />
                      <span>Paylaşım bağlantısı</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="px-6 py-4 bg-gray-50 border-t">
              <Button className="w-full">Etkinliğe Katıl</Button>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">İpuçları</CardTitle>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex">
                  <span className="bg-blue-100 text-blue-600 rounded-full h-5 w-5 flex items-center justify-center mr-2 flex-shrink-0">
                    1
                  </span>
                  <span>
                    Sosyal medya paylaşımları daha geniş bir kitleye ulaşmanızı
                    sağlar.
                  </span>
                </li>
                <li className="flex">
                  <span className="bg-blue-100 text-blue-600 rounded-full h-5 w-5 flex items-center justify-center mr-2 flex-shrink-0">
                    2
                  </span>
                  <span>
                    QR kodları basılı materyallerde kullanarak erişilebilirliği
                    artırın.
                  </span>
                </li>
                <li className="flex">
                  <span className="bg-blue-100 text-blue-600 rounded-full h-5 w-5 flex items-center justify-center mr-2 flex-shrink-0">
                    3
                  </span>
                  <span>
                    Takvim davetleri, katılımcıların etkinliği unutmamasını
                    sağlar.
                  </span>
                </li>
                <li className="flex">
                  <span className="bg-blue-100 text-blue-600 rounded-full h-5 w-5 flex items-center justify-center mr-2 flex-shrink-0">
                    4
                  </span>
                  <span>
                    Giriş zorunluluğu, sadece davet edilenlerin etkinliğe
                    erişmesini sağlar.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
