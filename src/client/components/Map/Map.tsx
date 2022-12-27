import MapWrapper from '@src/client/map';
import { convertTrackToFeature } from '@src/shared/convert';
import { RawDataView, Track, TrackFeature } from '@src/shared/types';
import React from 'react';

interface Props {
    tracks: Track[];
    highlightedTracks: Track[];
    replayedTrack: Track | null;
    sampling: number;
    rawDataView: RawDataView;
    onSelectTracks: (ids: number[]) => void;
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
            mapWrapper.onSelection = (ids) => {
                props.onSelectTracks(ids);
            };
        }
    }, [mapWrapper, props.onSelectTracks]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setData(convertTracks(props.tracks));
        }
    }, [mapWrapper, props.tracks]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setDataSampling(props.sampling);
            // TODO : this causes setData to be called twice on the first render
            mapWrapper.setData(convertTracks(props.tracks));
        }
    }, [mapWrapper, props.sampling /*, props.runs TODO : Do I need props.runs? */]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setRawDataRender(props.rawDataView);
        }
    }, [mapWrapper, props.rawDataView]);

    React.useEffect(() => {
        if (mapWrapper) {
            mapWrapper.setHighlightedFeatures(convertTracks(props.highlightedTracks));
        }
    }, [mapWrapper, props.highlightedTracks]);

    React.useEffect(() => {
        if (mapWrapper) {
            if (props.replayedTrack) {
                mapWrapper.setReplayedFeature(convertTrackToFeature(props.replayedTrack));
            } else {
                mapWrapper.setReplayedFeature(null);
            }
        }
    }, [mapWrapper, props.replayedTrack]);

    return (
        <div id="map"/>
    );
}

function convertTracks(tracks: Track[]): TrackFeature[] {
    return tracks.map((t) => convertTrackToFeature(t));
}

export default Map;
