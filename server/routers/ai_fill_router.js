import { Router } from 'express';
import 'dotenv/config';
import { FormData } from 'formdata-node';
import fetch from 'node-fetch';

export const aiFillRouter = Router();

const clipdropApiKey = process.env.CLIPDROP_API_KEY;

aiFillRouter.post('/', async (req, res) => {
    if (!clipdropApiKey) {
        return res.status(500).json({ error: 'ClipDrop API key not configured' });
    }
    if (!req.body || !req.body.prompt || !req.body.image || !req.body.mask) {
        return res.status(400).json({ error: 'Prompt, image, and mask are required' });
    }

    // Validate file types (basic check)
    const imageMime = req.body.imageMime || '';
    const maskMime = req.body.maskMime || '';
    if (!['image/jpeg', 'image/png'].includes(imageMime)) {
        return res.status(400).json({ error: 'image_file must be a JPEG or PNG' });
    }
    if (maskMime !== 'image/png') {
        return res.status(400).json({ error: 'mask_file must be a PNG' });
    }

    const form = new FormData();
    form.append('image_file', req.body.image, { filename: 'image.' + (imageMime === 'image/png' ? 'png' : 'jpg'), contentType: imageMime });
    form.append('mask_file', req.body.mask, { filename: 'mask.png', contentType: 'image/png' });
    form.append('text_prompt', req.body.prompt);


    fetch('https://clipdrop-api.co/text-inpainting/v1', {
        method: 'POST',
        headers: {
            'x-api-key': clipdropApiKey,
        },
        body: form,
    })
    .then(response => response.arrayBuffer())
    .then(buffer => {
        // buffer here is a binary representation of the returned image
        res.set('Content-Type', 'image/jpeg'); // Response is always JPEG
        res.status(200).send(Buffer.from(buffer));
    })
    .catch(err => {
        res.status(500).json({ error: err.message });
    });
});