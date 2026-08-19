'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { isPartLicensed, requirePartLicense } from '@/app/lib/permissions.server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Kurumun Koçluk ve Danışmanlık paketi (part 5) + oturum.
 *
 * Paket yoksa null döner; çağıran taraftaki mevcut oturum/rol kontrolleri
 * isteği zaten reddeder. Sayfa katmanı ayrıca requireAuth({ partId: 5 })
 * ile kapılı — buradaki kapı, server action'ın doğrudan çağrılması hâlini kapatır.
 */
const LICENSED_PART = 5;

async function getLicensedSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    if (!(await isPartLicensed(session, LICENSED_PART))) return null;
    return session;
}

/** Oturuma bakmayan okuma uçları için yalnız paket kontrolü. */
async function requireLicense() {
    const gate = await requirePartLicense(LICENSED_PART);
    return { ok: !gate.error, error: gate.error };
}


const API_URL = 'https://meslekkocu.com/api/partner/v1/students';

interface RegisterStudentResult {
    success: boolean;
    message: string;
    studentId?: string;
}

export async function registerStudentsToMeslekkocu(
    students: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        productCode: string[]; // ["M", "S"]
    }[]
): Promise<RegisterStudentResult[]> {
    const session = await getLicensedSession();

    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes('ADMIN' as any);

    if (!session?.user || !isAdmin) {
        throw new Error('Unauthorized');
    }

    const apiKey = process.env.MESLEKKOCU_API_KEY;
    const apiSecret = process.env.MESLEKKOCU_API_SECRET;

    if (!apiKey || !apiSecret) {
        return students.map(s => ({
            success: false,
            message: 'API configuration missing (API Key/Secret)',
            studentId: s.id,
        }));
    }

    const results: RegisterStudentResult[] = [];

    for (const student of students) {
        try {
            // Corrected payload structure based on documentation
            // Note: Documentation says "productIds", previous code used "products" or "productCode"
            const body = {
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phone: student.phone,
                productIds: student.productCode, // M or S
                // Optional fields can be added if available: city, district
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiKey,
                    'X-API-SECRET': apiSecret,
                },
                body: JSON.stringify(body),
            });

            const responseText = await response.text();
            // Log for debugging (can be removed later)
            console.log(`[Meslekkocu API] POST ${API_URL}`);
            console.log(`[Meslekkocu API] Status: ${response.status}`);
            console.log(`[Meslekkocu API] Body:`, responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                results.push({
                    success: false,
                    message: `API Sunucu Hatası (HTML döndü: ${response.status})`,
                    studentId: student.id,
                });
                continue;
            }

            if (response.ok && data.success) {
                // Update local database to mark as integrated
                await prisma.user.update({
                    where: { id: student.id },
                    data: {
                        // Use returned ID if available, otherwise generic marker
                        meslekkocuId: data.data?.id || 'integrated'
                    }
                });

                results.push({
                    success: true,
                    message: 'Başarıyla kaydedildi',
                    studentId: student.id,
                });
            } else {
                // Handle API specific error messages
                const errorMsg = data.message || data.error || (data.errors ? JSON.stringify(data.errors) : 'Hata oluştu');
                results.push({
                    success: false,
                    message: errorMsg,
                    studentId: student.id,
                });
            }
        } catch (error) {
            console.error('Meslekkocu API Connection Error:', error);
            results.push({
                success: false,
                message: 'Bağlantı hatası',
                studentId: student.id,
            });
        }
    }

    return results;
}
