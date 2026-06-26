import { Router, Response } from 'express';
import { upload } from '../configs/cloudinary';
import { authenticate } from '../middlewares/auth';
import { AuthRequest } from '../types';

const router = Router();

router.post(
  '/',
  authenticate,
  upload.single('image'),
  (req: AuthRequest, res: Response): void => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      const result = req.file as any;
      res.status(200).json({
        success: true,
        data: {
          url: result.path,
          publicId: result.filename,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Upload failed.' });
    }
  }
);

export default router;
