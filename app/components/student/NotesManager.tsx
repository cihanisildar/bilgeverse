import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/app/hooks/use-toast';

import { StudentNote as Note } from '@/types/student-records';

type NotesManagerProps = {
  studentId: string;
};

export default function NotesManager({ studentId }: NotesManagerProps) {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [studentId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/notes?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data.notes);
    } catch (error) {
      toast.error('Failed to load notes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, content: noteContent }),
      });

      if (!response.ok) throw new Error('Failed to create note');

      const data = await response.json();
      setNotes([data.note, ...notes]);
      setIsCreateDialogOpen(false);
      setNoteContent('');

      toast.success('Note created successfully');
    } catch (error) {
      toast.error('Failed to create note. Please try again.');
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedNote.id, content: noteContent }),
      });

      if (!response.ok) throw new Error('Failed to update note');

      const data = await response.json();
      setNotes(notes.map(note => note.id === selectedNote.id ? data.note : note));
      setIsEditDialogOpen(false);
      setSelectedNote(null);
      setNoteContent('');

      toast.success('Note updated successfully');
    } catch (error) {
      toast.error('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const response = await fetch(`/api/notes?id=${noteToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');

      setNotes(notes.filter(note => note.id !== noteToDelete));

      toast.success('Note deleted successfully');
    } catch (error) {
      toast.error('Failed to delete note. Please try again.');
    } finally {
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Öğrenci Notları</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Not
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Not Ekle</DialogTitle>
              <DialogDescription>
                Öğrenci için yeni bir not ekleyin.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Not içeriğini buraya yazın..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateNote}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              Henüz not eklenmemiş.
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-sm text-gray-500">
                      {note.tutor.firstName} {note.tutor.lastName} tarafından
                    </CardTitle>
                    <CardDescription>
                      {formatDate(note.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedNote(note);
                        setNoteContent(note.content);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={deleteConfirmOpen && noteToDelete === note.id} onOpenChange={setDeleteConfirmOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Notu Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu notu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDeleteNote} className="bg-red-600 hover:bg-red-700">
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notu Düzenle</DialogTitle>
            <DialogDescription>
              Not içeriğini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Not içeriğini buraya yazın..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedNote(null);
              setNoteContent('');
            }}>
              İptal
            </Button>
            <Button onClick={handleUpdateNote}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 