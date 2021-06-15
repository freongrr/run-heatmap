import * as turf from '@turf/turf';
import mapboxgl, {GeoJSONSource, LngLatLike} from 'mapbox-gl';
import {loadFromGpx} from '../utils/gpxConverter';
import {traceUrls} from '../dataLoader';
import {TOKEN} from './mapbox-token';
import * as GeoJSON from 'geojson';
import {RawDataView, TrackFeature, TrackFeatureCollection, TrackProperties} from '../types';

mapboxgl.accessToken = TOKEN;

// A lot of the code is taken from:
// https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/

const NO_OP = () => {
    // no-op
};

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

const CENTER: [number, number] = [0, 0];

class MapWrapper {
    private initialized = false;
    private map: mapboxgl.Map;
    private data: TrackFeatureCollection[] = [];
    private skipCount = 8;
    private rawDataMode: RawDataView = 'Tracks';
    private yearFilter: number | null = null;

    public onLoadFilesStart: () => void = NO_OP;
    public onLoadFilesFinish: (e?: Error) => void = NO_OP;
    public onSelection: (features: TrackFeature[]) => void = NO_OP;

    constructor() {
        // Nothing (for now?)
    }

    public init(containerId: string): void {
        this.map = new mapboxgl.Map({
            container: containerId,
            // TODO : drop down to change style
            style: 'mapbox://styles/mapbox/dark-v10',
            // style: 'mapbox://styles/mapbox/satellite-v9',
            center: CENTER,
            zoom: 12
        });

        this.map.on('load', () => {
            this.finishInitialization();
            this.loadFiles();
        });
    }

    private finishInitialization() {
        // Sources
        this.map.addSource(SOURCE_TRACK_POINTS, {type: 'geojson', data: EMPTY_FEATURE_COLLECTION});
        this.map.addSource(SOURCE_TRACK_LINES, {type: 'geojson', data: EMPTY_FEATURE_COLLECTION});
        this.map.addSource(SOURCE_SINGLE_TRACK, {type: 'geojson', data: EMPTY_FEATURE_COLLECTION});
        this.map.addSource(SOURCE_DISTANCE_CIRCLES, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    //turf.circle(CENTER, 1, {steps: 36, units: 'kilometers'}),
                    turf.circle(CENTER, 5, {steps: 36, units: 'kilometers'}),
                    turf.circle(CENTER, 10, {steps: 36, units: 'kilometers'}),
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

        // TODO : move that out (or at least move the even handling part out)
        this.map.on('click', LAYER_TRACK_LINES, (e) => {
            const trackIds = e.features.map((f) => {
                return (f.properties as TrackProperties).trackId;
            });
            if (trackIds.length > 0) {
                e.preventDefault();

                // TODO : instead of setting the selection here
                // we should:
                // - fire an event with the feature(s)
                // - let the UI store the selection
                // - UI calls setHighlightedTracks on the map
                // - when there is only one track, show the details
                // - when there are multiple tracks, show the list
                //   - when the user move-over a track in the list,
                //     the UI calls setHighlightedTracks with this track
                //   - when the user move-out
                //     the UI calls setHighlightedTracks with all the tracks
                //   - when the user clicks on a track in the list
                //     the UI calls setHighlightedTracks with the single track
                //     and it shows the details of the track

                console.info('Highlighting tracks: ' + trackIds);
                this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['in', 'trackId', ...trackIds]);

                // Use the raw data because it has all the points and properties
                const featureCollection = this.data.filter((fc) => {
                    return trackIds.includes(fc.features[0].properties.trackId)
                });
                this.onSelection(featureCollection.map((fc) => fc.features[0]));
            }
        });

        this.map.on('click', (e) => {
            // HACK - this is not in the API
            if (!e._defaultPrevented) {
                this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['in', 'trackId']);
                this.onSelection([]);
            }
        });

        // Change the cursor when moving over a track
        this.map.on('mousemove', LAYER_TRACK_LINES, () => this.map.getCanvas().style.cursor = 'pointer');
        this.map.on('mouseleave', LAYER_TRACK_LINES, () => this.map.getCanvas().style.cursor = '');

