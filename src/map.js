// noinspection SpellCheckingInspection
mapboxgl.accessToken = 'XXX';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [0, 0],
    zoom: 13
});

map.on('load', function () {
    const files = [
        './data/1234.gpx',
    ];

    console.log(`Loading ${files.length} files...`);
    const promises = files.map((f) => loadFromGpx(f));

    Promise.all(promises)
        .then((data) => {
            const merged = data[0];
            for (let i = 1; i < data.length; i++) {
                merged.features.push(...data[i].features);
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
            'maxzoom': 15,
            'paint': {
                // TODO : interpolate based on Zoom?
                'heatmap-weight': 0.002,
                // 'heatmap-weight': [
                //     'interpolate',
                //     ['linear'],
                //     ['zoom'],
                //     0,
                //     0.001,
                //     13,
                //     0.001,
                //     15,
                //     0.01
                // ],
                // // Transition from heatmap to circle layer by zoom level
                // 'heatmap-opacity': [
                //     'interpolate',
                //     ['linear'],
                //     ['zoom'],
                //     7,
                //     1,
                //     9,
                //     0
                // ]
                // 'heatmap-radius': [
                //     'interpolate',
                //     ['linear'],
                //     ['zoom'],
                //     0,
                //     10,
                //     13,
                //     20,
                //     15,
                //     30
                // ],
            }
        },
        'waterway-label'
    );

    // map.addLayer(
    //     {
    //         'id': 'track-point',
    //         'type': 'circle',
    //         'source': 'track',
    //         'minzoom': 10,
    //         'paint': {
    //             // Radius based on zoom level
    //             'circle-radius': [
    //                 'interpolate', ['linear'], ['zoom'], 10, 0.1, 16, 5
    //             ],
    //             'circle-color': 'rgba(255,255,255,1)',
    //             'circle-stroke-color': 'rgba(0,0,0,0)',
    //             'circle-stroke-width': 1,
    //             // Transition from heatmap to circle layer based on zoom level
    //             'circle-opacity': [
    //                 'interpolate', ['linear'], ['zoom'], 10, 0, 14, 0.1, 16, 1
    //             ]
    //         }
    //     },
    //     'waterway-label'
    // );
}
