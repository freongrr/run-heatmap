export async function readFsDirectory(entry: any): Promise<any[]> {
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
function readDirectoryEntries(directoryReader: any): Promise<any> {
    return new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
    });
}

// This only makes file() work well with Promises
export function fsEntryToFile(entry: any): Promise<File> {
    return new Promise((resolve, reject) => {
        entry.file(resolve, reject);
    });
}
