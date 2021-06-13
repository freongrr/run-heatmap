// noinspection SpellCheckingInspection
mapboxgl.accessToken = 'XXX';

// A lot of the code is taken from:
// https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/

const NO_OP = () => {
    // no-op
};

const SOURCE_POINTS = 'points';
const SOURCE_LINES = 'tracks';
const SOURCE_DISTANCE_CIRCLES = 'distanceCircles';
const LAYER_HEATMAP = 'points-heatmap';
const LAYER_TRACK_POINTS = 'tracks-points';
const LAYER_TRACK_LINES = 'tracks-lines';

const EMPTY_FEATURE_COLLECTION = {
    type: "FeatureCollection",
    features: []
};

const CENTER = [0, 0];

class MapWrapper {
    data = [];
    skipCount = 8;
    rawDataMode = 'Tracks';
    yearFilter = null;
    onLoadFilesStart = NO_OP;
    onLoadFilesFinish = NO_OP;

    constructor() {
        // Nothing (for now?)
    }

    init(containerId) {
        this.map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/dark-v10',
            center: CENTER,
            zoom: 12
        });

        this.map.on('load', () => {
            this.finishInitialization();
            this.loadFiles();
        });
    }

    finishInitialization() {
        this.map.addSource(SOURCE_POINTS, {
            'type': 'geojson',
            'data': EMPTY_FEATURE_COLLECTION
        });

        this.map.addSource(SOURCE_LINES, {
            'type': 'geojson',
            'data': EMPTY_FEATURE_COLLECTION
        });

        // The actual heatmap
        this.map.addLayer(
            {
                'id': LAYER_HEATMAP,
                'type': 'heatmap',
                'source': SOURCE_POINTS,
                'paint': {
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
                'id': LAYER_TRACK_POINTS,
                'type': 'circle',
                'source': SOURCE_POINTS,
                'minzoom': 10,
                'paint': {
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
                'id': LAYER_TRACK_LINES,
                'type': 'line',
                'source': SOURCE_LINES,
                'minzoom': 10,
                'paint': {
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

        // Hide points by default
        this.map.setLayoutProperty(LAYER_TRACK_POINTS, 'visibility', 'none');

        // Add circles at 5km and 10km
        this.map.addSource(SOURCE_DISTANCE_CIRCLES, {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: [
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
                'line-color': 'yellow',
                'line-opacity': 1,
                'line-width': 2
            },
        });
    }

    loadFiles() {
        this.onLoadFilesStart();

        const files = [
            './data/1234.gpx',
        ]; //.slice(0, 50);

        console.log(`Loading ${files.length} files...`);
        const promises = files.map((f) => loadFromGpx('./data/' + f));
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

    setYearFilter(year) {
        this.yearFilter = year;
        this.refreshData();
    }

    setDataSampling(value) {
        this.skipCount = value;
        this.refreshData();
        this.map.setPaintProperty(LAYER_HEATMAP, 'heatmap-weight', getHeatmapWeight(value));
    }

    setRawDataRender(value) {
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

    refreshData() {
        const lineFeatures = [];
        const pointFeatures = [];

        this.data
            // Only type 9 (Run)
            .filter((fc) => fc._trackType === 9)
            // Only current year or all
            .filter((fc) => this.yearFilter === null || fc._time.startsWith(this.yearFilter + '-'))
            // Merge features from all feature collections
            .map((fc) => {
                fc.features.forEach((f) => {
                    const lineFeature = {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: []
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
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': [lon, lat, 0.0]
                                }
                            });
                        });

                    lineFeatures.push(lineFeature);
                });
            });

        console.log(`Rendering ${pointFeatures.length} points and ${lineFeatures.length} lines`);
        this.map.getSource(SOURCE_POINTS).setData({type: "FeatureCollection", features: pointFeatures});
        this.map.getSource(SOURCE_LINES).setData({type: "FeatureCollection", features: lineFeatures});
    }
}

function getHeatmapWeight(skipCount) {
    if (skipCount === 2) {
        return 0.002;
    } else {
        return 2 * getHeatmapWeight(skipCount / 2) - 0.001;
    }
}
