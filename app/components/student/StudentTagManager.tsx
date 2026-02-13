'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertTriangle,
    Activity,
    Crown,
    GraduationCap,
    Heart,
    Loader2,
    Network,
    Plus,
    Star,
    Tag,
    TrendingUp,
    UserMinus,
    X,
    HandHelping,
    AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { TagTemplate, StudentTag } from '@/types/tag';

interface StudentTagManagerProps {
    studentId: string;
    studentName: string;
    onTagsChange?: () => void;
    compact?: boolean;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTags?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
    'crown': <Crown className="h-3 w-3" />,
    'user-minus': <UserMinus className="h-3 w-3" />,
    'activity': <Activity className="h-3 w-3" />,
    'heart-handshake': <Heart className="h-3 w-3" />,
    'star': <Star className="h-3 w-3" />,
    'network': <Network className="h-3 w-3" />,
    'alert-triangle': <AlertTriangle className="h-3 w-3" />,
    'graduation-cap': <GraduationCap className="h-3 w-3" />,
    'trending-up': <TrendingUp className="h-3 w-3" />,
    'hand-helping': <HandHelping className="h-3 w-3" />,
};

import { useStudentTags, useTagTemplates, useAddStudentTag, useRemoveStudentTag } from '@/app/hooks/use-student-tags';

export default function StudentTagManager({
    studentId,
    studentName,
    onTagsChange,
    compact = false,
    trigger,
    open: externalOpen,
    onOpenChange: setExternalOpen,
    showTags = true,
}: StudentTagManagerProps) {
    const { toast } = useToast();
    const [internalOpen, setInternalOpen] = useState(false);

    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

    const { data: tagsData, isLoading: loadingTags } = useStudentTags(studentId);
    const tags = tagsData?.tags || [];

    const { data: templatesData, isLoading: loadingTemplates } = useTagTemplates();
    const templates = templatesData?.templates || [];

    const addTagMutation = useAddStudentTag();
    const removeTagMutation = useRemoveStudentTag();

    const loading = addTagMutation.isPending || removeTagMutation.isPending;

    const addTag = async (templateId: string) => {
        try {
            await addTagMutation.mutateAsync({ studentId, templateId });
            toast({
                title: 'Başarılı',
                description: 'Etiket eklendi',
            });
            onTagsChange?.();
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message || 'Etiket eklenirken bir hata oluştu',
                variant: 'destructive',
            });
        }
    };

    const removeTag = async (tagId: string) => {
        try {
            await removeTagMutation.mutateAsync({ tagId, studentId });
            toast({
                title: 'Başarılı',
                description: 'Etiket kaldırıldı',
            });
            onTagsChange?.();
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message || 'Etiket silinirken bir hata oluştu',
                variant: 'destructive',
            });
        }
    };

    // Check which templates are already used
    const usedTemplateIds = new Set(tags.map((t) => t.template.id));
    const availableTemplates = templates.filter((t) => !usedTemplateIds.has(t.id));

    return (
        <div className={showTags ? "space-y-2" : ""}>
            {/* Display existing tags */}
            {showTags && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <Badge
                            key={tag.id}
                            className="flex items-center gap-1 pr-1 text-xs"
                            style={{
                                backgroundColor: `${tag.template.color}20`,
                                color: tag.template.color,
                                borderColor: `${tag.template.color}40`,
                            }}
                        >
                            {tag.template.icon && iconMap[tag.template.icon] ? (
                                iconMap[tag.template.icon]
                            ) : (
                                <Tag className="h-3 w-3" />
                            )}
                            {tag.template.name}
                            <button
                                onClick={() => removeTag(tag.id)}
                                className="ml-1 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                                title="Etiketi kaldır"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Add tag button */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {trigger ? (
                        trigger
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className={`h-6 px-2 text-xs ${compact ? '' : 'border-dashed'}`}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Etiket Ekle
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-violet-600" />
                            Etiket Ekle
                        </DialogTitle>
                        <DialogDescription>
                            <span className="font-medium text-gray-700">{studentName}</span> için bir etiket seçin
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {loadingTemplates ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : availableTemplates.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-500 text-sm">
                                    {templates.length === 0
                                        ? 'Henüz etiket şablonu oluşturulmamış. Yönetici etiket şablonları oluşturmalıdır.'
                                        : 'Tüm etiketler zaten eklenmiş.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500 mb-4">
                                    Eklemek istediğiniz etikete tıklayın:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {availableTemplates.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => addTag(template.id)}
                                            disabled={loading}
                                            className={`
                                                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                                                    transition-all duration-200
                                                    cursor-pointer hover:scale-105 active:scale-95
                                                    disabled:opacity-50 disabled:cursor-not-allowed
                                                `}
                                            style={{
                                                backgroundColor: `${template.color}20`,
                                                color: template.color,
                                                border: `1px solid ${template.color}40`,
                                            }}
                                            title={template.description || template.name}
                                        >
                                            {template.icon && iconMap[template.icon] ? (
                                                iconMap[template.icon]
                                            ) : (
                                                <Tag className="h-3 w-3" />
                                            )}
                                            {template.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Empty state */}
            {showTags && tags.length === 0 && !compact && (
                <p className="text-xs text-gray-400">Henüz etiket eklenmemiş</p>
            )}
        </div>
    );
}
