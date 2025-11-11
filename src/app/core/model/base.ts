import { Timestamp } from "@angular/fire/firestore";

export interface Base {
    id?: string,
    name: string;
    nameLowered: string;
    documentPath?: string;
    createdByUser: any;
    dateCreated: Timestamp;
    lastEdit: Timestamp;
    lastUpdatedByUser: any;
}