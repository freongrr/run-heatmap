function loadFromGpx(url /* string */) {
    return fetch(url)
        .then((r) => r.text())
        .then((d) => {
            const index = url.lastIndexOf('/');
            const fileName = url.substring(index + 1, url.length)
            return doConvert(d, fileName);
        });
}

function doConvert(data, fileName) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');

    const trackElement = xmlDoc.getElementsByTagName('gpx')[0]
        .getElementsByTagName('trk')[0];

    const pointElements = trackElement
        .getElementsByTagName('trkseg')[0]
        .getElementsByTagName('trkpt');

    return {
        'type': 'FeatureCollection',
        'features': [...pointElements].map((p) => toFeature(p)),
        '_fileName': fileName,
        "_trackType": getChildElementValue(trackElement, 'type')
    };
}

function toFeature(element /* Element */) {
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

function getChildElementValue(element /* Element */, tagName) {
    const elements = element.getElementsByTagName(tagName);
    if (elements.length > 0 && elements[0].childNodes.length > 0) {
        const childElement = elements[0];
        return childElement.childNodes.item(0).nodeValue
    } else {
        return null;
    }
}
