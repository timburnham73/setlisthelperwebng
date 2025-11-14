import { Timestamp } from "firebase-admin/firestore";

export interface Base {
    id?: string,
    documentPath?: string;
    name: string;
    nameLowered: string;
    createdByUser?: any;
    dateCreated?: Timestamp;
    lastEdit?: Timestamp;
    lastUpdatedByUser?: any;
}