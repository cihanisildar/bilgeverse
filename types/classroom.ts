export interface Classroom {
    id: string;
    name: string;
    tutorName: string;
    studentCount?: number;
}

export interface ClassroomsResponse {
    classrooms: Classroom[];
}
