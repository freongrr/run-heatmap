import {TrackFeature, TrackFeatureCollection} from '../types';

export function loadFromGpx(url: string): Promise<TrackFeatureCollection> {
    return fetch(url)
        .then((r) => r.text())
        .then((d) => {
            const index = url.lastIndexOf('/');
            const fileName = url.substring(index + 1, url.length)
            return doConvert(d, fileName);
        });
}

function doConvert(data: string, fileName: string): TrackFeatureCollection {
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

    const feature: TrackFeature = {
        type: 'Feature',
        properties: {
            trackId: fileName.replace('.gpx', ''),
            description: description,
            time: timeString,
            type: typeId
        },
        geometry: {
            type: 'LineString',
            coordinates: Array.from(pointElements).map((e) => {
                return [
                    +e.getAttribute('lon'),
                    +e.getAttribute('lat')
                ];
            })
        }
    };

    return {
        type: 'FeatureCollection',
        features: [feature]
    };
}

function getChildElementValue(element: Element, tagName: string) {
    const elements = element.getElementsByTagName(tagName);
    if (elements.length > 0 && elements[0].childNodes.length > 0) {
        const childElement = elements[0];
        return childElement.childNodes.item(0).nodeValue
    } else {
        return null;
    }
}
