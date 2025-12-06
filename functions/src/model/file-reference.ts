export type FileType = "DOCUMENT" | "AUDIO";

export interface FileReference {
    loweredFileName: string;
    songId: string;
    lyricId: string;
    dbxFileVersion: string;
    type: FileType;
}
