'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowRight, BarChart3, Calendar, CheckCircle2, Clock, Edit2, Eye, Facebook, FileText, Heart, Instagram, Linkedin, Loader2, Music2, Plus, Search, Send, Sparkles, Trash2, Trophy, Twitter, Users, Youtube } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useCreateSocialPost, useDeleteSocialPost, useSocialPosts, useUpdateSocialPost } from '@/app/hooks/use-social';
import { SocialPost } from '@/types/social';
import { PostStatus, SocialPlatform } from '@prisma/client';
import { CONTENT_TYPES, SAMPLE_CAPTIONS, getContentTypeLabel } from '@/app/lib/social';

const PLATFORMS = [
    { id: SocialPlatform.INSTAGRAM, label: 'Instagram', icon: <Instagram className="h-4 w-4" />, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: SocialPlatform.TWITTER, label: 'Twitter / X', icon: <Twitter className="h-4 w-4" />, color: 'text-blue-400', bg: 'bg-blue-50' },
    { id: SocialPlatform.FACEBOOK, label: 'Facebook', icon: <Facebook className="h-4 w-4" />, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: SocialPlatform.LINKEDIN, label: 'LinkedIn', icon: <Linkedin className="h-4 w-4" />, color: 'text-blue-800', bg: 'bg-blue-50' },
    { id: SocialPlatform.YOUTUBE, label: 'YouTube', icon: <Youtube className="h-4 w-4" />, color: 'text-red-600', bg: 'bg-red-50' },
    { id: SocialPlatform.TIKTOK, label: 'TikTok', icon: <Music2 className="h-4 w-4" />, color: 'text-black', bg: 'bg-gray-50' },
];

