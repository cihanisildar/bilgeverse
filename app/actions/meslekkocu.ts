'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

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
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
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
