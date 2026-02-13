'use server';

import { requireActionAuth, hasRole } from '@/app/lib/auth-utils';
import prisma from '@/lib/prisma';
import { UserRole, FeedbackRating, NotificationType } from '@prisma/client';
import crypto from 'crypto';

interface ProgressRecord {
  isTaught: boolean;
  taughtDate: Date | null;
  notes: string | null;
}

export interface CreateSyllabusData {
  title: string;
  description?: string;
  driveLink?: string;
  isGlobal?: boolean;
  lessons: Array<{
    title: string;
    description?: string;
    driveLink?: string;
  }>;
}

export interface UpdateSyllabusData {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export interface UpdateSyllabusLessonData {
  title?: string;
  description?: string;
  isTaught?: boolean;
  notes?: string;
}

export interface SubmitFeedbackData {
  syllabusId: string;
  parentName?: string;
  parentEmail?: string;
  overallRating?: FeedbackRating;
  contentQuality?: FeedbackRating;
  effectiveness?: FeedbackRating;
  engagement?: FeedbackRating;
}

export interface UpdateClassroomProgressData {
  classroomId: string;
  syllabusId: string;
  lessonId: string;
  isTaught: boolean;
  notes?: string;
}

export async function getSyllabi() {
  try {
    const { session, error } = await requireActionAuth();
    if (error) return { error, data: null };

    const user = session!.user;
    const isTutor = hasRole(session, [UserRole.TUTOR]);
    const isAdmin = hasRole(session, [UserRole.ADMIN]);

    const where = isTutor && !isAdmin
      ? {
        OR: [
          { createdById: user.id },
          { isGlobal: true },
        ],
      }
      : {};

    const syllabi = await prisma.syllabus.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        lessons: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        feedbackForms: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      error: null,
      data: syllabi.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        lessons: s.lessons.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
        feedbackForms: s.feedbackForms.map((f) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
        })),
      })),
    };
  } catch (error) {
    console.error('Error fetching syllabi:', error);
    return { error: 'Müfredatlar yüklenirken bir hata oluştu', data: null };
  }
}

