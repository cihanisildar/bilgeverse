'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { hasRole } from '@/app/lib/auth-utils';
import { requirePartLicense } from '@/app/lib/permissions.server';
import { revalidatePath } from 'next/cache';
import { isRepeatKind, nextDueDate, isDueForReminder, normalizeRepeatEvery, normalizeRepeatUnit } from '@/app/lib/recurring';

const MANAGE_ROLES = [UserRole.ADMIN, UserRole.BOARD_MEMBER];

/** Gençlik Merkezi modülü. Paket kapısı hem okuma hem yazma uçlarında aranır. */
const CENTER_PART = 10;

/** Yalnız kurum paketi aranır — okuma uçları için. */
async function requireLicense() {
    const gate = await requirePartLicense(CENTER_PART);
    return gate.error ? { ok: false as const, error: gate.error } : { ok: true as const, error: null };
}

async function requireManager() {
    const gate = await requirePartLicense(CENTER_PART);
    if (gate.error) return { ok: false as const, error: gate.error };
    if (!hasRole(gate.session, MANAGE_ROLES)) return { ok: false as const, error: 'Bu işlem için yetkiniz yok' };
    return { ok: true as const, error: null };
}
const serialize = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------------- Demirbaş (Inventory) ----------------

export async function getInventory() {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const data = await prisma.inventoryItem.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
        return { error: null, data: serialize(data) };
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return { error: 'Demirbaş listesi yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertInventoryItem(data: {
    id?: string; name: string; quantity?: number; category?: string | null; location?: string | null; condition?: string; notes?: string | null;
}) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.name?.trim()) return { error: 'Demirbaş adı zorunludur', data: null };
        const payload = {
            name: data.name.trim(),
            quantity: data.quantity && data.quantity > 0 ? Math.trunc(data.quantity) : 1,
            category: data.category?.trim() || null,
            location: data.location?.trim() || null,
            condition: ['GOOD', 'NEEDS_REPAIR', 'BROKEN'].includes(data.condition || '') ? data.condition! : 'GOOD',
            notes: data.notes?.trim() || null,
        };
        const record = data.id
            ? await prisma.inventoryItem.update({ where: { id: data.id }, data: payload })
            : await prisma.inventoryItem.create({ data: payload });
        revalidatePath('/dashboard/part10/inventory');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving inventory item:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}

export async function deleteInventoryItem(id: string) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.inventoryItem.delete({ where: { id } });
        revalidatePath('/dashboard/part10/inventory');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return { error: 'Silme sırasında bir hata oluştu', data: null };
    }
}

// ---------------- Görev Takibi (To-do) ----------------

export async function getCenterTasks() {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const data = await prisma.centerTask.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] });
        return { error: null, data: serialize(data) };
    } catch (error) {
        console.error('Error fetching center tasks:', error);
        return { error: 'Görevler yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertCenterTask(data: { id?: string; title: string; description?: string | null; status?: string; dueDate?: string | null }) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.title?.trim()) return { error: 'Görev başlığı zorunludur', data: null };
        const payload = {
            title: data.title.trim(),
            description: data.description?.trim() || null,
            status: ['TODO', 'IN_PROGRESS', 'DONE'].includes(data.status || '') ? data.status! : 'TODO',
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
        };
        const record = data.id
            ? await prisma.centerTask.update({ where: { id: data.id }, data: payload })
            : await prisma.centerTask.create({ data: payload });
        revalidatePath('/dashboard/part10/tasks');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving center task:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}

export async function deleteCenterTask(id: string) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.centerTask.delete({ where: { id } });
        revalidatePath('/dashboard/part10/tasks');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting center task:', error);
        return { error: 'Silme sırasında bir hata oluştu', data: null };
    }
}

// ---------------- Süreli İşler (Recurring) ----------------

