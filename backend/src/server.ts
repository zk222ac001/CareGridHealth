import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 4000);
const contactRecipientEmail = 'caregrid.health@gmail.com';
const uploadRoot = path.resolve(__dirname, '../uploads');
const trainingUploadDir = path.join(uploadRoot, 'training-documents');
const trainingDocumentsFile = path.join(trainingUploadDir, 'documents.json');
const adminUsername = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const adminTokenSecret = process.env.ADMIN_SESSION_SECRET || adminPassword;

type TrainingDocument = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

type AdminTokenPayload = {
  sub: string;
  exp: number;
};

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads/training-documents', express.static(trainingUploadDir));

const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().min(1),
});

const serviceInquirySchema = z.object({
  organizationName: z.string().optional(),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  serviceType: z.string().min(2),
  requirements: z.string().min(10),
});

const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const documentMetadataSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional().default(''),
});

const upload = multer({
  storage: multer.diskStorage({
    async destination(_req, _file, cb) {
      try {
        await fs.mkdir(trainingUploadDir, { recursive: true });
        cb(null, trainingUploadDir);
      } catch (error) {
        cb(error as Error, trainingUploadDir);
      }
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowedExts = new Set(['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt']);
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.has(ext)) return cb(new Error('Unsupported file type.'));
    cb(null, true);
  },
});

async function sendNotification(subject: string, text: string) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return false;
  const mailPort = Number(process.env.MAIL_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: mailPort,
    secure: mailPort === 465,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: contactRecipientEmail,
    subject,
    text,
  });
  return true;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'CareGrid Health API' }));

