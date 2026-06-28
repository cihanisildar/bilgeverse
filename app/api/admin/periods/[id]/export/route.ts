import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../../../auth/[...nextauth]/auth.config';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

// Build a readable display name from a user record.
function userName(u?: { firstName?: string | null; lastName?: string | null; username?: string | null } | null) {
  if (!u) return '';
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return full || u.username || '';
}

const USER_SELECT = {
  select: { username: true, firstName: true, lastName: true },
} as const;

// Format a date for the spreadsheet (local TR style, sortable).
function fmt(d?: Date | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// GET - export every record belonging to a period as a multi-sheet .xlsx file.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    if (!userRoles.includes(UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const periodId = params.id;
    const period = await prisma.period.findUnique({ where: { id: periodId } });
    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }

    // Fetch every category of records tied to this period.
    const [
      members,
      pointsTx,
      experienceTx,
      notes,
      reports,
      events,
      itemRequests,
      wishes,
      announcements,
      weeklyReports,
    ] = await Promise.all([
      prisma.periodStudent.findMany({
        where: { periodId },
        select: {
          joinedAt: true,
          student: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              deletedAt: true,
              points: true,
              experience: true,
              tutor: USER_SELECT,
            },
          },
        },
        orderBy: { student: { firstName: 'asc' } },
      }),
      prisma.pointsTransaction.findMany({
        where: { periodId },
        select: {
          createdAt: true, points: true, type: true, reason: true, rolledBack: true,
          student: USER_SELECT, tutor: USER_SELECT,
          pointReason: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.experienceTransaction.findMany({
        where: { periodId },
        select: {
          createdAt: true, amount: true, rolledBack: true,
          student: USER_SELECT, tutor: USER_SELECT,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studentNote.findMany({
        where: { periodId },
        select: { createdAt: true, content: true, student: USER_SELECT, tutor: USER_SELECT },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studentReport.findMany({
        where: { periodId },
        select: { createdAt: true, title: true, content: true, student: USER_SELECT, tutor: USER_SELECT },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.findMany({
        where: { periodId },
        select: {
          title: true, customName: true, startDateTime: true, endDateTime: true,
          location: true, capacity: true, points: true, experience: true, status: true,
          createdBy: USER_SELECT,
          _count: { select: { participants: true } },
        },
        orderBy: { startDateTime: 'desc' },
      }),
      prisma.itemRequest.findMany({
        where: { periodId },
        select: {
          createdAt: true, pointsSpent: true, status: true, note: true,
          student: USER_SELECT, tutor: USER_SELECT, item: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wish.findMany({
        where: { periodId },
        select: {
          createdAt: true, title: true, description: true, response: true, respondedAt: true,
          student: USER_SELECT,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.announcement.findMany({
        where: { periodId },
        select: { createdAt: true, title: true, content: true, createdBy: USER_SELECT },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.weeklyReport.findMany({
        where: { periodId },
        select: {
          weekNumber: true, status: true, submissionDate: true, reviewDate: true,
          pointsAwarded: true, user: USER_SELECT, reviewedBy: USER_SELECT,
        },
        orderBy: [{ weekNumber: 'asc' }],
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bilgeverse';
    workbook.created = new Date();

    // Helper: create a sheet from a header list + row objects, with styling.
    const addSheet = (
      name: string,
      columns: { header: string; key: string; width?: number }[],
      rows: Record<string, unknown>[]
    ) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 22 }));
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      headerRow.alignment = { vertical: 'middle' };
      rows.forEach((r) => sheet.addRow(r));
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    };

    // 1) Summary
    const summary = workbook.addWorksheet('Özet');
    summary.columns = [
      { header: 'Alan', key: 'k', width: 28 },
      { header: 'Değer', key: 'v', width: 40 },
    ];
    const summaryHeader = summary.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    const statusLabel: Record<string, string> = { ACTIVE: 'Aktif', INACTIVE: 'Pasif', ARCHIVED: 'Arşivlenmiş' };
    [
      ['Dönem Adı', period.name],
      ['Açıklama', period.description ?? ''],
      ['Durum', statusLabel[period.status] ?? period.status],
      ['Başlangıç', fmt(period.startDate)],
      ['Bitiş', period.endDate ? fmt(period.endDate) : ''],
      ['Toplam Hafta', String(period.totalWeeks)],
      ['Oluşturulma', fmt(period.createdAt)],
      ['', ''],
      ['Öğrenci Sayısı', String(members.length)],
      ['Puan İşlemi', String(pointsTx.length)],
      ['Deneyim İşlemi', String(experienceTx.length)],
      ['Öğrenci Notu', String(notes.length)],
      ['Öğrenci Raporu', String(reports.length)],
      ['Etkinlik', String(events.length)],
      ['Ürün Talebi', String(itemRequests.length)],
      ['Dilek', String(wishes.length)],
      ['Duyuru', String(announcements.length)],
      ['Haftalık Rapor', String(weeklyReports.length)],
      ['', ''],
      ['Dışa Aktarma Tarihi', fmt(new Date())],
    ].forEach(([k, v]) => summary.addRow({ k, v }));

    // 2) Members
    addSheet('Öğrenciler',
      [
        { header: 'Kullanıcı Adı', key: 'username', width: 20 },
        { header: 'Ad', key: 'firstName', width: 18 },
        { header: 'Soyad', key: 'lastName', width: 18 },
        { header: 'Rehber', key: 'tutor', width: 24 },
        { header: 'Puan', key: 'points', width: 10 },
        { header: 'Deneyim', key: 'experience', width: 10 },
        { header: 'Döneme Katılım', key: 'joinedAt', width: 20 },
        { header: 'Durum', key: 'durum', width: 14 },
      ],
      members.map((m) => ({
        username: m.student.username,
        firstName: m.student.firstName ?? '',
        lastName: m.student.lastName ?? '',
        tutor: userName(m.student.tutor),
        points: m.student.points,
        experience: m.student.experience,
        joinedAt: fmt(m.joinedAt),
        durum: m.student.deletedAt ? 'Silinmiş' : 'Aktif',
      }))
    );

    // 3) Points transactions
    addSheet('Puan İşlemleri',
      [
        { header: 'Tarih', key: 'createdAt', width: 20 },
        { header: 'Öğrenci', key: 'student', width: 24 },
        { header: 'Rehber', key: 'tutor', width: 24 },
        { header: 'Puan', key: 'points', width: 10 },
        { header: 'Tip', key: 'type', width: 14 },
        { header: 'Sebep', key: 'reason', width: 36 },
        { header: 'Geri Alındı', key: 'rolledBack', width: 12 },
      ],
      pointsTx.map((t) => ({
        createdAt: fmt(t.createdAt),
        student: userName(t.student),
        tutor: userName(t.tutor),
        points: t.points,
        type: t.type === 'AWARD' ? 'Kazanım' : t.type === 'REDEEM' ? 'Harcama' : t.type,
        reason: t.reason || t.pointReason?.name || '',
        rolledBack: t.rolledBack ? 'Evet' : 'Hayır',
      }))
    );

    // 4) Experience transactions
    addSheet('Deneyim İşlemleri',
      [
        { header: 'Tarih', key: 'createdAt', width: 20 },
        { header: 'Öğrenci', key: 'student', width: 24 },
        { header: 'Rehber', key: 'tutor', width: 24 },
        { header: 'Miktar', key: 'amount', width: 10 },
        { header: 'Geri Alındı', key: 'rolledBack', width: 12 },
      ],
      experienceTx.map((t) => ({
        createdAt: fmt(t.createdAt),
        student: userName(t.student),
        tutor: userName(t.tutor),
        amount: t.amount,
        rolledBack: t.rolledBack ? 'Evet' : 'Hayır',
      }))
    );

    // 5) Notes
    addSheet('Öğrenci Notları',
      [
        { header: 'Tarih', key: 'createdAt', width: 20 },
        { header: 'Öğrenci', key: 'student', width: 24 },
        { header: 'Rehber', key: 'tutor', width: 24 },
        { header: 'İçerik', key: 'content', width: 60 },
      ],
      notes.map((n) => ({
        createdAt: fmt(n.createdAt),
        student: userName(n.student),
        tutor: userName(n.tutor),
        content: n.content,
      }))
    );

    // 6) Reports
    addSheet('Öğrenci Raporları',
      [
        { header: 'Tarih', key: 'createdAt', width: 20 },
        { header: 'Öğrenci', key: 'student', width: 24 },
        { header: 'Rehber', key: 'tutor', width: 24 },
        { header: 'Başlık', key: 'title', width: 30 },
        { header: 'İçerik', key: 'content', width: 60 },
      ],
      reports.map((r) => ({
        createdAt: fmt(r.createdAt),
        student: userName(r.student),
        tutor: userName(r.tutor),
        title: r.title,
        content: r.content,
      }))
    );

    // 7) Events
    addSheet('Etkinlikler',
      [
        { header: 'Başlık', key: 'title', width: 30 },
        { header: 'Başlangıç', key: 'start', width: 20 },
        { header: 'Bitiş', key: 'end', width: 20 },
        { header: 'Konum', key: 'location', width: 20 },
        { header: 'Kapasite', key: 'capacity', width: 10 },
        { header: 'Puan', key: 'points', width: 10 },
        { header: 'Deneyim', key: 'experience', width: 10 },
        { header: 'Durum', key: 'status', width: 14 },
        { header: 'Katılımcı', key: 'participants', width: 12 },
        { header: 'Oluşturan', key: 'createdBy', width: 24 },
      ],
      events.map((e) => ({
        title: e.customName || e.title,
        start: fmt(e.startDateTime),
        end: fmt(e.endDateTime),
        location: e.location,
        capacity: e.capacity,
        points: e.points,
        experience: e.experience,
        status: e.status,
        participants: e._count.participants,
        createdBy: userName(e.createdBy),
      }))
    );

    // 8) Item requests
    addSheet('Ürün Talepleri',
      [
        { header: 'Tarih', key: 'createdAt', width: 20 },
        { header: 'Öğrenci', key: 'student', width: 24 },
        { header: 'Rehber', key: 'tutor', width: 24 },
        { header: 'Ürün', key: 'item', width: 26 },
        { header: 'Harcanan Puan', key: 'pointsSpent', width: 14 },
        { header: 'Durum', key: 'status', width: 14 },
        { header: 'Not', key: 'note', width: 36 },
      ],
      itemRequests.map((r) => ({
        createdAt: fmt(r.createdAt),
        student: userName(r.student),
        tutor: userName(r.tutor),
        item: r.item?.name ?? '',
        pointsSpent: r.pointsSpent,
        status: r.status,
        note: r.note ?? '',
      }))
    );

    // 9) Wishes
    addSheet('Dilekler',
      [
        { header: 'Tarih', key: 'createdAt', width: 20 },
        { header: 'Öğrenci', key: 'student', width: 24 },
        { header: 'Başlık', key: 'title', width: 30 },
        { header: 'Açıklama', key: 'description', width: 50 },
        { header: 'Yanıt', key: 'response', width: 40 },
        { header: 'Yanıt Tarihi', key: 'respondedAt', width: 20 },
      ],
      wishes.map((w) => ({
        createdAt: fmt(w.createdAt),
        student: userName(w.student),
        title: w.title,
        description: w.description,
        response: w.response ?? '',
        respondedAt: fmt(w.respondedAt),
      }))
    );

    // 10) Announcements
    addSheet('Duyurular',
      [
        { header: 'Tarih', key: 'createdAt', width: 20 },
        { header: 'Başlık', key: 'title', width: 30 },
        { header: 'İçerik', key: 'content', width: 60 },
        { header: 'Oluşturan', key: 'createdBy', width: 24 },
      ],
      announcements.map((a) => ({
        createdAt: fmt(a.createdAt),
        title: a.title,
        content: a.content,
        createdBy: userName(a.createdBy),
      }))
    );

    // 11) Weekly reports
    addSheet('Haftalık Raporlar',
      [
        { header: 'Hafta', key: 'weekNumber', width: 10 },
        { header: 'Kullanıcı', key: 'user', width: 24 },
        { header: 'Durum', key: 'status', width: 16 },
        { header: 'Gönderim', key: 'submissionDate', width: 20 },
        { header: 'İnceleme', key: 'reviewDate', width: 20 },
        { header: 'Verilen Puan', key: 'pointsAwarded', width: 14 },
        { header: 'İnceleyen', key: 'reviewedBy', width: 24 },
      ],
      weeklyReports.map((wr) => ({
        weekNumber: wr.weekNumber,
        user: userName(wr.user),
        status: wr.status,
        submissionDate: fmt(wr.submissionDate),
        reviewDate: fmt(wr.reviewDate),
        pointsAwarded: wr.pointsAwarded,
        reviewedBy: userName(wr.reviewedBy),
      }))
    );

    const buffer = await workbook.xlsx.writeBuffer();

    // Build a filesystem-safe filename from the period name.
    const safeName = period.name.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || 'donem';
    const filename = `${safeName}_kayitlar.xlsx`;
    // HTTP headers are latin1 (ByteString) only, so the plain `filename=`
    // fallback must be ASCII; the real Turkish name goes in `filename*=UTF-8''`.
    const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('Error exporting period:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
