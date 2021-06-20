export interface _FileSystemEntry {
    isFile: boolean;
    isDirectory: boolean;

    createReader(): _FileSystemDirectoryReader;

    file(resolve: (file: File) => void, reject: (reason?: any) => void): void;
}

export interface _FileSystemDirectoryReader {

    readEntries(resolve: (entries: _FileSystemEntry[]) => void, reject: (reason?: any) => void): void;
}

export async function readFsDirectory(entry: _FileSystemEntry): Promise<_FileSystemEntry[]> {
    const reader = entry.createReader();
    const entries = [];
    // readDirectoryEntries must be called multiple times
    let readEntries = await readDirectoryEntries(reader);
    while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await readDirectoryEntries(reader);
    }
    return entries;
}

// This only makes readEntries() work well with Promises
function readDirectoryEntries(directoryReader: _FileSystemDirectoryReader): Promise<_FileSystemEntry[]> {
    return new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
    });
}

// This only makes file() work well with Promises
export function fsEntryToFile(entry: _FileSystemEntry): Promise<File> {
    return new Promise((resolve, reject) => {
        entry.file(resolve, reject);
    });
}