app.get('/api/training-documents', async (_req, res, next) => {
  try {
    const documents = await readTrainingDocuments();
    res.json({ documents: documents.map(toPublicDocument) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/login', (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Username and password are required.' });
  if (!adminPassword) return res.status(503).json({ error: 'Admin login is not configured. Set ADMIN_PASSWORD in the backend environment.' });
  if (parsed.data.username !== adminUsername || parsed.data.password !== adminPassword) return res.status(401).json({ error: 'Invalid admin login.' });

  const token = signToken({ sub: adminUsername, exp: Date.now() + 8 * 60 * 60 * 1000 });
  res.json({ token, username: adminUsername });
});

app.get('/api/admin/training-documents', requireAdmin, async (_req, res, next) => {
  try {
    const documents = await readTrainingDocuments();
    res.json({ documents: documents.map(toPublicDocument) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/training-documents', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const parsed = documentMetadataSchema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file) await fs.unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({ error: 'Please provide a document title.', details: parsed.error.flatten() });
    }
    if (!req.file) return res.status(400).json({ error: 'Please choose a document to upload.' });

    const now = new Date().toISOString();
    const document: TrainingDocument = {
      id: crypto.randomUUID(),
      title: parsed.data.title,
      description: parsed.data.description,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      createdAt: now,
      updatedAt: now,
    };
    const documents = await readTrainingDocuments();
    documents.unshift(document);
    await writeTrainingDocuments(documents);
    res.status(201).json({ document: toPublicDocument(document) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/training-documents/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = documentMetadataSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please provide a document title.', details: parsed.error.flatten() });

    const documents = await readTrainingDocuments();
    const index = documents.findIndex((document) => document.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Document not found.' });

    documents[index] = {
      ...documents[index],
      title: parsed.data.title,
      description: parsed.data.description,
      updatedAt: new Date().toISOString(),
    };
    await writeTrainingDocuments(documents);
    res.json({ document: toPublicDocument(documents[index]) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/training-documents/:id/file', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Please choose a replacement document.' });

    const documents = await readTrainingDocuments();
    const index = documents.findIndex((document) => document.id === req.params.id);
    if (index === -1) {
      await fs.unlink(req.file.path).catch(() => undefined);
      return res.status(404).json({ error: 'Document not found.' });
    }

    const oldFileName = documents[index].fileName;
    documents[index] = {
      ...documents[index],
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      updatedAt: new Date().toISOString(),
    };
    await writeTrainingDocuments(documents);
    await fs.unlink(path.join(trainingUploadDir, oldFileName)).catch(() => undefined);
    res.json({ document: toPublicDocument(documents[index]) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/training-documents/:id', requireAdmin, async (req, res, next) => {
  try {
    const documents = await readTrainingDocuments();
    const document = documents.find((item) => item.id === req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found.' });

    await writeTrainingDocuments(documents.filter((item) => item.id !== req.params.id));
    await fs.unlink(path.join(trainingUploadDir, document.fileName)).catch(() => undefined);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/contact', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the form and try again.', details: parsed.error.flatten() });

  let sent = false;
  try {
    sent = await sendNotification('New CareGrid Health Contact Message', `Name: ${parsed.data.name}\nPhone: ${parsed.data.phone || ''}\nEmail: ${parsed.data.email || ''}\n\n${parsed.data.message}`);
  } catch (error) {
    console.error('Contact email delivery failed.', error);
    return res.status(502).json({ error: 'We could not send your message right now. Please email caregrid.health@gmail.com directly.' });
  }

  if (!sent) return res.status(503).json({ error: 'Email delivery is not configured.' });

  let message = null;
  try {
    message = await prisma.contactMessage.create({ data: { ...parsed.data, email: parsed.data.email || '' } });
  } catch (error) {
    console.warn('Contact email sent, but database save failed.', error);
  }

  res.status(201).json({ message, sent: true });
});

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function signToken(payload: AdminTokenPayload) {
  if (!adminTokenSecret) throw new Error('Admin session secret is not configured.');
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', adminTokenSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token: string) {
  if (!adminTokenSecret) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', adminTokenSecret).update(body).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminTokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  if (!verifyToken(token)) return res.status(401).json({ error: 'Admin login required.' });
  next();
}

async function readTrainingDocuments(): Promise<TrainingDocument[]> {
  try {
    const content = await fs.readFile(trainingDocumentsFile, 'utf8');
    return JSON.parse(content) as TrainingDocument[];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw error;
  }
}

async function writeTrainingDocuments(documents: TrainingDocument[]) {
  await fs.mkdir(trainingUploadDir, { recursive: true });
  await fs.writeFile(trainingDocumentsFile, JSON.stringify(documents, null, 2));
}

function toPublicDocument(document: TrainingDocument) {
  return {
    ...document,
    url: `/uploads/training-documents/${document.fileName}`,
  };
}

app.post('/api/service-inquiries', async (req, res) => {
  const parsed = serviceInquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const inquiry = await prisma.serviceInquiry.create({ data: parsed.data });
  res.status(201).json({ inquiry });
});

app.get('/api/admin/contact-messages', requireAdmin, async (_req, res) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ messages });
});

app.get('/api/admin/service-inquiries', requireAdmin, async (_req, res) => {
  const inquiries = await prisma.serviceInquiry.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ inquiries });
});

app.post('/api/ai/chat', async (req, res) => {
  const message = String(req.body?.message || '').slice(0, 2000);
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const system = `You are CareGrid Health's AI Digital Health Integration Consultant. CareGrid Health is based in Melbourne VIC, Australia and provides consulting services, implementation services, and health checks for digital health integration across APAC. You may discuss healthcare interoperability, HL7, FHIR, integration architecture, system implementation, health checks, compliance-aware workflows, and project scoping. Never provide medical diagnosis, treatment, prescribing, or emergency advice. Encourage users to contact CareGrid Health at caregrid.health@gmail.com or +61 421 283 398 for tailored consultation. Ask useful qualification questions such as organization type, systems involved, integration challenge, timeline, and preferred contact method.`;

  let reply = 'Thank you for your question. CareGrid Health can help with digital health integration strategy, implementation, and system health checks. For a tailored recommendation, please share your organization type, current systems, integration challenge, timeline, and preferred contact method.';

  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: message }],
      temperature: 0.4,
    });
    reply = completion.choices[0]?.message?.content || reply;
  }

  const session = await prisma.aiChatSession.create({ data: { visitorId: req.ip } });
  await prisma.aiChatMessage.createMany({
    data: [
      { sessionId: session.id, role: 'user', message },
      { sessionId: session.id, role: 'assistant', message: reply },
    ],
  });

  res.json({ reply, sessionId: session.id });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`CareGrid Health API running on port ${port}`));
