import React from "react";
import {_FileSystemEntry, fsEntryToFile, readFsDirectory} from "../../utils/fileUtils";

interface Props {
    onDrop: (files: File[]) => void;
}

const DropZone: React.FC<Props> = (props) => {
    const [canDrop, setCanDrop] = React.useState(false);

    const onDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (hasFiles(e)) {
            setCanDrop(true);
        }
    }, [setCanDrop]);

    const onDragLeave = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setCanDrop(false);
    }, [setCanDrop]);

    const onDrop = React.useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const files = await readDataTransferItems(e.dataTransfer.items);
        props.onDrop(files);

        // TODO : we should wait to prevent concurrent imports
        setCanDrop(false);
    }, [props.onDrop, setCanDrop]);

    const classes = ['dropZone'];
    if (canDrop) {
        classes.push('dropZone_active');
    }

    return (
        <div className={classes.join(' ')} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            Drop GPX here
        </div>
    );
};

function hasFiles(e: React.DragEvent<HTMLDivElement>) {
    const dataTransferTypes = e.dataTransfer.types;
    if (dataTransferTypes) {
        for (let i = 0; i < dataTransferTypes.length; i++) {
            if (dataTransferTypes[i] === "Files") {
                return true;
            }
        }
    }
    return false;
}

// HACK : This is an experimental / deprecated API that supports folders
async function readDataTransferItems(dataTransferItems: DataTransferItemList): Promise<File[]> {
    const entries: _FileSystemEntry[] = [];
    for (let i = 0; i < dataTransferItems.length; i++) {
        const entry: _FileSystemEntry = dataTransferItems[i].webkitGetAsEntry();
        if (entry.isDirectory) {
            entries.push(...(await readFsDirectory(entry)));
        } else if (entry.isFile) {
            entries.push(entry);
        }
    }

    return Promise.all(entries.map((e) => fsEntryToFile(e)));
}

export default DropZone;
