import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';
import {RawDataView, TrackFeature} from './types';
import MapControls from './components/MapControls';
import LoadingOverlay from './components/LoadingOverlay';
import TrackOverlay from './components/TrackOverlay';
import MapWrapper from './map';

const App = () => {
    const [mapWrapper] = React.useState(new MapWrapper());
    const [loading, setLoading] = React.useState(true /* avoid flickering */);
    const [error, setError] = React.useState<string>(null);
    const [year, setYear] = React.useState<number>(null);
    const [sampling, setSampling] = React.useState<number>(8);
    const [rawDataView, setRawDataView] = React.useState<RawDataView>('Tracks');
    const [selectedFeatures, setSelectedFeatures] = React.useState<TrackFeature[]>([]);
    const [activeFeature, setActiveFeature] = React.useState<TrackFeature | null>(null);
    const [replayStatus, setReplayStatus] = React.useState<'stopped' | 'playing' | 'paused'>('stopped');
    const [replayPosition, setReplayPosition] = React.useState<number | null>(null);

    function stopReplay() {
        // TODO : we should only call exitReplay() if the replay was really playing
        //        but we can't check replayStatus because the initial value is captured by useEffect
        // if (replayStatus != 'stopped') {
        mapWrapper.exitReplay();
        setReplayStatus('stopped');
        setReplayPosition(null);
        // }
    }

    // TODO : move that down to a Component wrapping the map?
    React.useEffect(() => {
        mapWrapper.onLoadFilesStart = () => setLoading(true);
        mapWrapper.onLoadFilesFinish = (e?: Error) => {
            if (e) {
                setError(e.toString());
            } else {
                setLoading(false);
            }
        };
        mapWrapper.onSelection = (features) => {
            mapWrapper.setHighlightedFeatures(features);
            setSelectedFeatures(features);
            if (features.length === 1) {
                setActiveFeature(features[0]);
            } else {
                setActiveFeature(null);
            }
            stopReplay();
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
        stopReplay();
    }, [mapWrapper, selectedFeatures, setReplayStatus, setReplayPosition]);

    const onReplayFeature = React.useCallback(() => {
        if (activeFeature) {
            if (replayStatus === 'stopped') {
                mapWrapper.enterReplay(activeFeature);
                setReplayStatus('playing');
                setReplayPosition(0);
            } else if (replayStatus === 'paused') {
                setReplayStatus('playing');
            }
        }
    }, [mapWrapper, activeFeature, replayStatus, setReplayStatus, setReplayPosition]);

    React.useEffect(() => {
        let timer: any = null;
        if (activeFeature && replayStatus === 'playing') {
            // TODO : start and finish slowly and accelerate in the middle
            if (replayPosition < activeFeature.geometry.coordinates.length) {
                mapWrapper.setReplayPosition(activeFeature, replayPosition);
                timer = setTimeout(() => {
                    setReplayPosition(replayPosition + 1);
                }, 10);
            } else {
                setReplayStatus('paused');
            }
        }
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }, [mapWrapper, activeFeature, replayStatus, replayPosition]);

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
                replayPosition={replayPosition}
                onActiveFeature={onActivateOrDeactivateFeature}
                onReplayFeature={onReplayFeature}
            />}
        </>
    );
}

const appElement = document.getElementById('app');
ReactDOM.render(<App/>, appElement);
