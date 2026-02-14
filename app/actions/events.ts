'use server';

import { requireActionAuth, hasRole } from '@/app/lib/auth-utils';
import prisma from '@/lib/prisma';
import { Part2EventStatus, Part2ParticipantStatus, CheckInMethod, UserRole } from '@prisma/client';
import crypto from 'crypto';

export type ActionResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

export interface EventFilters {
    status?: Part2EventStatus;
    eventTypeId?: string;
}

export interface CreateEventData {
    title: string;
    description: string;
    eventTypeId: string;
    eventDate: string | Date;
    location: string;
    capacity?: number;
    notes?: string;
    status?: Part2EventStatus;
    generateQR?: boolean;
}

export interface UpdateEventData {
    title?: string;
    description?: string;
    eventTypeId?: string;
    eventDate?: string | Date;
    location?: string;
    capacity?: number;
    notes?: string;
    status?: Part2EventStatus;
}

export interface CreateEventTypeData {
    name: string;
    description?: string;
}

export interface UpdateEventTypeData {
    name?: string;
    description?: string;
    isActive?: boolean;
}

// Get all Part2 events with optional filtering
export async function getPart2Events(filters?: EventFilters): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth();
        if (error) return { success: false, error };

        const where: Record<string, any> = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.eventTypeId) where.eventTypeId = filters.eventTypeId;

        const events = await prisma.part2Event.findMany({
            where,
            include: {
                eventType: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                participants: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
            orderBy: {
                eventDate: 'asc',
            },
        });

        return { success: true, data: JSON.parse(JSON.stringify(events)) };
    } catch (error) {
        console.error('Error fetching Part2 events:', error);
        return { success: false, error: 'Failed to fetch events' };
    }
}

// Get single Part2 event by ID
export async function getPart2Event(eventId: string): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth();
        if (error) return { success: false, error };

        const event = await prisma.part2Event.findUnique({
            where: { id: eventId },
            include: {
                eventType: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                participants: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: {
                        registeredAt: 'asc',
                    },
                },
            },
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        return { success: true, data: JSON.parse(JSON.stringify(event)) };
    } catch (error) {
        console.error('Error fetching Part2 event:', error);
        return { success: false, error: 'Failed to fetch event' };
    }
}

