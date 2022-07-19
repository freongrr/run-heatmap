import { loadFromGpxData } from './gpxConverter';
import * as express from 'express';
import * as fs from 'fs';

const app = express();

app.use(express.static('./dist'));

app.get('/foo', (req, res) => {
    fs.readFile('./7481120568.gpx', ((err, data) => {
        loadFromGpxData('7481120568.gpx', data.toString())
            .then((featureCollection) => {
                res.type('json');
                res.send(featureCollection);
            });
    }));
});

app.listen(3000, () => console.log('App listening on http://localhost:3000'));