const STATUSES = [
    { id: PostStatus.DRAFT, label: 'Taslak', icon: <FileText className="h-4 w-4" />, color: 'text-gray-500', bg: 'bg-gray-100' },
    { id: PostStatus.PLANNED, label: 'Planlandı', icon: <Calendar className="h-4 w-4" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: PostStatus.APPROVED, label: 'Onaylandı', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: PostStatus.PUBLISHED, label: 'Yayınlandı', icon: <Send className="h-4 w-4" />, color: 'text-violet-500', bg: 'bg-violet-50' },
    { id: PostStatus.ARCHIVED, label: 'Arşivlendi', icon: <AlertCircle className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-50' },
];



export default function PostManager() {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sportsOnly, setSportsOnly] = useState(searchParams.get('filter') === 'sports');

    // React Query Hooks
    const { data: posts = [], isLoading: loading } = useSocialPosts();
    const createPostMutation = useCreateSocialPost();
    const updatePostMutation = useUpdateSocialPost();
    const deletePostMutation = useDeleteSocialPost();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
    const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [platform, setPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
    const [contentType, setContentType] = useState<string>('POST');
    const [status, setStatus] = useState<PostStatus>(PostStatus.DRAFT);
    const [scheduledDate, setScheduledDate] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [views, setViews] = useState('');
    const [engagement, setEngagement] = useState('');
    const [reach, setReach] = useState('');
    const [isSportsClub, setIsSportsClub] = useState(false);

    const handleOpenDialog = (post: SocialPost | null = null) => {
        if (post) {
            setEditingPost(post);
            setTitle(post.title);
            setContent(post.content);
            setPlatform(post.platform);
            setContentType(post.contentType || 'POST');
            setStatus(post.status);
            setScheduledDate(post.scheduledDate ? new Date(post.scheduledDate).toISOString().split('T')[0] : '');
            setHashtags(post.hashtags.join(', '));
            setViews(post.views != null ? String(post.views) : '');
            setEngagement(post.engagement != null ? String(post.engagement) : '');
            setReach(post.reach != null ? String(post.reach) : '');
            setIsSportsClub(post.isSportsClub ?? false);
        } else {
            setEditingPost(null);
            setTitle('');
            setContent('');
            setPlatform(SocialPlatform.INSTAGRAM);
            setContentType('POST');
            setStatus(PostStatus.DRAFT);
            setScheduledDate('');
            setHashtags('');
            setViews('');
            setEngagement('');
            setReach('');
            setIsSportsClub(sportsOnly);
        }
        setIsDialogOpen(true);
    };

    const appendSampleCaption = (id: string) => {
        const sample = SAMPLE_CAPTIONS.find((s) => s.id === id);
        if (!sample) return;
        setContent((prev) => (prev.trim() ? `${prev}\n\n${sample.text}` : sample.text));
    };

    const handleOpenDetails = (post: SocialPost) => {
        setSelectedPost(post);
        setIsDetailsDialogOpen(true);
    };

    const handleStatusUpdate = async (postId: string, newStatus: PostStatus) => {
        try {
            await updatePostMutation.mutateAsync({
                id: postId,
                data: { status: newStatus }
            });

            if (selectedPost?.id === postId) {
                setSelectedPost(prev => prev ? { ...prev, status: newStatus } : null);
            }
            toast.success('Durum başarıyla güncellendi.');
        } catch (error) {
            toast.error('Durum güncellenirken bir hata oluştu.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedHashtags = hashtags.split(',').map(h => h.trim().startsWith('#') ? h.trim() : `#${h.trim()}`).filter(h => h.length > 1);

        const payload = {
            title,
            content,
            platform,
            contentType,
            status,
            scheduledDate: scheduledDate || null,
            hashtags: parsedHashtags,
            views: views === '' ? null : Number(views),
            engagement: engagement === '' ? null : Number(engagement),
            reach: reach === '' ? null : Number(reach),
            isSportsClub,
        };

        try {
            if (editingPost) {
                await updatePostMutation.mutateAsync({ id: editingPost.id, data: payload });
                toast.success('Gönderi başarıyla güncellendi.');
            } else {
                await createPostMutation.mutateAsync(payload);
                toast.success('Gönderi başarıyla oluşturuldu.');
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error('İşlem sırasında bir hata oluştu.');
        }
    };

    const confirmDelete = async () => {
        if (!postToDelete) return;
        try {
            await deletePostMutation.mutateAsync(postToDelete);
            toast.success('Gönderi başarıyla silindi.');
        } catch (error) {
            toast.error('Gönderi silinirken bir hata oluştu.');
        } finally {
            setPostToDelete(null);
        }
    };

    const filteredPosts = (posts || []).filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.platform.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter === 'ALL' || post.platform === platformFilter;
        const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
        const matchesSports = !sportsOnly || (post as any).isSportsClub;
        return matchesSearch && matchesPlatform && matchesStatus && matchesSports;
    });

    const getPlatformInfo = (platformId: string) => {
        return PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];
    };

    const getStatusInfo = (statusId: string) => {
        return STATUSES.find(s => s.id === statusId) || STATUSES[0];
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 max-w-2xl">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Gönderilerde ara..."
                            className="pl-10 bg-white border-teal-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] bg-white border-teal-100">
                            <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm Platformlar</SelectItem>
                            {PLATFORMS.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] bg-white border-teal-100">
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                            {STATUSES.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant={sportsOnly ? 'default' : 'outline'}
                        onClick={() => setSportsOnly((v) => !v)}
                        className={sportsOnly ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-indigo-200 text-indigo-600'}
                    >
                        <Trophy className="h-4 w-4 mr-2" /> Spor Kulübü
                    </Button>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md hover:shadow-lg transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Gönderi Planla
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                </div>
            ) : filteredPosts.length === 0 ? (
                <Card className="border-dashed border-2 border-teal-100 bg-teal-50/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Send className="h-12 w-12 text-teal-200 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">Henüz planlanmış gönderi yok</h3>
                        <p className="text-gray-500 max-w-sm mt-2">
                            Sosyal medya platformlarınız için yeni bir gönderi planlayarak başlayın.
                        </p>
                        <Button variant="outline" className="mt-6 border-teal-200 text-teal-600" onClick={() => handleOpenDialog()}>
                            İlk Gönderiyi Planla
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => {
                        const platformInfo = getPlatformInfo(post.platform);
                        const statusInfo = getStatusInfo(post.status);

                        return (
                            <Card key={post.id} className="group flex flex-col border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
                                <CardHeader className="pb-3 bg-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className={`font-medium ${platformInfo.bg} ${platformInfo.color} border-transparent px-2 py-0.5`}>
                                                <span className="mr-1.5">{platformInfo.icon}</span>
                                                {platformInfo.label}
                                            </Badge>
                                            {post.contentType && (
                                                <Badge variant="outline" className="font-medium bg-gray-100 text-gray-600 border-transparent px-2 py-0.5 text-[11px]">
                                                    {getContentTypeLabel(post.contentType)}
                                                </Badge>
                                            )}
                                            {(post as any).isSportsClub && (
                                                <Badge variant="outline" className="font-medium bg-indigo-50 text-indigo-600 border-transparent px-2 py-0.5 text-[11px]">
                                                    <Trophy className="h-3 w-3 mr-1" /> Spor
                                                </Badge>
                                            )}
                                        </div>
                                        <Badge variant="outline" className={`font-medium ${statusInfo.bg} ${statusInfo.color} border-transparent px-2 py-0.5`}>
                                            <span className="mr-1.5">{statusInfo.icon}</span>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg mt-3 font-bold text-gray-800 line-clamp-1">{post.title}</CardTitle>
                                </CardHeader>

                                <CardContent className="pt-4 flex-1">
                                    <div className="bg-white rounded-lg p-3 text-sm text-gray-600 line-clamp-4 min-h-[5rem]">
                                        {post.content}
                                    </div>
                                    {post.hashtags?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {post.hashtags.map((tag, i) => (
                                                <span key={i} className="text-[11px] text-teal-600 font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="pt-0 pb-4 flex flex-col gap-3">
                                    <div className="w-full flex items-center justify-between text-xs text-gray-500 bg-gray-50/80 p-2 rounded-lg">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Clock className="h-3 w-3" />
                                            {post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString('tr-TR') : 'Tarih Belirtilmedi'}
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenDialog(post)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => setPostToDelete(post.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] text-gray-400 font-semibold uppercase">{post.createdBy.firstName || post.createdBy.username}</span>
                                        <Button variant="ghost" size="sm" className="h-7 text-[11px] text-teal-600 hover:bg-teal-50 gap-1.5 pr-1" onClick={() => handleOpenDetails(post)}>
                                            Detaylar <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? 'Gönderiyi Düzenle' : 'Yeni Gönderi Planla'}</DialogTitle>
                        <DialogDescription>
                            Sosyal medya kanalınızı ve gönderi detaylarını belirleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="post-title">Başlık</Label>
                                <Input
                                    id="post-title"
                                    placeholder="Gönderi başlığı..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform</Label>
                                <Select value={platform} onValueChange={(value) => setPlatform(value as SocialPlatform)}>
                                    <SelectTrigger id="platform">
                                        <SelectValue placeholder="Platform seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PLATFORMS.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                <div className="flex items-center">
                                                    <span className={p.color + " mr-2"}>{p.icon}</span>
                                                    {p.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Durum</Label>
                                <Select value={status} onValueChange={(value) => setStatus(value as PostStatus)}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Durum seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                <div className="flex items-center">
                                                    <span className={s.color + " mr-2"}>{s.icon}</span>
                                                    {s.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contentType">İçerik Türü</Label>
                                <Select value={contentType} onValueChange={setContentType}>
                                    <SelectTrigger id="contentType">
                                        <SelectValue placeholder="Tür seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONTENT_TYPES.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Yayın Tarihi</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="date"
                                        type="date"
                                        className="pl-10"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="post-content" className="text-gray-700 font-semibold">İçerik</Label>
                                <Select value="" onValueChange={appendSampleCaption}>
                                    <SelectTrigger className="h-8 w-auto gap-1.5 text-xs border-teal-100 text-teal-600">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <SelectValue placeholder="Örnek açıklama ekle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SAMPLE_CAPTIONS.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Textarea
                                id="post-content"
                                placeholder="Gönderi metnini buraya yazın..."
                                className="min-h-[160px] focus:ring-teal-500 border-teal-100 resize-none shadow-sm"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hashtags">Hashtagler (Virgülle ayırın)</Label>
                            <Input
                                id="hashtags"
                                placeholder="Örn: bilgeverse, eğitim, gelecek"
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                            />
                        </div>

                        <label className="flex items-center gap-2 p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 cursor-pointer">
                            <Checkbox checked={isSportsClub} onCheckedChange={(c) => setIsSportsClub(!!c)} />
                            <span className="text-sm font-medium flex items-center gap-1.5 text-indigo-700">
                                <Trophy className="h-4 w-4" /> Spor Kulübü içeriği
                            </span>
                        </label>

                        {status === PostStatus.PUBLISHED && (
                            <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                                <Label className="text-violet-700 font-semibold flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" /> Performans Verileri
                                </Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="views" className="text-xs text-gray-500 flex items-center gap-1"><Eye className="h-3 w-3" /> Görüntülenme</Label>
                                        <Input id="views" type="number" min={0} placeholder="0" value={views} onChange={(e) => setViews(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="engagement" className="text-xs text-gray-500 flex items-center gap-1"><Heart className="h-3 w-3" /> Etkileşim</Label>
                                        <Input id="engagement" type="number" min={0} placeholder="0" value={engagement} onChange={(e) => setEngagement(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reach" className="text-xs text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" /> Erişim</Label>
                                        <Input id="reach" type="number" min={0} placeholder="0" value={reach} onChange={(e) => setReach(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                        <Button type="submit" disabled={createPostMutation.isPending || updatePostMutation.isPending} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white min-w-[120px]">
                            {createPostMutation.isPending || updatePostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPost ? 'Güncelle' : 'Kaydet ve Planla'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Post Details and Quick Status Management Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                    {selectedPost && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className={`font-medium ${getPlatformInfo(selectedPost.platform).bg} ${getPlatformInfo(selectedPost.platform).color} border-transparent`}>
                                        <span className="mr-1.5">{getPlatformInfo(selectedPost.platform).icon}</span>
                                        {getPlatformInfo(selectedPost.platform).label}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {selectedPost.scheduledDate ? new Date(selectedPost.scheduledDate).toLocaleDateString('tr-TR') : 'Tarih Belirtilmedi'}
                                    </div>
                                </div>
                                <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
                                    {selectedPost.title}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                                        Oluşturan: {selectedPost.createdBy.firstName || selectedPost.createdBy.username}
                                    </span>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 py-6">
                                {/* Status Toggle Section */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Durumu Değiştir</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                        {STATUSES.map((status) => (
                                            <button
                                                key={status.id}
                                                disabled={updatePostMutation.isPending}
                                                onClick={() => handleStatusUpdate(selectedPost.id, status.id as PostStatus)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${selectedPost.status === status.id
                                                    ? `${status.bg} ${status.color} border-current shadow-sm scale-105`
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                    } ${updatePostMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {updatePostMutation.isPending && selectedPost.status !== status.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mb-1" />
                                                ) : (
                                                    <div className="mb-1">{status.icon}</div>
                                                )}
                                                <span className="text-[10px] font-bold">{status.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Gönderi İçeriği</h4>
                                    <div className="bg-white border border-teal-50 rounded-xl p-5 text-gray-700 leading-relaxed shadow-sm min-h-[120px] whitespace-pre-wrap">
                                        {selectedPost.content}
                                    </div>
                                </div>

                                {/* Hashtags */}
                                {selectedPost.hashtags?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Hashtagler</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPost.hashtags.map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100 font-medium">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Performance metrics */}
                                {(selectedPost.views != null || selectedPost.engagement != null || selectedPost.reach != null) && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Performans</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="rounded-xl bg-blue-50 p-3 text-center">
                                                <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-blue-700">{(selectedPost.views ?? 0).toLocaleString('tr-TR')}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">Görüntülenme</div>
                                            </div>
                                            <div className="rounded-xl bg-rose-50 p-3 text-center">
                                                <Heart className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-rose-700">{(selectedPost.engagement ?? 0).toLocaleString('tr-TR')}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">Etkileşim</div>
                                            </div>
                                            <div className="rounded-xl bg-violet-50 p-3 text-center">
                                                <Users className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-violet-700">{(selectedPost.reach ?? 0).toLocaleString('tr-TR')}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">Erişim</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                                <div className="flex-1 flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="text-blue-600 border-blue-100 hover:bg-blue-50"
                                        onClick={() => {
                                            setIsDetailsDialogOpen(false);
                                            handleOpenDialog(selectedPost);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Düzenle
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={deletePostMutation.isPending || updatePostMutation.isPending}
                                        className="text-rose-600 border-rose-100 hover:bg-rose-50"
                                        onClick={() => {
                                            setPostToDelete(selectedPost.id);
                                            setIsDetailsDialogOpen(false);
                                        }}
                                    >
                                        {deletePostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                        Sil
                                    </Button>
                                </div>
                                <Button className="bg-gray-900 text-white" onClick={() => setIsDetailsDialogOpen(false)}>Kapat</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Gönderiyi silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu gönderiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
                            {deletePostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
