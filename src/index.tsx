import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';
import MapControls from './components/MapControls';
import LoadingOverlay from './components/LoadingOverlay';
import TrackOverlay from './components/TrackOverlay';
import MapWrapper from './map';
import {RawDataView, TrackFeature, TrackFeatureLike} from './types';

const App = () => {
    const [mapWrapper] = React.useState(new MapWrapper());
    const [loading, setLoading] = React.useState(true /* avoid flickering */);
    const [error, setError] = React.useState<string>(null);
    const [year, setYear] = React.useState<number>(null);
    const [sampling, setSampling] = React.useState<number>(8);
    const [rawDataView, setRawDataView] = React.useState<RawDataView>('Tracks');
    const [selectedFeatures, setSelectedFeatures] = React.useState<TrackFeatureLike[]>([]);

    setTimeout(() => {
        setLoading(false);
    }, 5000);

    // TODO : move that down to a Component wrapping the map?
    React.useEffect(() => {
        mapWrapper.onLoadFilesStart = () => setLoading(true);
        mapWrapper.onLoadFilesFinish = (e?: Error) => {
            if (e) {
                setError(e.toString());
            } else {
                setLoading(true);
            }
        };
        mapWrapper.onSelection = (features) => {
            setSelectedFeatures(features);
        };
        mapWrapper.init('map');
    }, []);
    React.useEffect(() => mapWrapper.setYearFilter(year), [year]);
    React.useEffect(() => mapWrapper.setDataSampling(sampling), [sampling]);
    React.useEffect(() => mapWrapper.setRawDataRender(rawDataView), [rawDataView]);

    return (
        <>
            {loading && <LoadingOverlay error={error}/>}
            {!loading && <MapControls
                year={year}
                onSelectYear={(v) => setYear(v)}
                sampling={sampling}
                onSelectSampling={setSampling}
                rawDataView={rawDataView}
                onSelectRawDataView={setRawDataView}
            />}
            {!loading && <TrackOverlay selectedFeatures={selectedFeatures}/>}
        </>
    );
};

const appElement = document.getElementById('app');
ReactDOM.render(<App/>, appElement);
