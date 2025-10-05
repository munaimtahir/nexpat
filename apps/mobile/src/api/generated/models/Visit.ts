/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Visit = {
    readonly id?: number;
    readonly token_number?: number;
    readonly visit_date?: string;
    readonly status?: Visit.status;
    readonly created_at?: string;
    readonly updated_at?: string;
    patient: string;
    queue: number;
    readonly patient_registration_number?: string;
    readonly patient_full_name?: string;
    readonly queue_name?: string;
};
export namespace Visit {
    export enum status {
        WAITING = 'WAITING',
        START = 'START',
        IN_ROOM = 'IN_ROOM',
        DONE = 'DONE',
    }
}

