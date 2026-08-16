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
const adminUsername = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const adminTokenSecret = process.env.ADMIN_SESSION_SECRET || adminPassword;
const ollamaHost = (process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '');
const ollamaModel = process.env.OLLAMA_MODEL || 'gemma4';
const configuredOllamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
const ollamaTimeoutMs = Number.isFinite(configuredOllamaTimeoutMs) && configuredOllamaTimeoutMs > 0 ? configuredOllamaTimeoutMs : 60000;

type TrainingDocument = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type AdminTokenPayload = {
  sub: string;
  exp: number;
};

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '1mb' }));

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
  storage: multer.memoryStorage(),
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

app.get('/api/training-documents/:id/download', async (req, res, next) => {
  try {
    const documentId = routeParam(req.params.id);
    const document = await prisma.trainingDocument.findUnique({ where: { id: documentId } });
    if (!document) return res.status(404).json({ error: 'Document not found.' });

    const safeName = document.originalName.replace(/["\r\n]/g, '');
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(document.size));
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.send(Buffer.from(document.content));
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
    if (!parsed.success) return res.status(400).json({ error: 'Please provide a document title.', details: parsed.error.flatten() });
    if (!req.file) return res.status(400).json({ error: 'Please choose a document to upload.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const document = await prisma.trainingDocument.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        fileName: `${Date.now()}-${crypto.randomUUID()}${ext}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content: req.file.buffer,
      },
    });
    res.status(201).json({ document: toPublicDocument(document) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/training-documents/:id', requireAdmin, async (req, res, next) => {
  try {
    const documentId = routeParam(req.params.id);
    const parsed = documentMetadataSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please provide a document title.', details: parsed.error.flatten() });

    const exists = await prisma.trainingDocument.findUnique({ where: { id: documentId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Document not found.' });

    const document = await prisma.trainingDocument.update({
      where: { id: documentId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
      },
    });
    res.json({ document: toPublicDocument(document) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/training-documents/:id/file', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const documentId = routeParam(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'Please choose a replacement document.' });

    const exists = await prisma.trainingDocument.findUnique({ where: { id: documentId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Document not found.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const document = await prisma.trainingDocument.update({
      where: { id: documentId },
      data: {
        fileName: `${Date.now()}-${crypto.randomUUID()}${ext}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content: req.file.buffer,
      },
    });
    res.json({ document: toPublicDocument(document) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/training-documents/:id', requireAdmin, async (req, res, next) => {
  try {
    const documentId = routeParam(req.params.id);
    const document = await prisma.trainingDocument.findUnique({ where: { id: documentId }, select: { id: true } });
    if (!document) return res.status(404).json({ error: 'Document not found.' });

    await prisma.trainingDocument.delete({ where: { id: documentId } });
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

function routeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

async function readTrainingDocuments(): Promise<TrainingDocument[]> {
  return prisma.trainingDocument.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

function toPublicDocument(document: TrainingDocument) {
  return {
    ...document,
    createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt,
    updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : document.updatedAt,
    url: `/api/training-documents/${document.id}/download`,
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
  let provider = 'guided-fallback';
  let model = '';

  if (ollamaHost) {
    try {
      reply = await getOllamaReply(system, message);
      provider = 'ollama';
      model = ollamaModel;
    } catch (error) {
      console.error('Ollama chat failed.', error);
      return res.status(503).json({ error: 'AI Consultant is not reachable right now. Please check the Ollama host and model configuration.' });
    }
  } else if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: message }],
      temperature: 0.4,
    });
    reply = completion.choices[0]?.message?.content || reply;
    provider = 'openai';
    model = 'gpt-4o-mini';
  }

  const session = await prisma.aiChatSession.create({ data: { visitorId: req.ip } });
  await prisma.aiChatMessage.createMany({
    data: [
      { sessionId: session.id, role: 'user', message },
      { sessionId: session.id, role: 'assistant', message: reply },
    ],
  });

  res.json({ reply, sessionId: session.id, provider, model });
});

async function getOllamaReply(system: string, message: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ollamaTimeoutMs);
  try {
    const response = await fetch(`${ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: message },
        ],
        stream: false,
        think: false,
        options: {
          temperature: 0.4,
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null) as { message?: { content?: string }, error?: string } | null;
    if (!response.ok) throw new Error(data?.error || `Ollama returned ${response.status}`);
    const content = data?.message?.content?.trim();
    if (!content) throw new Error('Ollama returned an empty response.');
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`CareGrid Health API running on port ${port}`));
