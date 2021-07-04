import React from 'react';
import MapWrapper from '@src/map';
import {RawDataView, TrackFeature} from '@src/types';

interface Props {
    features: TrackFeature[];
    highlightedFeatures: TrackFeature[];
    replayedFeature: TrackFeature | null;
    sampling: number;
    rawDataView: RawDataView;
    onSelectFeatures: (ids: number[]) => void;
}

const Map: React.FC<Props> = (props) => {
    const [mapWrapper, setMapWrapper] = React.useState<MapWrapper | null>(null);

    React.useEffect(() => {
        const wrapper = new MapWrapper();
        wrapper.init('map')
            .then(() => setMapWrapper(wrapper))
    }, []);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.onSelection = (featureIds) => {
                props.onSelectFeatures(featureIds);
            };
        }
    }, [mapWrapper, props.onSelectFeatures]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setData(props.features);
        }
    }, [mapWrapper, props.features]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setDataSampling(props.sampling);
            // TODO : this causes setData to be called twice on the first render
            mapWrapper.setData(props.features);
        }
    }, [mapWrapper, props.sampling /*, props.features TODO : Do I need props.features? */]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setRawDataRender(props.rawDataView);
        }
    }, [mapWrapper, props.rawDataView]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setHighlightedFeatures(props.highlightedFeatures);
        }
    }, [mapWrapper, props.highlightedFeatures]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setReplayedFeature(props.replayedFeature);
        }
    }, [mapWrapper, props.replayedFeature]);

    return (
        <div id="map"/>
    );
}

export default Map;
