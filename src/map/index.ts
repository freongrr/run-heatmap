import * as turf from '@turf/turf';
import mapboxgl, {GeoJSONSource, LngLatLike} from 'mapbox-gl';
import {loadFromGpx} from '../utils/gpxConverter';
import {traceUrls} from '../dataLoader';
import {TOKEN} from './mapbox-token';
import * as GeoJSON from 'geojson';
import {RawDataView, TrackFeature, TrackFeatureCollection, TrackFeatureLike, TrackProperties} from '../types';

mapboxgl.accessToken = TOKEN;

// A lot of the code is taken from:
// https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/

const NO_OP = () => {
    // no-op
};

const SOURCE_POINTS = 'points';
const SOURCE_LINES = 'tracks';
const SOURCE_DISTANCE_CIRCLES = 'distanceCircles';
const SOURCE_TRACE = 'trace';
const LAYER_HEATMAP = 'points-heatmap';
const LAYER_TRACK_POINTS = 'tracks-points';
const LAYER_TRACK_LINES = 'tracks-lines';
const LAYER_TRACK_LINES_HIGHLIGHTED = 'tracks-lines-hl';
const LAYER_TRACE = 'trace';

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
    public onSelection: (features: TrackFeatureLike[]) => void = NO_OP;

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
        this.map.addSource(SOURCE_POINTS, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION
        });

        this.map.addSource(SOURCE_LINES, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION
        });

        // The actual heatmap
        this.map.addLayer(
            {
                id: LAYER_HEATMAP,
                type: 'heatmap',
                source: SOURCE_POINTS,
                paint: {
                    // This is based on how many points we skip when parsing the GPX files
                    'heatmap-weight': getHeatmapWeight(this.skipCount),
                    'heatmap-intensity': [
                        'interpolate', ['exponential', 2], ['zoom'], 0, 0.6, 15, 4, 20, 5, 23, 10
                    ]
                }
            }
        );

        // Tracks as points
        this.map.addLayer(
            {
                id: LAYER_TRACK_POINTS,
                type: 'circle',
                source: SOURCE_POINTS,
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

        // Tracks as lines
        this.map.addLayer(
            {
                id: LAYER_TRACK_LINES,
                type: 'line',
                source: SOURCE_LINES,
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

        // Highlighted tracks
        this.map.addLayer(
            {
                id: LAYER_TRACK_LINES_HIGHLIGHTED,
                type: 'line',
                source: SOURCE_LINES,
                minzoom: 10,
                paint: {
                    'line-color': '#FFF',
                    'line-opacity': 1,
                    'line-width': 5
                }
            }
        );

        this.map.on('click', LAYER_TRACK_LINES, (e) => {
            // HACK - there's no guarantee these features are proper TrackFeature, but they are similar
            const features = e.features as unknown as TrackFeatureLike[];
            if (features.length > 0) {
                e.preventDefault();
                const trackIds = features.map((f) => f.properties.trackId);
                console.info('Highlighting tracks: ' + trackIds);
                this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['in', 'trackId', ...trackIds]);
                this.onSelection(features);

                // Use the raw data
                // const featureCollection = this.data.find((fc) => {
                //    return fc.features[0].properties.trackId === e.features[0].properties.trackId
                // });
                // this.followTrack(featureCollection.features[0]);
            }
        });

        this.map.on('click', (e) => {
            // HACK - this is not in the API
            if (!e._defaultPrevented) {
                this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['in', 'trackId']);
                this.onSelection([]);
            }
        });

        // Empty filter initially
        this.map.setFilter(LAYER_TRACK_LINES_HIGHLIGHTED, ['in', 'trackId']);

        // Change the cursor when moving over a track
        this.map.on('mousemove', LAYER_TRACK_LINES, () => this.map.getCanvas().style.cursor = 'pointer');
        this.map.on('mouseleave', LAYER_TRACK_LINES, () => this.map.getCanvas().style.cursor = '');

        // Show/hide layers (we have to do that because the setter can be called before we get here)
        this.map.setLayoutProperty(LAYER_TRACK_LINES, 'visibility', this.rawDataMode === 'Tracks' ? 'visible' : 'none');
        this.map.setLayoutProperty(LAYER_TRACK_POINTS, 'visibility', this.rawDataMode === 'Points' ? 'visible' : 'none');

        // Add circles at 5km and 10km
        this.map.addSource(SOURCE_DISTANCE_CIRCLES, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    turf.circle(CENTER, 1, {steps: 36, units: 'kilometers'}),
                    turf.circle(CENTER, 5, {steps: 36, units: 'kilometers'}),
                    turf.circle(CENTER, 10, {steps: 36, units: 'kilometers'}),
                ]
            }
        });

        this.map.addLayer({
            id: 'circle-fill',
            type: 'line',
            source: SOURCE_DISTANCE_CIRCLES,
            paint: {
                'line-color': '#AAA',
                'line-opacity': 1,
                'line-width': 2
            },
        });

        this.initialized = true;
    }

    private loadFiles() {
        this.onLoadFilesStart();

        const traceFileUrls = traceUrls; //.slice(0, 50);

        console.log(`Loading ${traceFileUrls.length} files...`);
        const promises = traceFileUrls.map((f) => loadFromGpx(f));
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
        (this.map.getSource(SOURCE_POINTS) as GeoJSONSource)
            .setData({type: 'FeatureCollection', features: pointFeatures});
        (this.map.getSource(SOURCE_LINES) as GeoJSONSource)
            .setData({type: 'FeatureCollection', features: lineFeatures});
    }

    private followTrack(feature: GeoJSON.Feature): void {
        if (feature.geometry.type !== 'LineString') {
            throw new Error(`Can't follow track of type ${feature.geometry.type}`);
        }

        // save full coordinate list for later
        const coordinates = feature.geometry.coordinates;

        // start by showing just the first coordinate
        const clone = {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: [coordinates[0]]
            }
        };

        // Hide everything while showing the trace
        this.map.setLayoutProperty(LAYER_HEATMAP, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_POINTS, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_LINES, 'visibility', 'none');
        this.map.setLayoutProperty(LAYER_TRACK_LINES_HIGHLIGHTED, 'visibility', 'none');

        // Add new source/layer
        // TODO : I would like to re-use the "highlight" one :|
        this.map.addSource(SOURCE_TRACE, {type: 'geojson', data: {type: 'FeatureCollection', features: [clone]}});
        this.map.addLayer({
            id: LAYER_TRACE,
            type: 'line',
            source: SOURCE_TRACE,
            paint: {
                'line-color': 'yellow',
                'line-opacity': 0.75,
                'line-width': 5
            }
        });

        // setup the viewport
        this.map.jumpTo({
            center: coordinates[0] as LngLatLike,
            zoom: 14
        });
        //this.map.setPitch(30);

        // on a regular basis, add more coordinates from the saved list and update the map
        let i = 0;
        const timer = window.setInterval(() => {
            if (i < coordinates.length) {
                clone.geometry.coordinates.push(coordinates[i]);
                (this.map.getSource(SOURCE_TRACE) as GeoJSONSource)
                    .setData({type: 'FeatureCollection', features: [clone]});
                this.map.panTo(coordinates[i] as LngLatLike);
                i++;
            } else {
                window.clearInterval(timer);

                // TODO : pause for a while?
                // TODO : the selection is lost

                this.setRawDataRender(this.rawDataMode)
                this.map.removeLayer(LAYER_TRACE);
                this.map.removeSource(SOURCE_TRACE);
                this.map.setLayoutProperty(LAYER_HEATMAP, 'visibility', 'visible');
            }
        }, 10);
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
