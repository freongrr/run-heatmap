import * as config from '@src/client/config'
import { formatDuration } from '@src/client/utils/formatTime';
import { RawDataView, TrackFeature } from '@src/shared/types';
import * as GeoJSON from 'geojson';
import mapboxgl, { GeoJSONSource, LngLatLike } from 'mapbox-gl';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

// A lot of the code is taken from:
// https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/

const CENTER = config.MAP_CENTER;

const SOURCE_TRACK_POINTS = 'track-points';
const SOURCE_TRACK_LINES = 'track-lines';
const SOURCE_SINGLE_TRACK = 'single-track';
const SOURCE_DISTANCE_CIRCLES = 'distance-circles';
const LAYER_HEATMAP = 'heatmap';
const LAYER_TRACK_POINTS = 'tracks-points';
const LAYER_TRACK_LINES = 'tracks-lines';
const LAYER_TRACK_LINES_HIGHLIGHTED = 'tracks-lines-highlighted';
const LAYER_CIRCLES = 'distance-circles';
const LAYER_SINGLE_TRACK = 'single-track';

const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: []
};

const NO_OP = () => {
    // no-op
};

class MapWrapper {
    private map: mapboxgl.Map;
    private skipCount = 8;
    private rawDataMode: RawDataView = 'Tracks';
    private isReplaying: boolean;

    public onSelection: (featureIds: number[]) => void = NO_OP;

    constructor() {
        // Nothing (for now?)
    }

    public init(containerId: string): Promise<void> {
        this.map = new mapboxgl.Map({
            container: containerId,
            // TODO : drop down to change style
            style: 'mapbox://styles/mapbox/dark-v10',
            // style: 'mapbox://styles/mapbox/satellite-v9',
            center: CENTER,
            zoom: 12
        });

        return new Promise((resolve, reject) => {
            this.map.on('load', () => {
                try {
                    this.finishInitialization();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    private finishInitialization() {
        // Sources
        this.map.addSource(SOURCE_TRACK_POINTS, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        this.map.addSource(SOURCE_TRACK_LINES, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        this.map.addSource(SOURCE_SINGLE_TRACK, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        this.map.addSource(SOURCE_DISTANCE_CIRCLES, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    //circle(CENTER, 1, {steps: 36, units: 'kilometers'}),
                    //circle(CENTER, 5, {steps: 36, units: 'kilometers'}),
                    //circle(CENTER, 10, {steps: 36, units: 'kilometers'}),
                ]
            }
        });

        // Layer 1: heatmap
        this.map.addLayer(
            {
                id: LAYER_HEATMAP,
                type: 'heatmap',
                source: SOURCE_TRACK_POINTS,
                paint: {
                    // This is based on how many points we skip when parsing the GPX files
                    'heatmap-weight': getHeatmapWeight(this.skipCount),
                    'heatmap-intensity': [
                        'interpolate', ['exponential', 2], ['zoom'], 0, 0.6, 15, 4, 20, 5, 23, 10
                    ]
                }
            }
        );

        // Layer 2: tracks as points
        this.map.addLayer(
            {
                id: LAYER_TRACK_POINTS,
                type: 'circle',
                source: SOURCE_TRACK_POINTS,
                minzoom: 10,
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'], 10, 0, 18, 5, 23, 10
                    ],
                    'circle-color': 'rgba(255,255,255,1)',
                    'circle-stroke-color': 'rgba(0,0,0,0)',
                    'circle-stroke-width': 1,
                    'circle-opacity': [
                        'interpolate', ['linear'], ['zoom'], 10, 0, 18, 0.2, 23, 1
                    ]
                }
            }
        );

        // Layer 3: Tracks as lines
        this.map.addLayer(
            {
                id: LAYER_TRACK_LINES,
                type: 'line',
                source: SOURCE_TRACK_LINES,
                minzoom: 10,
                paint: {
                    'line-color': '#FFF',
                    'line-opacity': [
                        'interpolate', ['linear'], ['zoom'], 10, 0, 18, 0.3, 23, 1
                    ],
                    'line-width': [
                        'interpolate', ['linear'], ['zoom'], 15, 1, 23, 10
                    ]
                }
            }
        );

        // Layer 4: selected/highlighted tracks
        this.map.addLayer(
            {
                id: LAYER_TRACK_LINES_HIGHLIGHTED,
                type: 'line',
                source: SOURCE_TRACK_LINES,
                minzoom: 10,
                paint: {
                    'line-color': '#FFF',
                    'line-opacity': 1,
                    'line-width': 5
                }
            }
        );

        this.map.on('click', LAYER_TRACK_LINES, (e) => {
            const featureIds = e.features.map((f) => +f.id);
            if (featureIds.length > 0) {
                e.preventDefault();
                this.onSelection(featureIds);
            }
        });

        this.map.on('click', (e) => {
            // HACK : _defaultPrevented is not in the public API
            if (!e._defaultPrevented) {
                this.onSelection([]);
            }
        });

        // Change the cursor when moving over a track
        this.map.on('mousemove', LAYER_TRACK_LINES, () => this.map.getCanvas().style.cursor = 'pointer');
        this.map.on('mouseleave', LAYER_TRACK_LINES, () => this.map.getCanvas().style.cursor = '');

        // Empty filter initially
        this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['boolean', false]);

        // Show/hide layers (we have to do that because the setter can be called before we get here)
        this.map.setLayoutProperty(LAYER_TRACK_LINES, 'visibility', this.rawDataMode === 'Tracks' ? 'visible' : 'none');
        this.map.setLayoutProperty(LAYER_TRACK_POINTS, 'visibility', this.rawDataMode === 'Points' ? 'visible' : 'none');

        // Layer 5: Circles for distances
        this.map.addLayer({
            id: LAYER_CIRCLES,
            type: 'line',
            source: SOURCE_DISTANCE_CIRCLES,
            paint: {
                'line-color': '#AAA',
                'line-opacity': 1,
                'line-width': 2
            },
        });

        // Layer 6: Trace
        this.map.addLayer({
            id: LAYER_SINGLE_TRACK,
            type: 'line',
            source: SOURCE_SINGLE_TRACK,
            paint: {
                'line-color': 'yellow',
                'line-opacity': 0.75,
                'line-width': 5
            }
        });
    }

    public setDataSampling(value: number): void {
        this.skipCount = value;
        this.map.setPaintProperty(LAYER_HEATMAP, 'heatmap-weight', getHeatmapWeight(value));
    }

    public setRawDataRender(value: RawDataView): void {
        this.rawDataMode = value;

        this.map.setLayoutProperty(
            LAYER_TRACK_LINES,
            'visibility',
            value === 'Tracks' ? 'visible' : 'none'
        );

        this.map.setLayoutProperty(
            LAYER_TRACK_POINTS,
            'visibility',
            value === 'Points' ? 'visible' : 'none'
        );
    }

    public setData(features: TrackFeature[]): void {
        const start = new Date().getTime();
        const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
        const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];

        features.forEach((f) => {
            lineFeatures.push(f);

            f.geometry.coordinates
                .forEach((c) => {
                    const [lon, lat] = c;
                    pointFeatures.push({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat, 0.0]
                        }
                    });
                });

        });

        (this.map.getSource(SOURCE_TRACK_POINTS) as GeoJSONSource)
            .setData({ type: 'FeatureCollection', features: pointFeatures });
        (this.map.getSource(SOURCE_TRACK_LINES) as GeoJSONSource)
            .setData({ type: 'FeatureCollection', features: lineFeatures });

        const end = new Date().getTime();
        console.log(`Refreshed ${pointFeatures.length} points and ${lineFeatures.length} lines in ${formatDuration(end - start, true)}`);
    }

