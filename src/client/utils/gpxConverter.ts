import { Track } from '@src/shared/types';

const TYPE_RUN = 9;

// TODO : why is this returning a Promise?
export function loadFromGpxData(fileName: string, data: string): Promise<Track[]> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    const rootElement = xmlDoc.getElementsByTagName('gpx')[0];
    const trackElement = rootElement.getElementsByTagName('trk')[0];
    const typeId = +getChildElementValue(trackElement, 'type');
    const description = getChildElementValue(trackElement, 'name');

    const pointElements = trackElement
        .getElementsByTagName('trkseg')[0]
        .getElementsByTagName('trkpt');

    if (typeId === TYPE_RUN) {
        const timestamps = Array.from(pointElements).map((e) => {
            const dateString = getChildElementValue(e, 'time');
            return new Date(dateString).getTime();
        });
        const track: Track = {
            id: +fileName.replace('.gpx', ''),
            description: description,
            timestamp: timestamps[0],
            coordinates: Array.from(pointElements).map((e) => {
                return [
                    +e.getAttribute('lon'),
                    +e.getAttribute('lat')
                ];
            }),
            coordinateTimes: timestamps.map((t) => t - timestamps[0])
        };
        return Promise.resolve([track]);
    } else {
        console.warn(`Skipping non-run in ${fileName}: ${description}`);
        return Promise.resolve([]);
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