export async function getSyllabus(syllabusId: string) {
  try {
    const { session } = await requireActionAuth();

    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        lessons: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        feedbackForms: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!syllabus) {
      return { error: 'Müfredat bulunamadı', data: null };
    }

    let progressMap: Record<string, ProgressRecord> = {};
    if (session?.user) {
      const userNode = session.user;
      const isAsistan = hasRole(session, [UserRole.ASISTAN]);
      const targetUserId = isAsistan ? (userNode.assistedTutorId || userNode.id) : userNode.id;

      const userWithClassroom = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { classroom: true },
      });

      if (userWithClassroom?.classroom) {
        const progress = await prisma.classroomLessonProgress.findMany({
          where: {
            classroomId: userWithClassroom.classroom.id,
            syllabusId: syllabusId,
          },
        });

        progress.forEach((p) => {
          progressMap[p.lessonId] = {
            isTaught: p.isTaught,
            taughtDate: p.taughtDate,
            notes: p.notes
          };
        });
      }
    }

    return {
      error: null,
      data: {
        ...syllabus,
        createdAt: syllabus.createdAt.toISOString(),
        updatedAt: syllabus.updatedAt.toISOString(),
        lessons: syllabus.lessons.map((l) => {
          const progress = progressMap[l.id];
          return {
            ...l,
            isTaught: progress?.isTaught || false,
            taughtDate: progress?.taughtDate ? progress.taughtDate.toISOString() : null,
            notes: progress?.notes || null,
            createdAt: l.createdAt.toISOString(),
            updatedAt: l.updatedAt.toISOString(),
          };
        }),
        feedbackForms: syllabus.feedbackForms.map((f) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    return { error: 'Müfredat yüklenirken bir hata oluştu', data: null };
  }
}

export async function getSyllabusByShareToken(shareToken: string) {
  try {
    const syllabus = await prisma.syllabus.findUnique({
      where: { shareToken },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        lessons: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        feedbackForms: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!syllabus || !syllabus.isPublished) {
      return { error: 'Müfredat bulunamadı veya paylaşılmamış', data: null };
    }

    return {
      error: null,
      data: {
        ...syllabus,
        createdAt: syllabus.createdAt.toISOString(),
        updatedAt: syllabus.updatedAt.toISOString(),
        lessons: syllabus.lessons.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
        feedbackForms: syllabus.feedbackForms.map((f) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching syllabus by share token:', error);
    return { error: 'Müfredat yüklenirken bir hata oluştu', data: null };
  }
}

export async function createSyllabus(data: CreateSyllabusData) {
  try {
    const { session, error } = await requireActionAuth([UserRole.ADMIN]);
    if (error) return { error, data: null };
    const user = session!.user;
    const isAdmin = hasRole(session, [UserRole.ADMIN]);

    const syllabus = await prisma.syllabus.create({
      data: {
        title: data.title,
        description: data.description,
        driveLink: data.driveLink,
        isGlobal: isAdmin ? (data.isGlobal ?? false) : false,
        createdById: user.id,
        lessons: {
          create: data.lessons.map((lesson, index) => ({
            title: lesson.title,
            description: lesson.description,
            driveLink: lesson.driveLink,
            orderIndex: index,
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        lessons: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return {
      error: null,
      data: {
        ...syllabus,
        createdAt: syllabus.createdAt.toISOString(),
        updatedAt: syllabus.updatedAt.toISOString(),
        lessons: syllabus.lessons.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error creating syllabus:', error);
    return { error: 'Müfredat oluşturulurken bir hata oluştu', data: null };
  }
}

export async function updateSyllabus(syllabusId: string, data: UpdateSyllabusData) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };

    const syllabus = await prisma.syllabus.update({
      where: { id: syllabusId },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        lessons: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return {
      error: null,
      data: {
        ...syllabus,
        createdAt: syllabus.createdAt.toISOString(),
        updatedAt: syllabus.updatedAt.toISOString(),
        lessons: syllabus.lessons.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error updating syllabus:', error);
    return { error: 'Müfredat güncellenirken bir hata oluştu', data: null };
  }
}

export async function generateShareTokenForSyllabus(syllabusId: string) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };

    const shareToken = crypto.randomBytes(32).toString('hex');

    const syllabus = await prisma.syllabus.update({
      where: { id: syllabusId },
      data: {
        shareToken,
        isPublished: true,
      },
    });

    return {
      error: null,
      data: {
        shareToken: syllabus.shareToken,
        shareUrl: `${process.env.NEXTAUTH_URL}/syllabus/${syllabus.shareToken}`,
      },
    };
  } catch (error) {
    console.error('Error generating share token:', error);
    return { error: 'Paylaşım bağlantısı oluşturulurken bir hata oluştu', data: null };
  }
}

export async function updateSyllabusLesson(lessonId: string, data: UpdateSyllabusLessonData) {
  try {
    const { session, error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };

    // For lesson metadata (title, description), update the lesson directly
    if (data.title !== undefined || data.description !== undefined) {
      const lesson = await prisma.syllabusLesson.update({
        where: { id: lessonId },
        data: {
          title: data.title,
          description: data.description,
        },
      });

      return {
        error: null,
        data: {
          ...lesson,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        },
      };
    }

    // For progress tracking (isTaught, notes), use classroom-based progress
    if (data.isTaught !== undefined || data.notes !== undefined) {
      const userWithClassroom = await prisma.user.findUnique({
        where: { id: session!.user.id },
        include: { classroom: true },
      });

      if (!userWithClassroom?.classroom) {
        return { error: 'Sınıf bulunamadı', data: null };
      }

      const lesson = await prisma.syllabusLesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        return { error: 'Ders bulunamadı', data: null };
      }

      const progress = await prisma.classroomLessonProgress.upsert({
        where: {
          classroomId_lessonId: {
            classroomId: userWithClassroom.classroom.id,
            lessonId: lessonId,
          },
        },
        update: {
          isTaught: data.isTaught ?? undefined,
          taughtDate: data.isTaught ? new Date() : data.isTaught === false ? null : undefined,
          notes: data.notes,
        },
        create: {
          classroomId: userWithClassroom.classroom.id,
          syllabusId: lesson.syllabusId,
          lessonId: lessonId,
          isTaught: data.isTaught ?? false,
          taughtDate: data.isTaught ? new Date() : null,
          notes: data.notes,
        },
      });

      return {
        error: null,
        data: {
          ...lesson,
          isTaught: progress.isTaught,
          taughtDate: progress.taughtDate ? progress.taughtDate.toISOString() : null,
          notes: progress.notes,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        },
      };
    }

    return { error: 'Güncellenecek veri yok', data: null };
  } catch (error) {
    console.error('Error updating lesson:', error);
    return { error: 'Ders güncellenirken bir hata oluştu', data: null };
  }
}

export async function addLessonToSyllabus(syllabusId: string, data: {
  title: string;
  description?: string;
  driveLink?: string;
}) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };

    const maxLesson = await prisma.syllabusLesson.findFirst({
      where: { syllabusId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex = (maxLesson?.orderIndex ?? -1) + 1;

    const lesson = await prisma.syllabusLesson.create({
      data: {
        syllabusId,
        title: data.title,
        description: data.description,
        driveLink: data.driveLink,
        orderIndex,
      },
    });

    return {
      error: null,
      data: {
        ...lesson,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error adding lesson:', error);
    return { error: 'Ders eklenirken bir hata oluştu', data: null };
  }
}

export async function deleteSyllabusLesson(lessonId: string) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };

    await prisma.syllabusLesson.delete({
      where: { id: lessonId },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return { error: 'Ders silinirken bir hata oluştu', data: null };
  }
}

export async function deleteSyllabus(syllabusId: string) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };

    await prisma.syllabus.delete({
      where: { id: syllabusId },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    return { error: 'Müfredat silinirken bir hata oluştu', data: null };
  }
}

export async function submitParentFeedback(data: SubmitFeedbackData) {
  try {
    const feedback = await prisma.parentFeedback.create({
      data,
    });

    const syllabus = await prisma.syllabus.findUnique({
      where: { id: data.syllabusId },
      include: {
        createdBy: true,
      },
    });

    if (syllabus) {
      await prisma.notification.create({
        data: {
          userId: syllabus.createdById,
          type: 'SYLLABUS_FEEDBACK' as NotificationType,
          title: 'Yeni Veli Geri Bildirimi',
          message: `"${syllabus.title}" müfredatınız için yeni bir veli geri bildirimi alındı.`,
        },
      });
    }

    return {
      error: null,
      data: {
        ...feedback,
        createdAt: feedback.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { error: 'Geri bildirim gönderilirken bir hata oluştu', data: null };
  }
}

export async function getClassroomLessonProgress(classroomId: string, syllabusId: string) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };

    const progress = await prisma.classroomLessonProgress.findMany({
      where: {
        classroomId,
        syllabusId,
      },
      include: {
        lesson: true,
      },
    });

    return {
      error: null,
      data: progress.map(p => ({
        ...p,
        taughtDate: p.taughtDate ? p.taughtDate.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        lesson: {
          ...p.lesson,
          createdAt: p.lesson.createdAt.toISOString(),
          updatedAt: p.lesson.updatedAt.toISOString(),
        },
      })),
    };
  } catch (error) {
    console.error('Error fetching classroom lesson progress:', error);
    return { error: 'İlerleme verisi yüklenirken bir hata oluştu', data: null };
  }
}

export async function updateClassroomLessonProgress(data: UpdateClassroomProgressData) {
  try {
    const { session, error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
    if (error) return { error, data: null };
    const userNode = session!.user;
    const isAdmin = hasRole(session, [UserRole.ADMIN]);
    const isTutor = hasRole(session, [UserRole.TUTOR]);

    if (isTutor && !isAdmin) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: data.classroomId },
      });

      if (!classroom || classroom.tutorId !== userNode.id) {
        return { error: 'Bu sınıfa erişim yetkiniz yok', data: null };
      }
    }

    const progress = await prisma.classroomLessonProgress.upsert({
      where: {
        classroomId_lessonId: {
          classroomId: data.classroomId,
          lessonId: data.lessonId,
        },
      },
      update: {
        isTaught: data.isTaught,
        taughtDate: data.isTaught ? new Date() : null,
        notes: data.notes,
      },
      create: {
        classroomId: data.classroomId,
        syllabusId: data.syllabusId,
        lessonId: data.lessonId,
        isTaught: data.isTaught,
        taughtDate: data.isTaught ? new Date() : null,
        notes: data.notes,
      },
    });

    return {
      error: null,
      data: {
        ...progress,
        taughtDate: progress.taughtDate ? progress.taughtDate.toISOString() : null,
        createdAt: progress.createdAt.toISOString(),
        updatedAt: progress.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error updating classroom lesson progress:', error);
    return { error: 'İlerleme güncellenirken bir hata oluştu', data: null };
  }
}

export async function toggleGlobalStatus(syllabusId: string) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN]);
    if (error) return { error: 'Sadece yöneticiler müfredatı global yapabilir', data: null };

    const currentSyllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
    });

    if (!currentSyllabus) {
      return { error: 'Müfredat bulunamadı', data: null };
    }

    const updated = await prisma.syllabus.update({
      where: { id: syllabusId },
      data: {
        isGlobal: !currentSyllabus.isGlobal,
      },
    });

    return {
      error: null,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error toggling global status:', error);
    return { error: 'Global durum değiştirilirken bir hata oluştu', data: null };
  }
}

export async function getGlobalSyllabusProgress(params?: { search?: string, page?: number, pageSize?: number }) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN]);
    if (error) return { error, data: null };

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const search = params?.search?.toLowerCase() || '';

    const globalSyllabi = await prisma.syllabus.findMany({
      where: { isGlobal: true },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    const totalClassrooms = await prisma.classroom.count({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            tutor: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      } : undefined,
    });

    const classrooms = await prisma.classroom.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            tutor: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      } : undefined,
      include: {
        tutor: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
    });

    const progressRecords = await prisma.classroomLessonProgress.findMany({
      where: {
        syllabusId: { in: globalSyllabi.map(s => s.id) },
        classroomId: { in: classrooms.map(c => c.id) },
      },
    });

    const reportData = classrooms.map(classroom => {
      const syllabusProgress = globalSyllabi.map(syllabus => {
        const syllabusLessonsCount = syllabus.lessons.length;

        const completedLessons = progressRecords.filter(p =>
          p.classroomId === classroom.id &&
          p.syllabusId === syllabus.id &&
          p.isTaught
        );

        const lastCompletedLesson = completedLessons.length > 0
          ? completedLessons.sort((a, b) => (b.taughtDate?.getTime() || 0) - (a.taughtDate?.getTime() || 0))[0]
          : null;

        return {
          syllabusId: syllabus.id,
          syllabusTitle: syllabus.title,
          completedCount: completedLessons.length,
          totalCount: syllabusLessonsCount,
          percentage: syllabusLessonsCount > 0 ? (completedLessons.length / syllabusLessonsCount) * 100 : 0,
          lastUpdated: lastCompletedLesson?.taughtDate?.toISOString() || null,
        };
      });

      return {
        classroomId: classroom.id,
        classroomName: classroom.name,
        tutorName: `${classroom.tutor.firstName || ''} ${classroom.tutor.lastName || ''}`.trim() || classroom.tutor.username,
        syllabiProgress: syllabusProgress,
      };
    });

    return {
      error: null,
      data: {
        results: reportData,
        pagination: {
          total: totalClassrooms,
          page,
          pageSize,
          totalPages: Math.ceil(totalClassrooms / pageSize),
        }
      },
    };
  } catch (error) {
    console.error('Error fetching global syllabus progress:', error);
    return { error: 'İlerleme verileri yüklenirken bir hata oluştu', data: null };
  }
}

export async function getClassroomSyllabusDetail(classroomId: string, syllabusId: string) {
  try {
    const { error } = await requireActionAuth([UserRole.ADMIN]);
    if (error) return { error, data: null };

    const syllabus = await prisma.syllabus.findUnique({
      where: { id: syllabusId },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!syllabus) {
      return { error: 'Müfredat bulunamadı', data: null };
    }

    const progress = await prisma.classroomLessonProgress.findMany({
      where: {
        classroomId,
        syllabusId,
      },
    });

    const progressMap = new Map(progress.map(p => [p.lessonId, p]));

    const detailedLessons = syllabus.lessons.map(lesson => {
      const lessonProgress = progressMap.get(lesson.id);
      return {
        ...lesson,
        isTaught: lessonProgress?.isTaught || false,
        taughtDate: lessonProgress?.taughtDate ? lessonProgress.taughtDate.toISOString() : null,
        notes: lessonProgress?.notes || null,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      };
    });

    return {
      error: null,
      data: {
        syllabusTitle: syllabus.title,
        lessons: detailedLessons,
      },
    };
  } catch (error) {
    console.error('Error fetching classroom syllabus detail:', error);
    return { error: 'Detay verileri yüklenirken bir hata oluştu', data: null };
  }
}
