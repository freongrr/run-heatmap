import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';
import {RawDataView, TrackFeature} from './types';
import MapControls from './components/MapControls';
import LoadingOverlay from './components/LoadingOverlay';
import TrackOverlay from './components/TrackOverlay';
import MapWrapper from './map';
import {useReplay} from './useReplay';

const App = () => {
    const [mapWrapper] = React.useState(new MapWrapper());
    const [loading, setLoading] = React.useState(true /* avoid flickering */);
    const [error, setError] = React.useState<string>(null);
    const [year, setYear] = React.useState<number>(null);
    const [sampling, setSampling] = React.useState<number>(8);
    const [rawDataView, setRawDataView] = React.useState<RawDataView>('Tracks');
    const [selectedFeatures, setSelectedFeatures] = React.useState<TrackFeature[]>([]);
    const [activeFeature, setActiveFeature] = React.useState<TrackFeature | null>(null);

    const replay = useReplay(mapWrapper, activeFeature);

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
                replay={replay}
                onActiveFeature={onActivateOrDeactivateFeature}
            />}
        </>
    );
}

const appElement = document.getElementById('app');
ReactDOM.render(<App/>, appElement);
