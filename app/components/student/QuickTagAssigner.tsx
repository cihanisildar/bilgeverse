'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Tag, UserPlus, Loader2, Users } from 'lucide-react';
import StudentTagManager from './StudentTagManager';

interface Student {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    studentTags?: any[];
}

interface QuickTagAssignerProps {
    classroomId: string;
    onTagsChange?: () => void;
    students: Student[];
}

export default function QuickTagAssigner({ classroomId, onTagsChange, students = [] }: QuickTagAssignerProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [tagManagerOpen, setTagManagerOpen] = useState(false);

    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setTagManagerOpen(true);
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                        <Tag className="h-4 w-4 mr-2" />
                        Hızlı Etiket Atama
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Öğrenci Seçin
                        </DialogTitle>
                        <DialogDescription>
                            Etiket atamak istediğiniz öğrenciyi seçin
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Öğrenci ara..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleSelectStudent(student)}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-gray-100 shadow-sm">
                                                <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">
                                                    {getInitials(student.firstName, student.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {student.firstName} {student.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">@{student.username}</p>
                                            </div>
                                        </div>
                                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600">
                                            <Tag className="h-3.5 w-3.5" />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <p>Öğrenci bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden Manager Dialog that gets triggered */}
            {selectedStudent && (
                <StudentTagManager
                    studentId={selectedStudent.id}
                    studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    open={tagManagerOpen}
                    showTags={false}
                    onOpenChange={(isOpen) => {
                        setTagManagerOpen(isOpen);
                        if (!isOpen) {
                            setSelectedStudent(null);
                        }
                    }}
                    trigger={<span className="hidden" />}
                    onTagsChange={() => {
                        onTagsChange?.();
                        setTagManagerOpen(false);
                        setOpen(false);
                    }}
                />
            )}
        </>
    );
}
