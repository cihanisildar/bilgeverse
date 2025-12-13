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

    // For tutors, only show their syllabi
    const where = session.user.role === UserRole.TUTOR
      ? { createdById: session.user.id }
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
          taughtDate: l.taughtDate ? l.taughtDate.toISOString() : null,
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

    return {
      error: null,
      data: {
        ...syllabus,
        createdAt: syllabus.createdAt.toISOString(),
        updatedAt: syllabus.updatedAt.toISOString(),
        lessons: syllabus.lessons.map((l) => ({
          ...l,
          taughtDate: l.taughtDate ? l.taughtDate.toISOString() : null,
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
          taughtDate: l.taughtDate ? l.taughtDate.toISOString() : null,
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
  lessons: Array<{
    title: string;
    description?: string;
  }>;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim: Sadece öğretmenler ve yöneticiler müfredat oluşturabilir', data: null };
    }

    const syllabus = await prisma.syllabus.create({
      data: {
        title: data.title,
        description: data.description,
        createdById: session.user.id,
        lessons: {
          create: data.lessons.map((lesson, index) => ({
            title: lesson.title,
            description: lesson.description,
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
          taughtDate: l.taughtDate ? l.taughtDate.toISOString() : null,
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
          taughtDate: l.taughtDate ? l.taughtDate.toISOString() : null,
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

    const updateData: any = { ...data };

    // If marking as taught, set the taught date
    if (data.isTaught !== undefined && data.isTaught) {
      updateData.taughtDate = new Date();
    } else if (data.isTaught === false) {
      updateData.taughtDate = null;
    }

    const lesson = await prisma.syllabusLesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return {
      error: null,
      data: {
        ...lesson,
        taughtDate: lesson.taughtDate ? lesson.taughtDate.toISOString() : null,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error updating lesson:', error);
    return { error: 'Ders güncellenirken bir hata oluştu', data: null };
  }
}

export async function addLessonToSyllabus(syllabusId: string, data: {
  title: string;
  description?: string;
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
        orderIndex,
      },
    });

    return {
      error: null,
      data: {
        ...lesson,
        taughtDate: lesson.taughtDate ? lesson.taughtDate.toISOString() : null,
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
