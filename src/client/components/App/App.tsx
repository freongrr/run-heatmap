import ControlOverlay from '@src/client/components/ControlOverlay';
import LoadingOverlay from '@src/client/components/LoadingOverlay';
import Map from '@src/client/components/Map';
import { useTicker } from '@src/client/hooks/useTicker';
import { formatDuration } from '@src/client/utils/formatTime';
import { loadFromGpxData } from '@src/client/utils/gpxConverter';
import { RawDataView, TrackFeature, TYPE_RUN } from '@src/shared/types';
import React from 'react';

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
        loadFromServer(sampling)
            .then((features) => {
                setAllData(features)
                setLoading(false);
            })
            .catch((e) => {
                console.error('Loading failed', e);
                setError(e.toString());
            });
    }, [setLoading, setAllData, setError, sampling]);

    React.useEffect(() => {
        let newVisibleData = allData.filter((f) => f.properties.type === TYPE_RUN);
        if (year !== null) {
            const startOfYear = new Date(`${year}-01-01`).getTime();
            const startOfNextYear = new Date(`${year + 1}-01-01`).getTime();
            newVisibleData = newVisibleData.filter((f) => {
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

    const onDeselectFeatures = React.useCallback(() => {
        setSelectedFeatures([]);
        setHighlightedFeatures([]);
    }, [setSelectedFeatures]);

    const onActivateOrDeactivateFeature = React.useCallback((feature: TrackFeature | null) => {
        setActiveFeature(feature);
        if (feature) {
            setHighlightedFeatures([feature]);
        } else {
            setHighlightedFeatures(selectedFeatures);
        }
    }, [selectedFeatures, setActiveFeature, setHighlightedFeatures]);

    const onDrop = React.useCallback(async (files: File[]) => {
        const startTime = new Date().getTime();
        let newFeatureCount = 0;
        setLoading(true);
        try {
            const newFeatures = (await Promise.all(files.map((f) => readGpxFile(f))))
                .reduce((a, b) => a.concat(b), [])
                .filter((f) => !allData.find((x) => x.id === f.id));
            newFeatureCount = newFeatures.length;

            const promises = newFeatures.map((f) => saveToServer(f));
            await Promise.all(promises);
            setAllData(allData.concat(newFeatures));
        } finally {
            const endTime = new Date().getTime();
            console.log(`Imported ${newFeatureCount} features in ${formatDuration(endTime - startTime, true)}`);
            setLoading(false);
        }
    }, [allData, setAllData]);

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
            {loading && <LoadingOverlay error={error}/>}
            <ControlOverlay
                disabled={loading}
                onDropFiles={onDrop}
                year={year}
                onSelectYear={setYear}
                sampling={sampling}
                onSelectSampling={setSampling}
                rawDataView={rawDataView}
                onSelectRawDataView={setRawDataView}
                selectedFeatures={selectedFeatures}
                onDeselectFeatures={onDeselectFeatures}
                activeFeature={activeFeature}
                onActiveFeature={onActivateOrDeactivateFeature}
                ticker={ticker}
            />
        </>
    );
}

async function loadFromServer(sampling: number): Promise<TrackFeature[]> {
    const startTime = new Date().getTime();
    const response = await fetch(`http://${location.hostname}:3000/features?sampling=${sampling}`);
    const features: TrackFeature[] = await response.json();
    const endTime = new Date().getTime();
    console.log(`Loaded ${features.length} from server in ${formatDuration(endTime - startTime, true)}`);
    return features;
}

async function saveToServer(feature: TrackFeature): Promise<void> {
    const response = await fetch(`http://${location.hostname}:3000/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feature)
    });
    if (response.status !== 200) {
        throw new Error('Failed');
    }
}

function readGpxFile(file: File): Promise<TrackFeature[]> {
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
