import { PrintColumns } from "../services/setlist.service";


export const FONT_OPTIONS = [
    'Arial',
    'Times New Roman',
    'Verdana',
    'Georgia',
    'Courier New',
];

export const FONT_SIZE_OPTIONS = [
    { label: '8', value: '8pt' },
    { label: '9', value: '9pt' },
    { label: '10', value: '10pt' },
    { label: '11', value: '11pt' },
    { label: '12', value: '12pt' },
    { label: '14', value: '14pt' },
    { label: '16', value: '16pt' },
    { label: '18', value: '18pt' },
    { label: '20', value: '20pt' },
    { label: '22', value: '22pt' },
    { label: '24', value: '24pt' },
    { label: '26', value: '26pt' },
    { label: '28', value: '28pt' },
    { label: '36', value: '36pt' },
    { label: '48', value: '48pt' },
    { label: '72', value: '72pt' },
];

export const defaultPrintSettings: SetlistPrintSettings = {
    id: '',
    columns: PrintColumns.one,
    fontFamily: 'Arial',
    fontSize: '14pt',
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