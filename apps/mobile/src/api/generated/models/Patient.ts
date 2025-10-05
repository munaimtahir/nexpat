/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Patient = {
    readonly registration_number?: string;
    name: string;
    phone?: string | null;
    gender?: Patient.gender;
    readonly created_at?: string;
    readonly updated_at?: string;
    readonly last_5_visit_dates?: string;
};
export namespace Patient {
    export enum gender {
        MALE = 'MALE',
        FEMALE = 'FEMALE',
        OTHER = 'OTHER',
    }
}

