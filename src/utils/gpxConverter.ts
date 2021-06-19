import {TrackFeature, TrackFeatureCollection} from '../types';

export function loadFromGpxData(fileName: string, data: string): Promise<TrackFeatureCollection> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    const rootElement = xmlDoc.getElementsByTagName('gpx')[0];
    const trackElement = rootElement.getElementsByTagName('trk')[0];
    const typeId = +getChildElementValue(trackElement, 'type');
    const description = getChildElementValue(trackElement, 'name');

    const pointElements = trackElement
        .getElementsByTagName('trkseg')[0]
        .getElementsByTagName('trkpt');

    const feature: TrackFeature = {
        id: +fileName.replace('.gpx', ''),
        type: 'Feature',
        properties: {
            description: description,
            type: typeId,
            timestamps: Array.from(pointElements).map((e) => {
                const dateString = getChildElementValue(e, 'time');
                return new Date(dateString).getTime();
            })
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

    return Promise.resolve({
        type: 'FeatureCollection',
        features: [feature]
    });
}

function getChildElementValue(element: Element, tagName: string): string {
    const elements = element.getElementsByTagName(tagName);
    if (elements.length > 0 && elements[0].childNodes.length > 0) {
        const childElement = elements[0];
        return childElement.childNodes.item(0).nodeValue
    } else {
        return null;
    }
}