// Create new Part2 event
export async function createPart2Event(data: CreateEventData): Promise<ActionResponse> {
    try {
        const { session, error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
        if (error) return { success: false, error };

        const user = session!.user;

        // Verify event type exists
        const eventType = await prisma.part2EventType.findUnique({
            where: { id: data.eventTypeId },
        });

        if (!eventType) {
            return { success: false, error: 'Invalid event type' };
        }

        const eventData: Record<string, any> = {
            title: data.title,
            description: data.description,
            eventTypeId: data.eventTypeId,
            eventDate: typeof data.eventDate === 'string' ? new Date(data.eventDate) : data.eventDate,
            location: data.location,
            capacity: data.capacity || 30,
            notes: data.notes,
            status: data.status || 'YAKINDA',
            createdById: user.id,
        };

        // Generate QR code if requested
        if (data.generateQR) {
            const qrToken = crypto.randomBytes(32).toString('hex');
            const qrExpiry = new Date();
            qrExpiry.setHours(qrExpiry.getHours() + 24); // 24 hour expiry

            eventData.qrCodeToken = qrToken;
            eventData.qrCodeExpiresAt = qrExpiry;
        }

        const event = await prisma.part2Event.create({
            data: eventData as any,
            include: {
                eventType: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
        });

        return { success: true, data: JSON.parse(JSON.stringify(event)) };
    } catch (error) {
        console.error('Error creating Part2 event:', error);
        return { success: false, error: 'Failed to create event' };
    }
}

// Update Part2 event
export async function updatePart2Event(
    eventId: string,
    data: UpdateEventData
): Promise<ActionResponse> {
    try {
        const { session, error } = await requireActionAuth();
        if (error) return { success: false, error };

        const user = session!.user;
        const isAdmin = hasRole(session, [UserRole.ADMIN]);

        const event = await prisma.part2Event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Only admin or event creator can update
        if (!isAdmin && event.createdById !== user.id) {
            return { success: false, error: 'You do not have permission to update this event' };
        }

        // Convert eventDate string to Date if provided
        const updateData: Record<string, any> = { ...data };
        if (updateData.eventDate && typeof updateData.eventDate === 'string') {
            updateData.eventDate = new Date(updateData.eventDate);
        }

        const updatedEvent = await prisma.part2Event.update({
            where: { id: eventId },
            data: updateData,
            include: {
                eventType: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
        });

        return { success: true, data: JSON.parse(JSON.stringify(updatedEvent)) };
    } catch (error) {
        console.error('Error updating Part2 event:', error);
        return { success: false, error: 'Failed to update event' };
    }
}

// Delete Part2 event
export async function deletePart2Event(eventId: string): Promise<ActionResponse> {
    try {
        const { session, error } = await requireActionAuth();
        if (error) return { success: false, error };

        const user = session!.user;
        const isAdmin = hasRole(session, [UserRole.ADMIN]);
        const event = await prisma.part2Event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Only admin or event creator can delete
        if (!isAdmin && event.createdById !== user.id) {
            return { success: false, error: 'You do not have permission to delete this event' };
        }

        await prisma.part2Event.delete({
            where: { id: eventId },
        });

        return { success: true, data: { message: 'Event deleted successfully' } };
    } catch (error) {
        console.error('Error deleting Part2 event:', error);
        return { success: false, error: 'Failed to delete event' };
    }
}

// Generate QR code for Part2 event
export async function generateQRCodeForPart2Event(eventId: string): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
        if (error) return { success: false, error };

        const event = await prisma.part2Event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Generate new QR token
        const qrToken = crypto.randomBytes(32).toString('hex');
        const qrExpiry = new Date();
        qrExpiry.setHours(qrExpiry.getHours() + 24); // 24 hour expiry

        const updatedEvent = await prisma.part2Event.update({
            where: { id: eventId },
            data: {
                qrCodeToken: qrToken,
                qrCodeExpiresAt: qrExpiry,
            },
        });

        return { success: true, data: JSON.parse(JSON.stringify(updatedEvent)) };
    } catch (error) {
        console.error('Error generating QR code:', error);
        return { success: false, error: 'Failed to generate QR code' };
    }
}

// Register for Part2 event
export async function registerForPart2Event(eventId: string): Promise<ActionResponse> {
    try {
        const { session, error } = await requireActionAuth();
        if (error) return { success: false, error };
        const userNode = session!.user;

        const event = await prisma.part2Event.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { participants: true },
                },
            },
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Check if already registered
        const existingRegistration = await prisma.part2EventParticipant.findUnique({
            where: {
                eventId_studentId: {
                    eventId,
                    studentId: userNode.id,
                },
            },
        });

        if (existingRegistration) {
            return { success: false, error: 'You are already registered for this event' };
        }

        // Check capacity
        if (event._count.participants >= event.capacity) {
            return { success: false, error: 'Event is full' };
        }

        const participant = await prisma.part2EventParticipant.create({
            data: {
                eventId,
                studentId: userNode.id,
                status: 'REGISTERED',
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
        });

        return { success: true, data: JSON.parse(JSON.stringify(participant)) };
    } catch (error) {
        console.error('Error registering for Part2 event:', error);
        return { success: false, error: 'Failed to register for event' };
    }
}

// Check in to Part2 event (QR or manual)
export async function checkInToPart2Event(eventId: string, qrToken?: string): Promise<ActionResponse> {
    try {
        const { session, error } = await requireActionAuth();
        if (error) return { success: false, error };
        const userNode = session!.user;

        const event = await prisma.part2Event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Check if event is ongoing
        if (event.status !== 'DEVAM_EDIYOR') {
            return { success: false, error: 'Event is not currently active for check-in' };
        }

        // If QR token provided, verify it
        if (qrToken) {
            if (!event.qrCodeToken || event.qrCodeToken !== qrToken) {
                return { success: false, error: 'Invalid QR code' };
            }

            if (event.qrCodeExpiresAt && new Date(event.qrCodeExpiresAt) < new Date()) {
                return { success: false, error: 'QR code has expired' };
            }
        }

        // Check if participant exists
        const participant = await prisma.part2EventParticipant.findUnique({
            where: {
                eventId_studentId: {
                    eventId,
                    studentId: userNode.id,
                },
            },
        });

        if (!participant) {
            // Auto-register and check in
            const newParticipant = await prisma.part2EventParticipant.create({
                data: {
                    eventId,
                    studentId: session!.user.id,
                    status: 'ATTENDED',
                    checkInMethod: qrToken ? 'QR' : 'MANUAL',
                    checkInTime: new Date(),
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                        },
                    },
                },
            });
            return { success: true, data: JSON.parse(JSON.stringify(newParticipant)) };
        }

        // Update participant status to attended
        const updatedParticipant = await prisma.part2EventParticipant.update({
            where: {
                eventId_studentId: {
                    eventId,
                    studentId: session!.user.id,
                },
            },
            data: {
                status: 'ATTENDED',
                checkInMethod: qrToken ? 'QR' : 'MANUAL',
                checkInTime: new Date(),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
        });

        return { success: true, data: JSON.parse(JSON.stringify(updatedParticipant)) };
    } catch (error) {
        console.error('Error checking in to Part2 event:', error);
        return { success: false, error: 'Failed to check in to event' };
    }
}

