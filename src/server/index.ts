import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import { loadFeatures, putFeature } from './db';

const app = express();
app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json({ limit: 1_000_000 }));
app.use(express.static('./dist'));
app.use(compression());

app.get('/features', async (req, res) => {
    const features = await loadFeatures();
    res.status(200).json(features);
});

app.post('/features', async (req, res) => {
    // TODO : validation
    const feature = req.body;
    await putFeature(feature);
    res.status(200).end()
});

app.listen(3000, () => console.log('App listening on http://localhost:3000'));
