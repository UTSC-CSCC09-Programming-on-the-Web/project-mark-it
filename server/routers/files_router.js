import { File } from "../models/file.js";
import { Router } from "express";
import multer from "multer";
import path from "path";

export const filesRouter = Router();

//only allow images for now
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

filesRouter.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const file = File.build({
        file: req.file,
        UserId: req.user.id, // default sequelize foreign key
    });
    try {
        await file.save();
    } catch (error) {
        return res.status(422).json({ error: "Failed to save file" });
    }
    return res.json(file);
});