import { File } from '../models/file.js'
import { User } from '../models/user.js'
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { Op } from 'sequelize'
import fs from 'fs'

export const filesRouter = Router()

//only allow images for now
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

filesRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const file = File.build({
    file: req.file,
    UserId: req.user.id, // default sequelize foreign key
  })
  try {
    await file.save()
  } catch (error) {
    return res.status(422).json({ error: 'Failed to save file' })
  }
  return res.json(file)
})

filesRouter.get('/', async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    // Find files where user is owner
    const ownedFiles = await File.findAll({
      where: { UserId: req.user.id },
    })
    // Find files shared with user (but not owned)
    const sharedFiles = await File.findAll({
      include: [
        {
          model: User,
          where: { id: req.user.id },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      where: { UserId: { [Op.ne]: req.user.id } },
    })
    // Merge and deduplicate by file id
    const allFiles = [...ownedFiles, ...sharedFiles]
    const uniqueFiles = []
    const seen = new Set()
    for (const file of allFiles) {
      if (!seen.has(file.id)) {
        uniqueFiles.push(file)
        seen.add(file.id)
      }
    }
    console.log('returning unique files:', uniqueFiles)
    res.json(uniqueFiles)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' })
  }
})

filesRouter.get('/my', async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const files = await File.findAll({ where: { UserId: req.user.id } })
    res.json(files)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' })
  }
})

filesRouter.get('/download/:id', async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const file = await File.findByPk(req.params.id, {
    include: [{ model: User }],
  })
  if (!file) {
    return res.status(404).json({ error: 'File not found' })
  }
  // Fetch the User instance for sharing check
  const userInstance = await User.findByPk(req.user.id)
  const isOwner = file.UserId === req.user.id
  const isShared = userInstance ? await file.hasUser(userInstance) : false
  if (!isOwner && !isShared) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const filePath = path.resolve('uploads', file.file.filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' })
  }
  res.download(filePath, file.file.originalname)
})

filesRouter.post('/share/:id', async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { googleId } = req.body
  if (!googleId) {
    return res.status(400).json({ error: 'Missing googleId' })
  }
  const file = await File.findByPk(req.params.id)
  if (!file) {
    return res.status(404).json({ error: 'File not found' })
  }
  // Only allow sharing if the current user owns or has access to the file
  const isOwner = file.UserId === req.user.id
  const isShared = await file.hasUser(req.user)
  if (!isOwner && !isShared) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const userToShare = await User.findOne({ where: { googleId } })
  if (!userToShare) {
    return res.status(404).json({ error: 'User not found' })
  }
  await file.addUser(userToShare) // Share the file
  res.json({ success: true })
})
