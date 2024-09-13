import { PrintColumns } from "../services/setlist.service";


export const defaultPrintSettings: SetlistPrintSettings = {
    id: '',
    columns: PrintColumns.one,
    setlistName: {show: true},
    gigDateTime: {show: true},
    gigLocation: {show: true},
    artist: {show: true},
    genre: {show: false},
    songLength: {show: false},
    songKey: {show: true},
    tempo: {show: false},
    timeSignature: {show: false},
        
} 

export interface SetlistPrintSetting {
    show: boolean;
}

export interface SetlistPrintSettings {
    id: string;
    columns: number;
    setlistName: SetlistPrintSetting;
    gigDateTime: SetlistPrintSetting;
    gigLocation: SetlistPrintSetting;
    artist: SetlistPrintSetting;
    genre: SetlistPrintSetting;
    songLength: SetlistPrintSetting;
    songKey: SetlistPrintSetting;
    tempo: SetlistPrintSetting;
    timeSignature: SetlistPrintSetting;
}