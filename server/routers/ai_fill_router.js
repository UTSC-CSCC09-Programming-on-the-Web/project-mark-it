import { Router } from 'express';
import 'dotenv/config';
import { FormData, File } from 'formdata-node';
import fetch from 'node-fetch';
import multer from 'multer';

export const aiFillRouter = Router();
const upload = multer();

const clipdropApiKey = process.env.CLIPDROP_API_KEY;

aiFillRouter.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 }
]), async (req, res) => {
    const prompt = req.body.prompt
    const image = req.files?.image?.[0]
    const mask = req.files?.mask?.[0]

    if (!clipdropApiKey) {
        return res.status(500).json({ error: 'ClipDrop API key not configured' });
    }
    if (!prompt || !image || !mask) {
        return res.status(400).json({ error: 'Prompt, image, and mask are required' });
    }

    const form = new FormData()
    form.append(
      'image_file',
      new File([image.buffer], image.originalname, { type: image.mimetype })
    )
    form.append(
      'mask_file',
      new File([mask.buffer], mask.originalname, { type: mask.mimetype })
    )
    form.append('text_prompt', prompt)


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