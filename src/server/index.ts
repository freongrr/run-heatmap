import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { loadTracks, putTrack } from './db';

const PORT = 3000;
const SSL_PORT = 3001;

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

const promises: Array<Promise<string>> = []

promises.push(new Promise(resolve => {
    http.createServer(app).listen(PORT, () => resolve(`http://localhost:${PORT}`));
}));

if (process.env['SSL_KEY_PATH'] && process.env['SSL_CERT_PATH']) {
    const options: https.ServerOptions = {
        key: fs.readFileSync(process.env['SSL_KEY_PATH']),
        cert: fs.readFileSync(process.env['SSL_CERT_PATH'])
    };

    const server = https.createServer(options, app);
    promises.push(new Promise(resolve => {
        server.listen(SSL_PORT, () => resolve(`https://localhost:${SSL_PORT}`));
    }));
} else {
    console.warn('Set SSL_KEY_PATH and SSL_CERT_PATH to enable SSL');
}

Promise.all(promises).then((results) => {
    console.log('App listening on:');
    results.forEach((s) => console.log('  ' + s));
}).catch((reason) => {
    console.error("Failed to start", reason);
    process.exit(1);
});