    public setHighlightedFeatures(features: TrackFeature[]): void {
        const featureIds = features.map((f) => f.id);
        if (features.length > 0) {
            this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['match', ['id'], featureIds, true, false]);
        } else {
            this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['boolean', false]);
        }
    }

    public setReplayedFeature(feature: TrackFeature | null): void {
        if (feature === null) {
            this.exitReplay();
        } else if (!this.isReplaying) {
            this.enterReplay(feature);
        } else {
            this.updateReplay(feature);
        }
    }

    private enterReplay(feature: TrackFeature): void {
        this.map.setLayoutProperty(LAYER_HEATMAP, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_POINTS, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_LINES, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_LINES_HIGHLIGHTED, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_CIRCLES, 'visibility', 'none');

        (this.map.getSource(SOURCE_SINGLE_TRACK) as GeoJSONSource)
            .setData({ type: 'FeatureCollection', features: [feature] });

        const coordinates = feature.geometry.coordinates;
        const lastPoint = coordinates[coordinates.length - 1];
        this.map.jumpTo({
            center: lastPoint as LngLatLike,
            zoom: 14
        });

        this.isReplaying = true;
    }

    private updateReplay(feature: TrackFeature): void {
        (this.map.getSource(SOURCE_SINGLE_TRACK) as GeoJSONSource)
            .setData({ type: 'FeatureCollection', features: [feature] });

        const coordinates = feature.geometry.coordinates;
        const lastPoint = coordinates[coordinates.length - 1];
        // TODO : when manually setting the position of the playback we should use jumpTo
        this.map.panTo(lastPoint as LngLatLike);
    }

    private exitReplay(): void {
        (this.map.getSource(SOURCE_SINGLE_TRACK) as GeoJSONSource).setData(EMPTY_FEATURE_COLLECTION);

        this.map.setLayoutProperty(LAYER_HEATMAP, 'visibility', 'visible');
        this.map.setLayoutProperty(LAYER_TRACK_LINES_HIGHLIGHTED, 'visibility', 'visible');
        this.map.setLayoutProperty(LAYER_CIRCLES, 'visibility', 'visible');
        this.setRawDataRender(this.rawDataMode)

        this.isReplaying = false;
    }
}

function getHeatmapWeight(skipCount: number): number {
    if (skipCount === 2) {
        return 0.002;
    } else {
        return 2 * getHeatmapWeight(skipCount / 2) - 0.001;
    }
}

export default MapWrapper;