export async function getRecurringTasks() {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const data = await prisma.recurringTask.findMany({ orderBy: { dueDate: 'asc' } });
        return { error: null, data: serialize(data) };
    } catch (error) {
        console.error('Error fetching recurring tasks:', error);
        return { error: 'Süreli işler yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertRecurringTask(data: { id?: string; title: string; dueDate: string; notes?: string | null; isDone?: boolean; repeat?: string; repeatEvery?: number; repeatUnit?: string; leadDays?: number }) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.title?.trim()) return { error: 'İş başlığı zorunludur', data: null };
        if (!data.dueDate) return { error: 'Hedef tarih zorunludur', data: null };
        const repeat = isRepeatKind(data.repeat) ? data.repeat : 'NONE';
        // 0 gün = "tam gününde hatırlat"; üst sınır bir yılı aşmasın.
        const leadDays = Math.min(Math.max(Math.trunc(Number(data.leadDays ?? 7)) || 0, 0), 365);
        // Özel aralık yalnız CUSTOM'da anlamlı; diğerlerinde varsayılana çekilir
        // ki seçenek değiştirildiğinde eski değer kayıtta asılı kalmasın.
        const isCustom = repeat === 'CUSTOM';
        const repeatEvery = isCustom ? normalizeRepeatEvery(data.repeatEvery) : 1;
        const repeatUnit = isCustom ? normalizeRepeatUnit(data.repeatUnit) : 'MONTH';
        const payload = {
            title: data.title.trim(),
            dueDate: new Date(data.dueDate),
            notes: data.notes?.trim() || null,
            isDone: data.isDone ?? false,
            repeat,
            repeatEvery,
            repeatUnit,
            leadDays,
        };
        const record = data.id
            ? await prisma.recurringTask.update({ where: { id: data.id }, data: payload })
            : await prisma.recurringTask.create({ data: payload });
        revalidatePath('/dashboard/part10/recurring');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving recurring task:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}

/**
 * Süreli işi "yapıldı" olarak işaretler.
 *
 * Tekrarsız işlerde kayıt kapanır. Tekrarlı işlerde ise KAPANMAZ: hedef tarih
 * bir sonraki tekrara ilerler ve lastDoneAt güncellenir. Müşterinin istediği
 * davranış bu — aynı iş (kira zammı, abonelik yenileme, yıllık beyanname…)
 * her seferinde yeniden kaydedilmesin.
 */
export async function completeRecurringTask(id: string, done = true) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        const task = await prisma.recurringTask.findUnique({ where: { id } });
        if (!task) return { error: 'Kayıt bulunamadı', data: null };

        // Geri alma: sadece işareti kaldırır, tarihe dokunmaz.
        if (!done) {
            const reopened = await prisma.recurringTask.update({ where: { id }, data: { isDone: false } });
            revalidatePath('/dashboard/part10/recurring');
            revalidatePath('/dashboard/part10');
            return { error: null, data: serialize(reopened) };
        }

        const next = nextDueDate(task.dueDate, task.repeat, { every: task.repeatEvery, unit: task.repeatUnit });
        const record = await prisma.recurringTask.update({
            where: { id },
            data: next
                ? { dueDate: next, lastDoneAt: new Date(), isDone: false }
                : { isDone: true, lastDoneAt: new Date() },
        });

        revalidatePath('/dashboard/part10/recurring');
        revalidatePath('/dashboard/part10');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error completing recurring task:', error);
        return { error: 'İşlem sırasında bir hata oluştu', data: null };
    }
}

/**
 * Hatırlatma penceresine girmiş süreli işler (gecikmişler dahil).
 * Her işin kendi leadDays değeri olduğu için filtre SQL'de değil burada
 * uygulanıyor; tablo küçük (kurum başına birkaç düzine kayıt).
 */
export async function getRecurringReminders() {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const rows = await prisma.recurringTask.findMany({
            where: { isDone: false },
            orderBy: { dueDate: 'asc' },
        });
        return { error: null, data: serialize(rows.filter((t) => isDueForReminder(t))) };
    } catch (error) {
        console.error('Error fetching recurring reminders:', error);
        return { error: 'Hatırlatmalar yüklenirken bir hata oluştu', data: null };
    }
}

export async function deleteRecurringTask(id: string) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.recurringTask.delete({ where: { id } });
        revalidatePath('/dashboard/part10/recurring');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting recurring task:', error);
        return { error: 'Silme sırasında bir hata oluştu', data: null };
    }
}
