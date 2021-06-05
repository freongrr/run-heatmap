const SKIP_COUNT = 4;

function loadFromGpx(url) {
    return fetch(url)
        .then((r) => r.text())
        .then((d) => doConvert(d));
}

function doConvert(data) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');

    const pointElements = xmlDoc.getElementsByTagName('gpx')[0]
        .getElementsByTagName('trk')[0]
        .getElementsByTagName('trkseg')[0]
        .getElementsByTagName('trkpt');

    const convertedPoints = [...pointElements]
        .filter((p, i) => i % SKIP_COUNT === 0)
        .map((p, i) => toFeature(`p${i}`, p));

    return {
        'type': 'FeatureCollection',
        'features': convertedPoints
    };
}

function toFeature(id, element /* Element */) {
    // TODO : skip / merge points and give them a higher weight?
    return {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            // 'properties': {
            //     'weight': 1
            // },
            'coordinates': [
                element.getAttribute('lon'),
                element.getAttribute('lat'),
                0.0
            ]
        }
    };
}
