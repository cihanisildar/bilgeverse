'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, Clock, Edit2, Facebook, FileText, Instagram, Linkedin, Loader2, Music2, Plus, Search, Send, Trash2, Twitter, Youtube } from 'lucide-react';
import { useState } from 'react';

import { useCreateSocialPost, useDeleteSocialPost, useSocialPosts, useUpdateSocialPost } from '@/app/hooks/use-social';
import { SocialPost } from '@/types/social';
import { PostStatus, SocialPlatform } from '@prisma/client';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // React Query Hooks
    const { data: posts = [], isLoading: loading } = useSocialPosts();
    const createPostMutation = useCreateSocialPost();
    const updatePostMutation = useUpdateSocialPost();
    const deletePostMutation = useDeleteSocialPost();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
    const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [platform, setPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
    const [status, setStatus] = useState<PostStatus>(PostStatus.DRAFT);
    const [scheduledDate, setScheduledDate] = useState('');
    const [hashtags, setHashtags] = useState('');

    const handleOpenDialog = (post: SocialPost | null = null) => {
        if (post) {
            setEditingPost(post);
            setTitle(post.title);
            setContent(post.content);
            setPlatform(post.platform);
            setStatus(post.status);
            setScheduledDate(post.scheduledDate ? new Date(post.scheduledDate).toISOString().split('T')[0] : '');
            setHashtags(post.hashtags.join(', '));
        } else {
            setEditingPost(null);
            setTitle('');
            setContent('');
            setPlatform(SocialPlatform.INSTAGRAM);
            setStatus(PostStatus.DRAFT);
            setScheduledDate('');
            setHashtags('');
        }
        setIsDialogOpen(true);
    };

    const handleOpenDetails = (post: SocialPost) => {
        setSelectedPost(post);
        setIsDetailsDialogOpen(true);
    };

    const handleStatusUpdate = async (postId: string, newStatus: PostStatus) => {
        await updatePostMutation.mutateAsync({
            id: postId,
            data: { status: newStatus }
        });

        if (selectedPost?.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedHashtags = hashtags.split(',').map(h => h.trim().startsWith('#') ? h.trim() : `#${h.trim()}`).filter(h => h.length > 1);

        const payload = {
            title,
            content,
            platform,
            status,
            scheduledDate: scheduledDate || null,
            hashtags: parsedHashtags,
        };

        if (editingPost) {
            await updatePostMutation.mutateAsync({ id: editingPost.id, data: payload });
        } else {
            await createPostMutation.mutateAsync(payload);
        }

        setIsDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;
        await deletePostMutation.mutateAsync(id);
    };

    const filteredPosts = (posts || []).filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.platform.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter === 'ALL' || post.platform === platformFilter;
        const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
        return matchesSearch && matchesPlatform && matchesStatus;
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
                                        <Badge variant="outline" className={`font-medium ${platformInfo.bg} ${platformInfo.color} border-transparent px-2 py-0.5`}>
                                            <span className="mr-1.5">{platformInfo.icon}</span>
                                            {platformInfo.label}
                                        </Badge>
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
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(post.id)}>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Label htmlFor="post-content" className="text-gray-700 font-semibold">İçerik</Label>
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
                                            handleDelete(selectedPost.id);
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
        </div>
    );
}
