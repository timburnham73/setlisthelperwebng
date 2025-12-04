export type FileType = "document" | "audio";

export interface FileReference {
    id: string;
    loweredFileName: string;
    songId: string;
    lyricId: string;
    dbxFileVersion: string;
    type: FileType;
}
