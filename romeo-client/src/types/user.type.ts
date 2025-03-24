export interface User {
    id: string;
    email: string;
    name?: string;
    status: 'pending' | 'approved';
}