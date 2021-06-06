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
        // Only type 9 (Run)
        this.data.filter((d) => d._trackType === "9")
            .forEach((d) => {
                const batch = [];
                for (let i = 0; i < d.features.length; i++) {
                    batch.push(d.features[i]);
                    if (batch.length === this.skipCount || i === d.features.length - 1) {
                        features.push(this.xxxx(batch));
                        batch.splice(0, batch.length);
                    }
                }
            });

        console.log(`Rendering ${features.length} features`);
        this.map.getSource(SOURCE_TRACK)
            .setData({
                type: "FeatureCollection",
                features: features
            });
    }

    xxxx(batch) {
        // This only keeps 1 point out of X
        // This actually works better than using the average
        return batch[0];

        // This averages the coordinates of X points
        // const lon = batch.map(p => +p.geometry.coordinates[0]).reduce((p, v) => p + v, 0) / batch.length;
        // const lat = batch.map(p => +p.geometry.coordinates[1]).reduce((p, v) => p + v, 0) / batch.length;
        // return {
        //     'type': 'Feature',
        //     'geometry': {
        //         'type': 'Point',
        //         'coordinates': [lon, lat, 0.0]
        //     }
        // };
    }
}

function getHeatmapWeight(skipCount) {
    if (skipCount === 2) {
        return 0.002;
    } else {
        return 2 * getHeatmapWeight(skipCount / 2) - 0.001;
    }
}
