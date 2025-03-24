export enum ConstraintType {
    DATE = 'date',
    TIME = 'time',
    INTEGER = 'integer',
    STRING = 'string',
    BOOLEAN = 'boolean',
    EMAIL = 'email',
    PHONE = 'phone'
}

export interface Constraint {
    id: string;
    reservable_id: string;
    name: string;
    type: ConstraintType;
    value: string;
    created_at: string;
    updated_at: string;
}