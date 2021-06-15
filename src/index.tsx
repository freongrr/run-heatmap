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
    const [replayPosition, setReplayPosition] = React.useState<number | null>(null);

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

    const onReplayFeature = React.useCallback(() => {
        if (activeFeature) {
            //mapWrapper.replayTrack(activeFeature);

            // TODO : this is a huge hack
            mapWrapper.enterReplay(activeFeature);
            setReplayPosition(0);

            // TODO : start and finish slowly and accelerate in the middle?
            let i = 0;
            const timer = window.setInterval(() => {
                if (i < activeFeature.geometry.coordinates.length) {
                    mapWrapper.setReplayPosition(activeFeature, i);
                    setReplayPosition(i);
                    i++;
                } else {
                    // TODO : pause for a while
                    window.clearInterval(timer);
                    mapWrapper.exitReplay();
                    setReplayPosition(null);
                }
            }, 10);
        }
    }, [mapWrapper, activeFeature]);

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
                onActiveFeature={setActiveFeature}
                onReplayFeature={onReplayFeature}
            />}
        </>
    );
}

const appElement = document.getElementById('app');
ReactDOM.render(<App/>, appElement);
