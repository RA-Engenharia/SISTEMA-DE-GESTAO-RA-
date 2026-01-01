import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole, DocumentType } from '@prisma/client';

export const documentRouter = Router();

documentRouter.use(authenticate);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.resolve(env.UPLOAD_DIR);
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// List documents
documentRouter.get('/', async (req, res, next) => {
  try {
    const { projectId, type, search, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    if (type && typeof type === 'string') {
      where.type = type as DocumentType;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, code: true },
          },
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      data: documents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get document by ID
documentRouter.get('/:id', async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!document) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Upload document
documentRouter.post(
  '/',
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400, 'NO_FILE');
      }

      const schema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.nativeEnum(DocumentType).default(DocumentType.OTHER),
        projectId: z.string().uuid().optional(),
      });

      const data = schema.parse(req.body);

      const document = await prisma.document.create({
        data: {
          name: data.name ?? req.file.originalname,
          description: data.description,
          type: data.type,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          projectId: data.projectId,
          uploadedById: req.user!.userId,
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
      });

      // Log activity
      if (data.projectId) {
        await prisma.activityLog.create({
          data: {
            action: 'UPLOAD',
            entity: 'DOCUMENT',
            entityId: document.id,
            userId: req.user!.userId,
            projectId: data.projectId,
            details: { name: document.name, type: document.type },
          },
        });
      }

      res.status(201).json(document);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }
);

// Download document
documentRouter.get('/:id/download', async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch {
      throw new AppError('File not found on server', 404, 'FILE_NOT_FOUND');
    }

    res.download(document.filePath, document.name);
  } catch (error) {
    next(error);
  }
});

// Update document metadata
documentRouter.patch('/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      type: z.nativeEnum(DocumentType).optional(),
    });

    const data = schema.parse(req.body);

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data,
      include: {
        project: {
          select: { id: true, name: true },
        },
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Delete document
documentRouter.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const document = await prisma.document.findUnique({
        where: { id: req.params.id },
      });

      if (!document) {
        throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Delete file from storage
      try {
        await fs.unlink(document.filePath);
      } catch {
        // File might already be deleted
      }

      await prisma.document.delete({ where: { id: req.params.id } });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
