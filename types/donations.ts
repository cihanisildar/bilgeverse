import { Decimal } from "@prisma/client/runtime/library";

export interface Donation {
    id: string;
    amount: number;
    currency: string;
    donationDate: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    donorId: string;
}

export interface Donor {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    donations?: Donation[];
    // Extended fields from server actions
    totalDonated: number;
    lastDonationDate: Date | null;
    isInactive: boolean;
}

export interface DonorDetails extends Donor {
    donations: Donation[];
    user?: {
        id: string;
        username: string;
        role: string;
    } | null;
}

export interface DonorActionResponse<T> {
    error: string | null;
    data: T | null;
}

export interface CreateDonorData {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}

export interface UpdateDonorData {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}

export interface AddDonationData {
    donorId: string;
    amount: number;
    donationDate: Date;
    notes?: string;
}
