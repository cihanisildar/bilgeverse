export interface StudentNote {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    tutor: {
        id: string;
        username: string;
        firstName?: string;
        lastName?: string;
    };
}

export interface StudentReport {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    tutor: {
        id: string;
        username: string;
        firstName?: string;
        lastName?: string;
    };
}
