import { TempFile } from '../models/tempfile.js';
import { Router } from 'express';
import 'dotenv/config';
import { FormData, File } from 'formdata-node';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path'
import fs from 'fs'
import { requireSubscription } from '../middleware/auth.js';

const axios = require('axios');
const backendUrl = "https://localhost:3001"; // replace later after deployment

export const aiFillRouter = Router();
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only image files are allowed!'))
  },
})

const clipdropApiKey = process.env.CLIPDROP_API_KEY;
const photaiApiKey = process.env.PHOTAI_API_KEY;

aiFillRouter.post('/generative-fill', requireSubscription, upload.fields([
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

aiFillRouter.post('/reimagine', requireSubscription, upload.fields([
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    const image = req.files?.image?.[0]

    if (!clipdropApiKey) {
        return res.status(500).json({ error: 'ClipDrop API key not configured' });
    }
    if (!image) {
        return res.status(400).json({ error: 'Image is required' });
    }

    const form = new FormData()
    form.append(
      'image_file',
      new File([image.buffer], image.originalname, { type: image.mimetype })
    )


    fetch('https://clipdrop-api.co/reimagine/v1/reimagine', {
        method: 'POST',
        headers: {
            'x-api-key': clipdropApiKey,
        },
        body: form,
    })
    .then(response => {
        console.log('ClipDrop response:', response.status, response.statusText)
        return response.arrayBuffer()
    })
    .then(buffer => {
        // buffer here is a binary representation of the returned image
        res.set('Content-Type', 'image/jpeg'); // Response is always JPEG
        res.status(200).send(Buffer.from(buffer));
    })
    .catch(err => {
        res.status(500).json({ error: err.message });
    });
});

aiFillRouter.post('/generative-fill-v2', requireSubscription, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 }
]), async (req, res) => {
    const prompt = req.body.prompt
    const image = req.files?.image?.[0]
    const mask = req.files?.mask?.[0]

    if (!photaiApiKey) {
        return res.status(500).json({ error: 'PhotAI API key not configured' });
    }
    if (!prompt || !image || !mask) {
        return res.status(400).json({ error: 'Prompt, image, and mask are required' });
    }

    const image_file = TempFile.build({
        file: req.files?.image?.[0],
    })
    const mask_file = TempFile.build({
        file: req.files?.mask?.[0],
    })
    try {
        await image_file.save()
        await mask_file.save()
    }
    catch (error) {
        return res.status(422).json({ error: 'Failed to save files' })
    }

    const url =
        "https://prodapi.phot.ai/external/api/v3/user_activity/object-replacer";
    const headers = {
        "x-api-key": photaiApiKey,
        "Content-Type": "application/json",
    };
    const data = {
        source_url: `${backendUrl}/api/ai_fill/tempfile/${image_file.id}`,
        mask_image: `${backendUrl}/api/ai_fill/tempfile/${mask_file.id}`,
        prompt: prompt
    };

    axios
    .post(url, data, { headers })
    .then((response) => {
        const orderId = response.data.order_id;
        console.log('Order ID:', orderId);

        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://prodapi.phot.ai/external/api/v1/user_activity/order-status?order_id=${orderId}`,
            headers: {
                "x-api-key": photaiApiKey
            }
        };
        const cleanupFiles = async () => {
            // Delete image file
            try {
                const imageDbFile = await TempFile.findByPk(image_file.id)
                if (imageDbFile) {
                    const imagePath = path.resolve('uploads', imageDbFile.file.filename)
                    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath)
                    await imageDbFile.destroy()
                }
            } catch (e) { console.error('Failed to delete image file', e) }
            // Delete mask file
            try {
                const maskDbFile = await TempFile.findByPk(mask_file.id)
                if (maskDbFile) {
                    const maskPath = path.resolve('uploads', maskDbFile.file.filename)
                    if (fs.existsSync(maskPath)) fs.unlinkSync(maskPath)
                    await maskDbFile.destroy()
                }
            } catch (e) { console.error('Failed to delete mask file', e) }
        }

        const intervalId = setInterval(() => {
            axios(config)
            .then(function (response) {
                console.log(JSON.stringify(response.data));
                if (response.data.order_status === 'order_complete') {
                    clearInterval(intervalId);
                    cleanupFiles().then(() => {
                        res.status(200).json({ imageUrl: response.data.output_urls });
                    });
                }
            })
            .catch(function (error) {
                clearInterval(intervalId);
                cleanupFiles().then(() => {
                    res.status(500).json({ error: error.message });
                });
            });
        }
        , 5000); // Check every 5 seconds as per API documentation
    })
    .catch((error) => {
        // Clean up files on initial error
        const cleanupFiles = async () => {
            try {
                const imageDbFile = await TempFile.findByPk(image_file.id)
                if (imageDbFile) {
                    const imagePath = path.resolve('uploads', imageDbFile.file.filename)
                    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath)
                    await imageDbFile.destroy()
                }
            } catch (e) { console.error('Failed to delete image file', e) }
            try {
                const maskDbFile = await TempFile.findByPk(mask_file.id)
                if (maskDbFile) {
                    const maskPath = path.resolve('uploads', maskDbFile.file.filename)
                    if (fs.existsSync(maskPath)) fs.unlinkSync(maskPath)
                    await maskDbFile.destroy()
                }
            } catch (e) { console.error('Failed to delete mask file', e) }
        }
        cleanupFiles().then(() => {
            res.status(500).json({ error: error.message });
        });
    });
});

filesRouter.post('/tempfile/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  const file = TempFile.build({
    file: req.file,
  })
  try {
    await file.save()
  } catch (error) {
    return res.status(422).json({ error: 'Failed to save file' })
  }
  return res.json(file)
})

aiFillRouter.get('/tempfile/:id', async (req, res) => {
  const file = await TempFile.findByPk(req.params.id, {})
  if (!file) {
    return res.status(404).json({ error: 'File not found' })
  }
  const filePath = path.resolve('uploads', file.file.filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' })
  }
  // Set the correct Content-Type for the image
  res.type(file.file.mimetype || 'application/octet-stream')
  res.sendFile(filePath)
})

filesRouter.delete('/tempfile/:id', async (req, res) => {
  const file = await TempFile.findByPk(req.params.id)
  if (!file) {
    return res.status(404).json({ error: 'File not found' })
  }
  const filePath = path.resolve('uploads', file.file.filename)
  try {
    fs.unlinkSync(filePath) // Delete the file from disk
    await file.destroy() // Delete the record from the database
    res.status(204).send() // No content
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' })
  }
});