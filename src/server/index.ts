import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { loadFeatures, putFeature } from './db';

const app = express();
app.use(express.static(process.env.STATIC_ROOT || './dist'));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: 1_000_000 }));
app.use(compression());

app.get('/features', async (req, res) => {
    const samplingStr = req.query['sampling'] as string | undefined;
    const sampling: number = samplingStr ? parseInt(samplingStr) : 1;
    const features = await loadFeatures();
    const sampledFeatures = features.map((f) => {
        return {
            ...f, geometry: {
                ...f.geometry, coordinates: f.geometry.coordinates.filter((c, i) => {
                    return i % sampling === 0;
                })
            }
        };
    });
    res.status(200).json(sampledFeatures);
});

app.post('/features', async (req, res) => {
    // TODO : validation
    const feature = req.body;
    await putFeature(feature);
    res.status(200).end()
});

app.listen(3000, () => console.log('App listening on http://localhost:3000'));