// Get all Part2 event types
export async function getPart2EventTypes(): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth();
        if (error) return { success: false, error };

        const eventTypes = await prisma.part2EventType.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return { success: true, data: JSON.parse(JSON.stringify(eventTypes)) };
    } catch (error) {
        console.error('Error fetching Part2 event types:', error);
        return { success: false, error: 'Failed to fetch event types' };
    }
}

// Create Part2 event type (admin/tutor only)
export async function createPart2EventType(data: CreateEventTypeData): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
        if (error) return { success: false, error };

        const eventType = await prisma.part2EventType.create({
            data: {
                name: data.name,
                description: data.description,
            },
        });

        // Serialize dates for Next.js server action
        return {
            success: true,
            data: JSON.parse(JSON.stringify(eventType))
        };
    } catch (error) {
        console.error('Error creating Part2 event type:', error);
        return { success: false, error: 'Failed to create event type' };
    }
}

// Update Part2 event type
export async function updatePart2EventType(
    eventTypeId: string,
    data: UpdateEventTypeData
): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { success: false, error };

        const eventType = await prisma.part2EventType.update({
            where: { id: eventTypeId },
            data,
        });

        return { success: true, data: JSON.parse(JSON.stringify(eventType)) };
    } catch (error) {
        console.error('Error updating Part2 event type:', error);
        return { success: false, error: 'Failed to update event type' };
    }
}

// Delete Part2 event type
export async function deletePart2EventType(eventTypeId: string): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { success: false, error };

        await prisma.part2EventType.delete({
            where: { id: eventTypeId },
        });

        return { success: true, data: { message: 'Event type deleted successfully' } };
    } catch (error) {
        console.error('Error deleting Part2 event type:', error);
        return { success: false, error: 'Failed to delete event type' };
    }
}

// Get all users for manual participant addition
export async function getStudentsForEvent(): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
        if (error) return { success: false, error };

        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
                role: true,
            },
            orderBy: [
                { role: 'asc' },
                { firstName: 'asc' },
                { lastName: 'asc' },
            ],
        });

        return { success: true, data: JSON.parse(JSON.stringify(users)) };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

// Manually add participant to Part2 event (admin/tutor only)
export async function addParticipantToPart2Event(
    eventId: string,
    studentId: string
): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
        if (error) return { success: false, error };

        const event = await prisma.part2Event.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { participants: true },
                },
            },
        });

        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Check if already registered
        const existingRegistration = await prisma.part2EventParticipant.findUnique({
            where: {
                eventId_studentId: {
                    eventId,
                    studentId,
                },
            },
        });

        if (existingRegistration) {
            return { success: false, error: 'Student is already registered for this event' };
        }

        // Check capacity
        if (event._count.participants >= event.capacity) {
            return { success: false, error: 'Event is full' };
        }

        const participant = await prisma.part2EventParticipant.create({
            data: {
                eventId,
                studentId,
                status: 'REGISTERED',
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return { success: true, data: JSON.parse(JSON.stringify(participant)) };
    } catch (error) {
        console.error('Error adding participant to Part2 event:', error);
        return { success: false, error: 'Failed to add participant' };
    }
}

// Remove participant from Part2 event (admin/tutor only)
export async function removeParticipantFromPart2Event(
    eventId: string,
    studentId: string
): Promise<ActionResponse> {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.TUTOR]);
        if (error) return { success: false, error };

        await prisma.part2EventParticipant.delete({
            where: {
                eventId_studentId: {
                    eventId,
                    studentId,
                },
            },
        });

        return { success: true, data: { message: 'Participant removed successfully' } };
    } catch (error) {
        console.error('Error removing participant from Part2 event:', error);
        return { success: false, error: 'Failed to remove participant' };
    }
}

