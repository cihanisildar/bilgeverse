export interface Note {
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
