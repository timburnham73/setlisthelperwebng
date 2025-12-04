import {Base} from "./base";

export interface Account extends Base {
    description?: string;
    users?: string[];
    ownerUser: any;
    importToken: string;
    countOfSetlists?: number;
    countOfSongs?: number;
    countOfTags?: number;
    formatSettings?: any;
}

