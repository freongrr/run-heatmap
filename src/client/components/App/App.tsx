import ControlOverlay from '@src/client/components/ControlOverlay';
import LoadingOverlay from '@src/client/components/LoadingOverlay';
import Map from '@src/client/components/Map';
import { useTicker } from '@src/client/hooks/useTicker';
import { formatDuration } from '@src/client/utils/formatTime';
import { loadFromGpxData } from '@src/client/utils/gpxConverter';
import { RawDataView, Track } from '@src/shared/types';
import React from 'react';

const API_URL = location.protocol === 'https:'
    ? `https://${location.hostname}:3001`
    : `http://${location.hostname}:3000`;

const App = () => {
    const [allData, setAllData] = React.useState<Track[]>([]);
    const [visibleData, setVisibleData] = React.useState<Track[]>([]);
    const [loading, setLoading] = React.useState(true /* avoid flickering */);
    const [error, setError] = React.useState<string>(null);
    const [year, setYear] = React.useState<number>(null);
    const [sampling, setSampling] = React.useState<number>(8);
    const [rawDataView, setRawDataView] = React.useState<RawDataView>('Tracks');
    const [selectedTracks, setSelectedTracks] = React.useState<Track[]>([]);
    const [activeTrack, setActiveTrack] = React.useState<Track | null>(null);
    const [highlightedTracks, setHighlightedTracks] = React.useState<Track[]>([]);
    const [replayedTrack, setReplayedTrack] = React.useState<Track | null>(null);

    React.useEffect(() => {
        const currentYear = new Date().getFullYear();

        let loadedTracks: Track[] = [];
        setLoading(true);
        setAllData(loadedTracks);

        function fetchTracks(year: number): void {
            loadFromServer(year, sampling)
                .then((tracks) => {
                    if (tracks.length === 0 && year !== currentYear) {
                        setLoading(false);
                    } else {
                        loadedTracks = loadedTracks.concat(tracks);
                        setAllData(loadedTracks);
                        fetchTracks(year - 1);
                    }
                })
                .catch((e) => {
                    console.error('Loading failed', e);
                    setError(e.toString());
                });
        }

        fetchTracks(currentYear);
    }, [setLoading, setAllData, setError, sampling]);

    React.useEffect(() => {
        // TODO : replace with call to server?
        let newVisibleData = allData;
        if (year !== null) {
            const startOfYear = new Date(`${year}-01-01`).getTime();
            const startOfNextYear = new Date(`${year + 1}-01-01`).getTime();
            newVisibleData = newVisibleData.filter((r) => {
                return r.timestamp >= startOfYear && r.timestamp < startOfNextYear;
            });
        }
        setVisibleData(newVisibleData);
    }, [allData, year, setVisibleData]);

    const ticker = useTicker(
        activeTrack ? activeTrack.coordinates.length : null,
        React.useCallback(() => {
            setReplayedTrack({
                ...activeTrack,
                coordinates: [activeTrack.coordinates[0]],
                coordinateTimes: [activeTrack.coordinateTimes[0]]
            });
        }, [activeTrack, setReplayedTrack]),
        React.useCallback((i: number) => {
            setReplayedTrack({
                ...activeTrack,
                coordinates: activeTrack.coordinates.slice(0, i),
                coordinateTimes: activeTrack.coordinateTimes.slice(0, i)
            });
        }, [activeTrack, setReplayedTrack]),
        React.useCallback(() => {
            setReplayedTrack(null);
        }, [setReplayedTrack]),
        sampling
    );

    const onSelectTracks = React.useCallback((ids: number[]) => {
        const tracks = allData.filter((f) => ids.includes(f.id));
        setSelectedTracks(tracks);
        setHighlightedTracks(tracks)
        if (tracks.length === 1) {
            setActiveTrack(tracks[0]);
        } else {
            setActiveTrack(null);
        }
    }, [allData, setSelectedTracks]);

    const onDeselectTracks = React.useCallback(() => {
        setSelectedTracks([]);
        setHighlightedTracks([]);
    }, [setSelectedTracks]);

    const onActivateOrDeactivateTrack = React.useCallback((track: Track | null) => {
        setActiveTrack(track);
        if (track) {
            setHighlightedTracks([track]);
        } else {
            setHighlightedTracks(selectedTracks);
        }
    }, [selectedTracks, setActiveTrack, setHighlightedTracks]);

    const onDrop = React.useCallback(async (files: File[]) => {
        const startTime = new Date().getTime();
        let newTrackCount = 0;
        setLoading(true);
        try {
            const newTracks = (await Promise.all(files.map((f) => readGpxFile(f))))
                .reduce((a, b) => a.concat(b), [])
                .filter((t) => !allData.find((x) => x.id === t.id));
            newTrackCount = newTracks.length;

            const promises = newTracks.map((f) => saveToServer(f));
            await Promise.all(promises);

            // TODO : this should be done on the server for consistency
            const sampledTrack: Track[] = newTracks.map((f) => {
                return {
                    ...f,
                    coordinates: f.coordinates.filter((c, i) => i % sampling === 0),
                    coordinateTimes: f.coordinateTimes.filter((t, i) => i % sampling === 0)
                }
            });
            setAllData(allData.concat(sampledTrack));
        } finally {
            const endTime = new Date().getTime();
            console.log(`Imported ${newTrackCount} runs in ${formatDuration(endTime - startTime, true)}`);
            setLoading(false);
        }
    }, [allData, setAllData]);

    return (
        <>
            <Map
                tracks={visibleData}
                highlightedTracks={highlightedTracks}
                replayedTrack={replayedTrack}
                sampling={sampling}
                rawDataView={rawDataView}
                onSelectTracks={onSelectTracks}
            />
            {loading && <LoadingOverlay error={error}/>}
            <ControlOverlay
                disabled={loading}
                onDropFiles={onDrop}
                year={year}
                onSelectYear={setYear}
                sampling={sampling}
                onSelectSampling={setSampling}
                rawDataView={rawDataView}
                onSelectRawDataView={setRawDataView}
                selectedTracks={selectedTracks}
                onDeselectTracks={onDeselectTracks}
                activeTrack={activeTrack}
                onActiveTrack={onActivateOrDeactivateTrack}
                ticker={ticker}
            />
        </>
    );
}

async function loadFromServer(year: number, sampling: number): Promise<Track[]> {
    const startTime = new Date().getTime();
    const response = await fetch(`${API_URL}/tracks?year=${year}&sampling=${sampling}`);
    const tracks: Track[] = await response.json();
    const endTime = new Date().getTime();
    console.log(`Loaded ${tracks.length} tracks for ${year} in ${formatDuration(endTime - startTime, true)}`);
    return tracks;
}

async function saveToServer(track: Track): Promise<void> {
    const response = await fetch(`${API_URL}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track)
    });
    if (response.status !== 200) {
        throw new Error('Failed');
    }
}

function readGpxFile(file: File): Promise<Track[]> {
    if (file.name.endsWith('.gpx')) {
        return file.text().then((txt) => {
            return loadFromGpxData(file.name, txt);
        });
    } else {
        return Promise.resolve([]);
    }
}

export default App;