        // Empty filter initially
        this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['in', 'trackId']);

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

        this.initialized = true;
    }

    private loadFiles() {
        this.onLoadFilesStart();

        const keys = Array.from(traceUrls.keys()); //.slice(0, 50);

        console.log(`Loading ${keys.length} files...`);
        const promises = keys.map((f) => loadFromGpx(f, traceUrls.get(f)));
        Promise.all(promises)
            .then((data) => {
                this.data = data;
                this.onLoadFilesFinish();
                this.refreshData();
                console.log('Load complete');
            })
            .catch((e) => {
                console.error('Loading failed', e);
                this.onLoadFilesFinish(e);
            });
    }

    public setYearFilter(year: number | null): void {
        this.yearFilter = year;
        if (this.initialized) {
            this.refreshData();
        }
    }

    public setDataSampling(value: number): void {
        this.skipCount = value;
        if (this.initialized) {
            this.refreshData();
            this.map.setPaintProperty(LAYER_HEATMAP, 'heatmap-weight', getHeatmapWeight(value));
        }
    }

    public setRawDataRender(value: RawDataView): void {
        this.rawDataMode = value;

        if (this.initialized) {
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
    }

    private refreshData() {
        const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
        const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];

        this.data
            .filter((fc) => {
                const {type, time} = fc.features[0].properties;
                // Only type 9 (Run) and only current year (or all)
                return type === 9 && this.yearFilter === null || time.startsWith(this.yearFilter + '-');
            })
            // Merge features from all feature collections
            .map((fc) => {
                fc.features.forEach((f) => {
                    const lineFeature = {
                        ...f,
                        geometry: {
                            ...f.geometry,
                            coordinates: [] as GeoJSON.Position[]
                        }
                    };

                    // Sample points
                    f.geometry.coordinates
                        .filter((c, i) => {
                            return i % this.skipCount === 0;
                        })
                        .forEach((c) => {
                            const [lon, lat] = c;
                            lineFeature.geometry.coordinates.push([lon, lat]);
                            pointFeatures.push({
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'Point',
                                    coordinates: [lon, lat, 0.0]
                                }
                            });
                        });

                    lineFeatures.push(lineFeature);
                });
            });

        console.log(`Rendering ${pointFeatures.length} points and ${lineFeatures.length} lines`);
        (this.map.getSource(SOURCE_TRACK_POINTS) as GeoJSONSource)
            .setData({type: 'FeatureCollection', features: pointFeatures});
        (this.map.getSource(SOURCE_TRACK_LINES) as GeoJSONSource)
            .setData({type: 'FeatureCollection', features: lineFeatures});
    }

    public enterReplay(feature: TrackFeature): void {
        const coordinates = feature.geometry.coordinates;

        this.map.setLayoutProperty(LAYER_HEATMAP, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_POINTS, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_LINES, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_LINES_HIGHLIGHTED, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_CIRCLES, 'visibility', 'none');

        this.map.jumpTo({
            center: coordinates[0] as LngLatLike,
            zoom: 14
        });

        // this.map.setPitch(30);
    }

    public setReplayPosition(feature: TrackFeature, position: number): void {
        const coordinates = feature.geometry.coordinates;

        const clone = {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: feature.geometry.coordinates.slice(0, position)
            }
        };

        (this.map.getSource(SOURCE_SINGLE_TRACK) as GeoJSONSource)
            .setData({type: 'FeatureCollection', features: [clone]});
        this.map.panTo(coordinates[position] as LngLatLike);
    }

    public exitReplay(): void {
        // TODO : get back to initial position, or show complete track?
        // this.map.setPitch(0);

        (this.map.getSource(SOURCE_SINGLE_TRACK) as GeoJSONSource).setData(EMPTY_FEATURE_COLLECTION);

        this.map.setLayoutProperty(LAYER_HEATMAP, 'visibility', 'visible');
        this.map.setLayoutProperty(LAYER_TRACK_LINES_HIGHLIGHTED, 'visibility', 'visible');
        this.map.setLayoutProperty(LAYER_CIRCLES, 'visibility', 'visible');
        this.setRawDataRender(this.rawDataMode)
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
