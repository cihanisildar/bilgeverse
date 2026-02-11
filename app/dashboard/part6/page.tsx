import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Layout, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IngredientManager from './_components/IngredientManager';
import PostManager from './_components/PostManager';
import Part6Help from './_components/Part6Help';
import PartDocuments from '@/app/components/PartDocuments';
import { PARTS } from '@/app/lib/parts';

export default async function Part6Page() {
  const part = PARTS.find(p => p.id === 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600">
                {part?.name}
              </span>
            </h1>
            <p className="text-gray-600">{part?.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <Part6Help />
          </div>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList className="bg-white/80 backdrop-blur-sm p-1 border border-teal-100 rounded-xl shadow-sm">
              <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                <Send className="h-4 w-4 mr-2" />
                Sosyal Gönderiler
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="rounded-lg data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                İçerik Bileşenleri
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Layout className="h-4 w-4 mr-2" />
                Belgeler
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="posts" className="focus-visible:outline-none">
            <PostManager />
          </TabsContent>

          <TabsContent value="ingredients" className="focus-visible:outline-none">
            <IngredientManager />
          </TabsContent>

          <TabsContent value="documents" className="focus-visible:outline-none">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Belgeler</h2>
                  <p className="text-gray-600">Bu bölüm için paylaşılan görsel ve metiner</p>
                </div>
                <Link href="/dashboard/pdfs">
                  <Button variant="outline" className="border-teal-200 text-teal-600 hover:bg-teal-50">
                    Tüm Belgeleri Görüntüle
                  </Button>
                </Link>
              </div>
              <PartDocuments partId={6} gradientFrom="from-teal-600" gradientTo="to-cyan-600" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
