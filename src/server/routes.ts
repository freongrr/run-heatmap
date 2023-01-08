import { Track } from '@src/shared/types';
import * as express from 'express';
import { sampleTrack } from '../shared/convert';
import { loadTracks, putTrack } from './db';

export async function getTracks(req: express.Request, res: express.Response): Promise<void> {
    const year = parseInt(req.query['year'] as string);
    const sampling = parseInt(req.query['sampling'] as string);
    if (isNaN(year) || isNaN(sampling)) {
        res.status(400).send('Bad request');
    } else {
        const tracks = await loadTracks(year);
        const sampledTracks: Track[] = [];
        tracks.forEach((t) => {
            try {
                sampledTracks.push(sampleTrack(t, sampling));
            } catch (e) {
                console.warn(`Failed to sample track ${t.id}`, e);
            }
        });
        res.status(200).json(sampledTracks);
    }
}

export async function postTrack(req: express.Request, res: express.Response): Promise<void> {
    // TODO : validation
    const track = req.body;
    const MIN_SAMPLING = 2;
    const sampledTrack = sampleTrack(track, MIN_SAMPLING);
    await putTrack(sampledTrack);
    res.status(200).json(sampledTrack);
}
