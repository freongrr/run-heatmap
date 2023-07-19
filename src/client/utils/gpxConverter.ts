import { Track } from '@src/shared/types';

export function convertFromGpxData(fileName: string, data: string): Track | null {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    const rootElement = xmlDoc.getElementsByTagName('gpx')[0];
    const trackElement = rootElement.getElementsByTagName('trk')[0];
    const typeId = getChildElementValue(trackElement, 'type');
    const description = getChildElementValue(trackElement, 'name');

    const pointElements = trackElement
        .getElementsByTagName('trkseg')[0]
        .getElementsByTagName('trkpt');

    if (typeId === '9' || typeId === 'running') {
        const timestamps = Array.from(pointElements).map((e) => {
            const dateString = getChildElementValue(e, 'time');
            return new Date(dateString).getTime();
        });
        const track: Track = {
            id: +fileName.replace('.gpx', ''),
            description: description,
            sampling: 1,
            year: new Date(timestamps[0]).getFullYear(),
            timestamp: timestamps[0],
            coordinates: Array.from(pointElements).map((e) => {
                return [
                    +e.getAttribute('lon'),
                    +e.getAttribute('lat')
                ];
            }),
            coordinateSeconds: timestamps.map((t) => (t - timestamps[0]) / 1000)
        };
        return track;
    } else {
        console.warn(`Skipping non-run in ${fileName}: ${description}`);
        return null;
    }
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
