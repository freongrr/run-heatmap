export function loadFromGpx(url /* string */) {
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

    const rootElement = xmlDoc.getElementsByTagName('gpx')[0];

    const metadataElement = rootElement.getElementsByTagName('metadata')[0];
    const timeString = getChildElementValue(metadataElement, 'time');

    const trackElement = rootElement.getElementsByTagName('trk')[0];
    const typeId = +getChildElementValue(trackElement, 'type');
    const description = getChildElementValue(trackElement, 'name');

    const pointElements = trackElement
        .getElementsByTagName('trkseg')[0]
        .getElementsByTagName('trkpt');

    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                trackId: fileName.replace('.gpx', ''),
                description: description,
                time: timeString
            },
            geometry: {
                type: 'LineString',
                coordinates: [...pointElements].map((e) => {
                    return [
                        +e.getAttribute('lon'),
                        +e.getAttribute('lat')
                    ];
                })
            }
        }],
        // TODO : use the properties of the feature
        _time: timeString,
        _trackType: typeId
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
