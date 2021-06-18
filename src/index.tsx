import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';
import {RawDataView, TrackFeature, TrackFeatureCollection} from './types';
import MapControls from './components/MapControls';
import LoadingOverlay from './components/LoadingOverlay';
import TrackOverlay from './components/TrackOverlay';
import MapWrapper from './map';
import {traceUrls} from "./dataLoader";
import {loadFromGpx} from './utils/gpxConverter';
import {readFromDB, saveToDB} from "./utils/dbHelper";
import {formatDuration} from "./utils/formatTime";
import {useTicker} from "./hooks/useTicker";

const App = () => {
    const [mapWrapper] = React.useState(new MapWrapper());
    const [loading, setLoading] = React.useState(true /* avoid flickering */);
    const [error, setError] = React.useState<string>(null);
    const [year, setYear] = React.useState<number>(null);
    const [sampling, setSampling] = React.useState<number>(8);
    const [rawDataView, setRawDataView] = React.useState<RawDataView>('Tracks');
    const [selectedFeatures, setSelectedFeatures] = React.useState<TrackFeature[]>([]);
    const [activeFeature, setActiveFeature] = React.useState<TrackFeature | null>(null);

    React.useEffect(() => {
        mapWrapper.onSelection = (features) => {
            mapWrapper.setHighlightedFeatures(features);
            setSelectedFeatures(features);
            if (features.length === 1) {
                setActiveFeature(features[0]);
            } else {
                setActiveFeature(null);
            }
        };
        mapWrapper.init('map');
    }, []);

    React.useEffect(() => mapWrapper.setYearFilter(year), [year]);
    React.useEffect(() => mapWrapper.setDataSampling(sampling), [sampling]);
    React.useEffect(() => mapWrapper.setRawDataRender(rawDataView), [rawDataView]);

    const onActivateOrDeactivateFeature = React.useCallback((feature: TrackFeature | null) => {
        setActiveFeature(feature);
        if (feature) {
            mapWrapper.setHighlightedFeatures([feature]);
        } else {
            mapWrapper.setHighlightedFeatures(selectedFeatures);
        }
    }, [mapWrapper, selectedFeatures, setActiveFeature]);

    React.useEffect(() => {
        setLoading(true);
        loadFeatureCollections()
            .then((dbCollections) => {
                mapWrapper.setData(dbCollections);
                setLoading(false);
            })
            .catch((e) => {
                console.error('Loading failed', e);
                setError(e.toString());
            });
    }, []);

    const ticker = useTicker(
        activeFeature ? activeFeature.geometry.coordinates.length : null,
        React.useCallback(() => {
            mapWrapper.enterReplay(activeFeature);
        }, [mapWrapper, activeFeature]),
        React.useCallback((i: number) => {
            mapWrapper.setReplayPosition(activeFeature, i);
        }, [mapWrapper, activeFeature]),
        React.useCallback(() => {
            mapWrapper.exitReplay();
        }, [mapWrapper])
    );

    return (
        <>
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

// TODO : move all the data handling stuff elsewhere
function loadFeatureCollections(): Promise<TrackFeatureCollection[]> {
    return loadFromDB()
        .then((dbCollections) => {
            if (dbCollections.length > 0) {
                return dbCollections;
            } else {
                return loadFromFiles()
                    .then((fileCollections) => {
                        const features = fileCollections.map((fc) => fc.features[0]);
                        // We don't care if this succeeds or fails
                        saveToDB(features)
                            .then(() => {
                                console.info(`Saved ${features.length} features to DB`);
                            })
                            .catch((e) => {
                                console.error('Failed to save features to DB', e);
                            });
                        return fileCollections;
                    });
            }
        });
}

function loadFromDB(): Promise<TrackFeatureCollection[]> {
    const startTime = new Date().getTime();
    return readFromDB()
        .then((features) => {
            const dbTime = new Date().getTime();
            console.log(`Loaded ${features.length} from DB in ${formatDuration(dbTime - startTime, true)}`);
            return features.map((f) => ({
                type: 'FeatureCollection',
                features: [f]
            }));
        });
}

function loadFromFiles(): Promise<TrackFeatureCollection[]> {
    const startTime = new Date().getTime();
    const keys = Array.from(traceUrls.keys()); //.slice(0, 50);

    console.log(`Loading ${keys.length} files...`);
    const promises = keys.map((f) => loadFromGpx(f, traceUrls.get(f)));
    return Promise.all(promises)
        .then((data) => {
            const end = new Date().getTime();
            console.log(`Load complete in ${formatDuration(end - startTime, true)}`);
            return data;
        });
}

const appElement = document.getElementById('app');
ReactDOM.render(<App/>, appElement);
