// noinspection SpellCheckingInspection
mapboxgl.accessToken = 'XXX';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [0, 0],
    zoom: 10
});

map.on('load', function () {
    const files = [
        './data/1234.gpx',
    ]; //.slice(0, 50);

    console.log(`Loading ${files.length} files...`);
    const promises = files.map((f) => loadFromGpx(f));

    Promise.all(promises)
        .then((data) => {
            let merged = null;
            for (let i = 1; i < data.length; i++) {
                const datum = data[i];
                // Only type 9 (Run)
                if (datum._trackType === "9") {
                    if (merged === null) {
                        merged = data[i];
                    } else {
                        merged.features.push(...datum.features);
                    }
                }
            }
            init(merged);
            console.log(`Loaded ${merged.features.length} points`);
        });

});

function init(geojson) {
    // TODO : handle multiple tracks
    map.addSource('track', {
        'type': 'geojson',
        'data': geojson
    });

    // Taken from
    // https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/

    map.addLayer(
        {
            'id': 'track-heat',
            'type': 'heatmap',
            'source': 'track',
            // 'maxzoom': 23,
            'paint': {
                // This is based on how many points we skip when parsing the GPX files
                'heatmap-weight': 0.002,
                'heatmap-intensity': [
                    'interpolate', ['exponential', 2], ['zoom'], 0, 0.6, 15, 4, 20, 5, 23, 10
                ]
            }
        },
        'waterway-label'
    );

    map.addLayer(
        {
            'id': 'track-point',
            'type': 'circle',
            'source': 'track',
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
