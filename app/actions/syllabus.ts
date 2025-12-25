'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, FeedbackRating, NotificationType } from '@prisma/client';
import crypto from 'crypto';

export async function getSyllabi() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // For tutors: show global syllabi + their own
    // For admins: show all
    const where = session.user.role === UserRole.TUTOR
      ? {
        OR: [
          { createdById: session.user.id },
          { isGlobal: true },
        ],
      }
      : {}; // Admins can see all

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
    const session = await getServerSession(authOptions);

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

    // Get classroom progress if user is a tutor
    let progressMap: { [lessonId: string]: any } = {};
    if (session?.user) {
      const userWithClassroom = await prisma.user.findUnique({
        where: { id: session.user.id },
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
          progressMap[p.lessonId] = p;
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

export async function createSyllabus(data: {
  title: string;
  description?: string;
  driveLink?: string;
  isGlobal?: boolean;
  lessons: Array<{
    title: string;
    description?: string;
    driveLink?: string;
  }>;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler müfredat oluşturabilir', data: null };
    }

    const syllabus = await prisma.syllabus.create({
      data: {
        title: data.title,
        description: data.description,
        driveLink: data.driveLink,
        isGlobal: session.user.role === UserRole.ADMIN ? (data.isGlobal ?? false) : false,
        createdById: session.user.id,
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

export async function updateSyllabus(syllabusId: string, data: {
  title?: string;
  description?: string;
  isPublished?: boolean;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

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
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

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

export async function updateSyllabusLesson(lessonId: string, data: {
  title?: string;
  description?: string;
  isTaught?: boolean;
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

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
      // Get the user's classroom
      const userWithClassroom = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classroom: true },
      });

      if (!userWithClassroom?.classroom) {
        return { error: 'Sınıf bulunamadı', data: null };
      }

      // Get the lesson to find syllabusId
      const lesson = await prisma.syllabusLesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        return { error: 'Ders bulunamadı', data: null };
      }

      // Update classroom progress
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
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Get the max order index
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
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

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
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    await prisma.syllabus.delete({
      where: { id: syllabusId },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    return { error: 'Müfredat silinirken bir hata oluştu', data: null };
  }
}

export async function submitParentFeedback(data: {
  syllabusId: string;
  parentName?: string;
  parentEmail?: string;
  overallRating?: FeedbackRating;
  contentQuality?: FeedbackRating;
  effectiveness?: FeedbackRating;
  engagement?: FeedbackRating;
}) {
  try {
    // No authentication required - parents can submit via shareable link
    const feedback = await prisma.parentFeedback.create({
      data,
    });

    // Get the syllabus to notify the tutor
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: data.syllabusId },
      include: {
        createdBy: true,
      },
    });

    if (syllabus) {
      // Create notification for tutor
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

// ===== CLASSROOM LESSON PROGRESS (NEW) =====

export async function getClassroomLessonProgress(classroomId: string, syllabusId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

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

export async function updateClassroomLessonProgress(data: {
  classroomId: string;
  syllabusId: string;
  lessonId: string;
  isTaught: boolean;
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Verify the user has access to this classroom
    if (session.user.role === UserRole.TUTOR) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: data.classroomId },
      });

      if (!classroom || classroom.tutorId !== session.user.id) {
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
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Sadece yöneticiler müfredatı global yapabilir', data: null };
    }

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
