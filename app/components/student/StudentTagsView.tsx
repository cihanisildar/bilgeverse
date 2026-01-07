'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tag,
    Search,
    Filter,
    Users,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Crown,
    UserMinus,
    Activity,
    Heart,
    Star,
    Network,
    AlertTriangle,
    GraduationCap,
    TrendingUp,
    HandHelping,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import StudentTagManager from './StudentTagManager';

interface TagTemplate {
    id: string;
    name: string;
    color: string;
    description?: string;
    icon?: string;
}

interface StudentTag {
    id: string;
    createdAt: string;
    template: TagTemplate;
    student: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
}

interface StudentWithTags {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    tags: StudentTag[];
}

interface StudentTagsViewProps {
    classroomId?: string;
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

export default function StudentTagsView({ classroomId }: StudentTagsViewProps) {
    const [tags, setTags] = useState<StudentTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState<string>('all');
    const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchAllTags();
    }, [classroomId]);

    const fetchAllTags = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/student-tags');
            if (response.ok) {
                const data = await response.json();
                setTags(data.tags || []);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (student: { firstName?: string; lastName?: string; username: string }) => {
        if (student.firstName && student.lastName) {
            return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
        }
        return student.username.substring(0, 2).toUpperCase();
    };

    const getFullName = (student: { firstName?: string; lastName?: string; username: string }) => {
        if (student.firstName && student.lastName) {
            return `${student.firstName} ${student.lastName}`;
        }
        return student.firstName || student.lastName || student.username;
    };

    // Group tags by student
    const studentTagsMap = tags.reduce((acc, tag) => {
        const studentId = tag.student.id;
        if (!acc[studentId]) {
            acc[studentId] = {
                ...tag.student,
                tags: [],
            };
        }
        acc[studentId].tags.push(tag);
        return acc;
    }, {} as Record<string, StudentWithTags>);

    const studentsWithTags = Object.values(studentTagsMap);

    // Get unique tag template names for filter
    const uniqueTagNames = [...new Set(tags.map((t) => t.template.name))];

    // Apply filters
    const filteredStudents = studentsWithTags.filter((student) => {
        // Search filter
        const matchesSearch =
            searchQuery === '' ||
            getFullName(student).toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.username.toLowerCase().includes(searchQuery.toLowerCase());

        // Tag filter
        const matchesTag =
            filterTag === 'all' ||
            student.tags.some((t) => t.template.name === filterTag);

        return matchesSearch && matchesTag;
    });

    const toggleExpanded = (studentId: string) => {
        setExpandedStudents((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Tag className="h-5 w-5 text-violet-600" />
                        Öğrenci Etiketleri
                    </CardTitle>
                    <CardDescription>
                        Öğrencilerinize atadığınız etiketleri görüntüleyin ve yönetin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Öğrenci ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterTag} onValueChange={setFilterTag}>
                            <SelectTrigger className="w-full sm:w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Etiket filtrele" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Etiketler</SelectItem>
                                {uniqueTagNames.map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-violet-100 p-2">
                                <Users className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Etiketli Öğrenci</p>
                                <p className="text-2xl font-bold text-violet-600">
                                    {studentsWithTags.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-2">
                                <Tag className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam Etiket</p>
                                <p className="text-2xl font-bold text-blue-600">{tags.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-green-100 p-2">
                                <Tag className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Farklı Etiket Türü</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {uniqueTagNames.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Students List */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700 mb-1">
                                {tags.length === 0
                                    ? 'Henüz etiket eklenmemiş'
                                    : 'Eşleşen öğrenci bulunamadı'}
                            </h3>
                            <p className="text-gray-500">
                                {tags.length === 0
                                    ? 'Öğrenci profillerinden etiket ekleyebilirsiniz'
                                    : 'Arama kriterlerinizi değiştirmeyi deneyin'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredStudents.map((student) => {
                                const isExpanded = expandedStudents.has(student.id);
                                return (
                                    <div key={student.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-gray-200">
                                                    <AvatarImage src={student.avatarUrl} />
                                                    <AvatarFallback className="bg-violet-100 text-violet-700">
                                                        {getInitials(student)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {getFullName(student)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        @{student.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {student.tags.length} etiket
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleExpanded(student.id)}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {student.tags.map((tag) => (
                                                <Badge
                                                    key={tag.id}
                                                    className="text-xs"
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
                                                    <span className="ml-1">{tag.template.name}</span>
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Expanded: Tag Manager */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <StudentTagManager
                                                    studentId={student.id}
                                                    studentName={getFullName(student)}
                                                    onTagsChange={() => fetchAllTags()}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
