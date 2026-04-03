import { PrintColumns } from "../services/setlist.service";


export const FONT_OPTIONS = [
    'Arial',
    'Times New Roman',
    'Verdana',
    'Georgia',
    'Courier New',
];

export const FONT_SIZE_OPTIONS = [
    { label: 'Small', value: '14px' },
    { label: 'Medium', value: '17px' },
    { label: 'Large', value: '19px' },
    { label: 'X-Large', value: '22px' },
    { label: 'XX-Large', value: '26px' },
];

export const defaultPrintSettings: SetlistPrintSettings = {
    id: '',
    columns: PrintColumns.one,
    fontFamily: 'Arial',
    fontSize: '19px',
    setlistName: {show: true},
    gigDateTime: {show: true},
    gigLocation: {show: true},
    setlistDuration: {show: true},
    sequenceNumbers: {show: true},
    artist: {show: true},
    genre: {show: false},
    songLength: {show: false},
    songKey: {show: true},
    tempo: {show: false},
    timeSignature: {show: false},
    notes: {show: false},
    other: {show: false},
    showBreaks: {show: true},
    insertPageBreak: {show: false},
    pageBreakPosition: 'after',
}

export interface SetlistPrintSetting {
    show: boolean;
}

export interface SetlistPrintSettings {
    id: string;
    columns: number;
    fontFamily: string;
    fontSize: string;
    setlistName: SetlistPrintSetting;
    gigDateTime: SetlistPrintSetting;
    gigLocation: SetlistPrintSetting;
    setlistDuration: SetlistPrintSetting;
    sequenceNumbers: SetlistPrintSetting;
    artist: SetlistPrintSetting;
    genre: SetlistPrintSetting;
    songLength: SetlistPrintSetting;
    songKey: SetlistPrintSetting;
    tempo: SetlistPrintSetting;
    timeSignature: SetlistPrintSetting;
    notes: SetlistPrintSetting;
    other: SetlistPrintSetting;
    showBreaks: SetlistPrintSetting;
    insertPageBreak: SetlistPrintSetting;
    pageBreakPosition: 'after' | 'before';
}