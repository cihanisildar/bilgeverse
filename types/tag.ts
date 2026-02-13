export interface TagTemplate {
    id: string;
    name: string;
    color: string;
    description?: string;
    icon?: string;
}

export interface StudentTag {
    id: string;
    template: TagTemplate;
    createdAt: string;
}
