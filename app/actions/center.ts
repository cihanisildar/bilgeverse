'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { hasRole } from '@/app/lib/auth-utils';
import { revalidatePath } from 'next/cache';

const MANAGE_ROLES = [UserRole.ADMIN, UserRole.BOARD_MEMBER];

async function requireManager() {
    const session = await getServerSession(authOptions);
    if (!hasRole(session, MANAGE_ROLES)) return { ok: false as const, error: 'Bu işlem için yetkiniz yok' };
    return { ok: true as const, error: null };
}
const serialize = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------------- Demirbaş (Inventory) ----------------

export async function getInventory() {
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
    try {
        const data = await prisma.recurringTask.findMany({ orderBy: { dueDate: 'asc' } });
        return { error: null, data: serialize(data) };
    } catch (error) {
        console.error('Error fetching recurring tasks:', error);
        return { error: 'Süreli işler yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertRecurringTask(data: { id?: string; title: string; dueDate: string; notes?: string | null; isDone?: boolean }) {
    const auth = await requireManager();
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.title?.trim()) return { error: 'İş başlığı zorunludur', data: null };
        if (!data.dueDate) return { error: 'Hedef tarih zorunludur', data: null };
        const payload = {
            title: data.title.trim(),
            dueDate: new Date(data.dueDate),
            notes: data.notes?.trim() || null,
            isDone: data.isDone ?? false,
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
