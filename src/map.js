mapboxgl.accessToken = 'XXX';

// A lot of the code is taken from:
// https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/

const NO_OP = () => {
    // no-op
};

const SOURCE_TRACK = 'track';
const LAYER_HEATMAP = 'track-heatmap';
const LAYER_TRACK = 'track-point';

class MapWrapper {
    data = [];
    skipCount = 8;
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
            center: [0, 0],
            zoom: 12
        });

        this.map.on('load', () => {
            this.finishInitialization();
            this.loadFiles();
        });
    }

    finishInitialization() {
        this.map.addSource(SOURCE_TRACK, {
            'type': 'geojson',
            'data': {
                type: "FeatureCollection",
                features: []
            }
        });

        // The actual heatmap
        this.map.addLayer(
            {
                'id': LAYER_HEATMAP,
                'type': 'heatmap',
                'source': SOURCE_TRACK,
                // 'maxzoom': 23,
                'paint': {
                    // This is based on how many points we skip when parsing the GPX files
                    'heatmap-weight': getHeatmapWeight(this.skipCount),
                    // 'heatmap-weight': [
                    //     'interpolate', ['linear'], ['get', 'weight'], 0, 0.002, 1000, 1
                    // ],
                    'heatmap-intensity': [
                        'interpolate', ['exponential', 2], ['zoom'], 0, 0.6, 15, 4, 20, 5, 23, 10
                    ]
                }
            },
            'waterway-label'
        );

        // Track points (all merged)
        // TODO : could we show each track separately as a polygon?
        this.map.addLayer(
            {
                'id': LAYER_TRACK,
                'type': 'circle',
                'source': SOURCE_TRACK,
                'minzoom': 10,
                'paint': {
                    // Radius based on zoom level
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'], 10, 0, 18, 5, 23, 10
                        // 'interpolate', ['linear'], ['get', 'weight'], 0, 1, 1000, 20
                    ],
                    'circle-color': 'rgba(255,255,255,1)',
                    'circle-stroke-color': 'rgba(0,0,0,0)',
                    'circle-stroke-width': 1,
                    // Show raw data points progressively as we zoom
                    'circle-opacity': [
                        'interpolate', ['linear'], ['zoom'], 10, 0, 18, 0.2, 23, 1
                    ]
                }
            },
            'waterway-label'
        );
    }

    loadFiles() {
        this.onLoadFilesStart();

        const files = [
            './data/1234.gpx',
        ]; //.slice(0, 50);

        console.log(`Loading ${files.length} files...`);
        const promises = files.map((f) => loadFromGpx(f));
        Promise.all(promises)
            .then((data) => {
                this.data = data;
                this.onLoadFilesFinish();
                console.log('Load complete');
                this.refreshData();
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
        // TODO : increase the size/opacity of individual points!
    }

    setShowTracks(visible) {
        this.map.setLayoutProperty(
            LAYER_TRACK,
            'visibility',
            visible ? 'visible' : 'none'
        );
    }

    refreshData() {
        const features = [];
        this.data
            // Only type 9 (Run)
            .filter((d) => d._trackType === 9)
            // Only current year or all
            .filter((d) => {
                return this.yearFilter === null || d._time.startsWith(this.yearFilter + '-');
            })
            .forEach((d) => {
                features.push(...d.features.filter((p, i) => i % this.skipCount === 0));
            });

        console.log(`Rendering ${features.length} features`);
        this.map.getSource(SOURCE_TRACK)
            .setData({
                type: "FeatureCollection",
                features: features
            });
    }

    /**
     * Merge points that are very close and bump their weight.
     *
     * This is an alternative to batching, but it causes other problems.
     */
    aggregatePoints(dataCollections) {
        const indexedFeatures = new Map();
        dataCollections.forEach((d) => {
            d.features.forEach((f) => {
                const [lon, lat] = f.geometry.coordinates;
                const latCode = toCode((lat + 90) / 180, 4);
                const lonCode = toCode((lon + 180) / 360, 4);
                const key = latCode + lonCode;
                if (!indexedFeatures.has(key)) {
                    indexedFeatures.set(key, [f]);
                } else {
                    indexedFeatures.get(key).push(f);
                }
            });
        });

        const features = [];
        indexedFeatures.forEach((points) => {
            features.push(this.createAveragePoint(points));
        });
        return features;
    }

    createAveragePoint(batch) {
        // This averages the coordinates of X points
        const lon = batch.map(p => p.geometry.coordinates[0]).reduce((p, v) => p + v, 0) / batch.length;
        const lat = batch.map(p => p.geometry.coordinates[1]).reduce((p, v) => p + v, 0) / batch.length;
        return {
            'type': 'Feature',
            'properties': {
                'weight': batch.length
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [lon, lat, 0.0]
            }
        };
    }
}

function toCode(n, length) {
    const r = Math.ceil(Math.pow(26, length) * n);
    let code = '';
    for (let i = 0; i < length; i++) {
        const o = Math.ceil(r / Math.pow(26, length - 1 - i)) % 26;
        code += String.fromCharCode(65 + o);
    }
    return code;
}

function getHeatmapWeight(skipCount) {
    if (skipCount === 2) {
        return 0.002;
    } else {
        return 2 * getHeatmapWeight(skipCount / 2) - 0.001;
    }
}
