import React from 'react';
import {RawDataView, TrackFeature, TYPE_RUN} from '../../types';
import LoadingOverlay from '../LoadingOverlay';
import MapControls from '../MapControls';
import TrackOverlay from '../TrackOverlay';
import Map from '../Map';
import {useTicker} from '../../hooks/useTicker';
import {readFromDB, saveToDB} from '../../utils/dbHelper';
import {formatDuration} from '../../utils/formatTime';
import {loadFromGpxData} from '../../utils/gpxConverter';
import {fsEntryToFile, readFsDirectory} from '../../utils/fileUtils';

const App = () => {
    const [allData, setAllData] = React.useState<TrackFeature[]>([]);
    const [visibleData, setVisibleData] = React.useState<TrackFeature[]>([]);
    const [loading, setLoading] = React.useState(true /* avoid flickering */);
    const [error, setError] = React.useState<string>(null);
    const [year, setYear] = React.useState<number>(null);
    const [sampling, setSampling] = React.useState<number>(8);
    const [rawDataView, setRawDataView] = React.useState<RawDataView>('Tracks');
    const [selectedFeatures, setSelectedFeatures] = React.useState<TrackFeature[]>([]);
    const [activeFeature, setActiveFeature] = React.useState<TrackFeature | null>(null);
    const [highlightedFeatures, setHighlightedFeatures] = React.useState<TrackFeature[]>([]);
    const [replayedFeature, setReplayedFeature] = React.useState<TrackFeature | null>(null);

    React.useEffect(() => {
        setLoading(true);
        loadFromDB()
            .then((features) => {
                setAllData(features)
                setLoading(false);
            })
            .catch((e) => {
                console.error('Loading failed', e);
                setError(e.toString());
            });
    }, [setLoading, setAllData, setError]);

    React.useEffect(() => {
        let newVisibleData = allData.filter((f) => f.properties.type === TYPE_RUN);
        if (year !== null) {
            const startOfYear = new Date(`${year}-01-01`).getTime();
            const startOfNextYear = new Date(`${year + 1}-01-01`).getTime();
            newVisibleData = allData.filter((f) => {
                const timestamp = f.properties.timestamps[0];
                return timestamp >= startOfYear && timestamp < startOfNextYear;
            });
        }
        setVisibleData(newVisibleData);
    }, [allData, year, setVisibleData]);

    const ticker = useTicker(
        activeFeature ? activeFeature.geometry.coordinates.length : null,
        React.useCallback(() => {
            setReplayedFeature({
                ...activeFeature,
                geometry: {
                    ...activeFeature.geometry,
                    coordinates: [activeFeature.geometry.coordinates[0]]
                }
            });
        }, [activeFeature, setReplayedFeature]),
        React.useCallback((i: number) => {
            setReplayedFeature({
                ...activeFeature,
                geometry: {
                    ...activeFeature.geometry,
                    coordinates: activeFeature.geometry.coordinates.slice(0, i)
                }
            });
        }, [activeFeature, setReplayedFeature]),
        React.useCallback(() => {
            setReplayedFeature(null);
        }, [setReplayedFeature])
    );

    const onSelectFeatures = React.useCallback((ids: number[]) => {
        const features = allData.filter((f) => ids.includes(f.id));
        setSelectedFeatures(features);
        setHighlightedFeatures(features)
        if (features.length === 1) {
            setActiveFeature(features[0]);
        } else {
            setActiveFeature(null);
        }
    }, [allData, setSelectedFeatures]);

    const onActivateOrDeactivateFeature = React.useCallback((feature: TrackFeature | null) => {
        setActiveFeature(feature);
        if (feature) {
            setHighlightedFeatures([feature]);
        } else {
            setHighlightedFeatures(selectedFeatures);
        }
    }, [selectedFeatures, setActiveFeature, setHighlightedFeatures]);

    const [dropOver, setDropOver] = React.useState(false);

    // TODO : prevent concurrent imports
    const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const startTime = new Date().getTime();
        const importedFeatures = await readDataTransferItems(e.dataTransfer.items);
        const newFeatures = importedFeatures.filter((f) => !allData.find((x) => x.id === f.id));
        if (newFeatures.length > 0) {
            const endTime = new Date().getTime();
            console.log(`Imported ${newFeatures.length} features in ${formatDuration(endTime - startTime, true)}`);
            setAllData(allData.concat(newFeatures));

            // We don't care if this succeeds or fails
            saveToDB(newFeatures)
                .then(() => {
                    console.info(`Saved ${newFeatures.length} features to DB`);
                })
                .catch((e) => {
                    console.error('Failed to save features to DB', e);
                });
        } else {
            console.info(`No new features in import`);
        }

        setDropOver(false);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        // TODO : verify if the file is a gpx (or geojson)
        e.preventDefault();
        setDropOver(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDropOver(false);
    };

    return (
        <>
            <Map
                features={visibleData}
                highlightedFeatures={highlightedFeatures}
                replayedFeature={replayedFeature}
                sampling={sampling}
                rawDataView={rawDataView}
                onSelectFeatures={onSelectFeatures}
            />
            <div className={'dropZone' + (dropOver ? ' dropZone_over' : '')}
                 onDragOver={onDragOver}
                 onDragLeave={onDragLeave}
                 onDrop={onDrop}
            >
                Drop files here
            </div>
            {loading && <LoadingOverlay error={error}/>}
            {!loading && <MapControls
                year={year}
                onSelectYear={setYear}
                sampling={sampling}
                onSelectSampling={setSampling}
                rawDataView={rawDataView}
                onSelectRawDataView={setRawDataView}
            />}
            {!loading && <TrackOverlay
                selectedFeatures={selectedFeatures}
                activeFeature={activeFeature}
                ticker={ticker}
                onActiveFeature={onActivateOrDeactivateFeature}
            />}
        </>
    );
}

function loadFromDB(): Promise<TrackFeature[]> {
    const startTime = new Date().getTime();
    return readFromDB()
        .then((features) => {
            const dbTime = new Date().getTime();
            console.log(`Loaded ${features.length} from DB in ${formatDuration(dbTime - startTime, true)}`);
            return features;
        });
}

// HACK : This is an experimental / deprecated API that supports folders
async function readDataTransferItems(dataTransferItems: DataTransferItemList): Promise<TrackFeature[]> {
    const entries = [];
    for (let i = 0; i < dataTransferItems.length; i++) {
        const entry = dataTransferItems[i].webkitGetAsEntry();
        if (entry.isDirectory) {
            entries.push(...(await readFsDirectory(entry)));
        } else if (entry.isFile) {
            entries.push(entry);
        }
    }

    const results = await Promise.all(entries.map(async (e) => {
        const file = await fsEntryToFile(e);
        return loadFromLocalFile(file);
    }));

    return results.reduce((a, b) => a.concat(b), [] as TrackFeature[]);
}

function loadFromLocalFile(file: File): Promise<TrackFeature[]> {
    if (file.name.endsWith('.gpx')) {
        return file.text().then((txt) => {
            return loadFromGpxData(file.name, txt).then((fc) => {
                return [fc.features[0]];
            });
        });
    } else {
        return Promise.resolve([]);
    }
}

export default App;
