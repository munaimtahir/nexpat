/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthToken } from '../models/AuthToken';
import type { Patient } from '../models/Patient';
import type { PrescriptionImage } from '../models/PrescriptionImage';
import type { Queue } from '../models/Queue';
import type { Visit } from '../models/Visit';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApiService {
    /**
     * @param page A page number within the paginated result set.
     * @param pageSize Number of results to return per page.
     * @returns any
     * @throws ApiError
     */
    public static listVisits(
        page?: number,
        pageSize?: number,
    ): CancelablePromise<{
        count: number;
        next?: string | null;
        previous?: string | null;
        results: Array<Visit>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/visits/',
            query: {
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * @param requestBody
     * @returns Visit
     * @throws ApiError
     */
    public static createVisit(
        requestBody?: Visit,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/visits/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @returns Visit
     * @throws ApiError
     */
    public static retrieveVisit(
        id: string,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/visits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @param requestBody
     * @returns Visit
     * @throws ApiError
     */
    public static updateVisit(
        id: string,
        requestBody?: Visit,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/visits/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @param requestBody
     * @returns Visit
     * @throws ApiError
     */
    public static partialUpdateVisit(
        id: string,
        requestBody?: Visit,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/visits/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @returns void
     * @throws ApiError
     */
    public static destroyVisit(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/visits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * API endpoint that allows patients to be viewed or edited.
     * @param page A page number within the paginated result set.
     * @param pageSize Number of results to return per page.
     * @returns any
     * @throws ApiError
     */
    public static listPatients(
        page?: number,
        pageSize?: number,
    ): CancelablePromise<{
        count: number;
        next?: string | null;
        previous?: string | null;
        results: Array<Patient>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/patients/',
            query: {
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * API endpoint that allows patients to be viewed or edited.
     * @param requestBody
     * @returns Patient
     * @throws ApiError
     */
    public static createPatient(
        requestBody?: Patient,
    ): CancelablePromise<Patient> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/patients/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Search for patients by registration number,
     * name fragment, or phone fragment.
     * @returns Patient
     * @throws ApiError
     */
    public static searchPatient(): CancelablePromise<Patient> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/patients/search/',
        });
    }
    /**
     * API endpoint that allows patients to be viewed or edited.
     * @param registrationNumber A unique value identifying this patient.
     * @returns Patient
     * @throws ApiError
     */
    public static retrievePatient(
        registrationNumber: string,
    ): CancelablePromise<Patient> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/patients/{registration_number}/',
            path: {
                'registration_number': registrationNumber,
            },
        });
    }
    /**
     * API endpoint that allows patients to be viewed or edited.
     * @param registrationNumber A unique value identifying this patient.
     * @param requestBody
     * @returns Patient
     * @throws ApiError
     */
    public static updatePatient(
        registrationNumber: string,
        requestBody?: Patient,
    ): CancelablePromise<Patient> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/patients/{registration_number}/',
            path: {
                'registration_number': registrationNumber,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * API endpoint that allows patients to be viewed or edited.
     * @param registrationNumber A unique value identifying this patient.
     * @param requestBody
     * @returns Patient
     * @throws ApiError
     */
    public static partialUpdatePatient(
        registrationNumber: string,
        requestBody?: Patient,
    ): CancelablePromise<Patient> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/patients/{registration_number}/',
            path: {
                'registration_number': registrationNumber,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * API endpoint that allows patients to be viewed or edited.
     * @param registrationNumber A unique value identifying this patient.
     * @returns void
     * @throws ApiError
     */
    public static destroyPatient(
        registrationNumber: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/patients/{registration_number}/',
            path: {
                'registration_number': registrationNumber,
            },
        });
    }
    /**
     * API endpoint that allows queues to be viewed.
     * @returns Queue
     * @throws ApiError
     */
    public static listQueues(): CancelablePromise<Array<Queue>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/queues/',
        });
    }
    /**
     * API endpoint that allows queues to be viewed.
     * @param id A unique integer value identifying this queue.
     * @returns Queue
     * @throws ApiError
     */
    public static retrieveQueue(
        id: string,
    ): CancelablePromise<Queue> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/queues/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PrescriptionImage
     * @throws ApiError
     */
    public static listPrescriptionImages(): CancelablePromise<Array<PrescriptionImage>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prescriptions/',
        });
    }
    /**
     * @param formData
     * @returns PrescriptionImage
     * @throws ApiError
     */
    public static createPrescriptionImage(
        formData?: PrescriptionImage,
    ): CancelablePromise<PrescriptionImage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prescriptions/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param id A unique integer value identifying this prescription image.
     * @returns PrescriptionImage
     * @throws ApiError
     */
    public static retrievePrescriptionImage(
        id: string,
    ): CancelablePromise<PrescriptionImage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prescriptions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this prescription image.
     * @param formData
     * @returns PrescriptionImage
     * @throws ApiError
     */
    public static updatePrescriptionImage(
        id: string,
        formData?: PrescriptionImage,
    ): CancelablePromise<PrescriptionImage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/prescriptions/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param id A unique integer value identifying this prescription image.
     * @param formData
     * @returns PrescriptionImage
     * @throws ApiError
     */
    public static partialUpdatePrescriptionImage(
        id: string,
        formData?: PrescriptionImage,
    ): CancelablePromise<PrescriptionImage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/prescriptions/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param id A unique integer value identifying this prescription image.
     * @returns void
     * @throws ApiError
     */
    public static destroyPrescriptionImage(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/prescriptions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Return the current user's username and role memberships.
     * @returns any
     * @throws ApiError
     */
    public static listmes(): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/me/',
        });
    }
    /**
     * Health check endpoint for monitoring and connectivity testing.
     * @returns any
     * @throws ApiError
     */
    public static listhealths(): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health/',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static listRegistrationNumberFormats(): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/registration-format/',
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static updateRegistrationNumberFormat(
        requestBody?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/registration-format/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static partialUpdateRegistrationNumberFormat(
        requestBody?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/registration-format/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param formData
     * @returns AuthToken
     * @throws ApiError
     */
    public static createAuthToken(
        formData?: AuthToken,
    ): CancelablePromise<AuthToken> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login/',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @param requestBody
     * @returns Visit
     * @throws ApiError
     */
    public static doneVisit(
        id: string,
        requestBody?: Visit,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/visits/{id}/done/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @param requestBody
     * @returns Visit
     * @throws ApiError
     */
    public static inRoomVisit(
        id: string,
        requestBody?: Visit,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/visits/{id}/in_room/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @param requestBody
     * @returns Visit
     * @throws ApiError
     */
    public static sendBackToWaitingVisit(
        id: string,
        requestBody?: Visit,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/visits/{id}/send_back_to_waiting/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this visit.
     * @param requestBody
     * @returns Visit
     * @throws ApiError
     */
    public static startVisit(
        id: string,
        requestBody?: Visit,
    ): CancelablePromise<Visit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/visits/{id}/start/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
