import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { loadTracks, putTrack } from './db';

const app = express();
app.use(express.static(process.env.STATIC_ROOT || './dist'));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: 1_000_000 }));
app.use(compression());

app.get('/tracks', async (req, res) => {
    const year = parseInt(req.query['year'] as string);
    const sampling = parseInt(req.query['sampling'] as string);
    if (isNaN(year) || isNaN(sampling)) {
        res.status(400).send('Bad request');
    } else {
        const tracks = await loadTracks(year);
        const sampledTracks = tracks.map((t) => {
            return {
                ...t,
                coordinates: t.coordinates.filter((c, i) => i % sampling === 0),
                coordinateTimes: t.coordinateTimes.filter((t, i) => i % sampling === 0)
            };
        });
        res.status(200).json(sampledTracks);
    }
});

app.post('/tracks', async (req, res) => {
    // TODO : validation
    const track = req.body;
    await putTrack(track);
    res.status(200).end()
});

app.listen(3000, () => console.log('App listening on http://localhost:3000'));
