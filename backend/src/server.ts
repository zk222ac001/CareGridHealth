import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '1mb' }));

const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email(),
  message: z.string().min(10),
});

const serviceInquirySchema = z.object({
  organizationName: z.string().optional(),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  serviceType: z.string().min(2),
  requirements: z.string().min(10),
});

async function sendNotification(subject: string, text: string) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return;
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL || 'caregrid.health@gmail.com',
    subject,
    text,
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'CareGrid Health API' }));

app.post('/api/contact', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const message = await prisma.contactMessage.create({ data: parsed.data });
  await sendNotification('New CareGrid Health Contact Message', `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\nPhone: ${parsed.data.phone || ''}\n\n${parsed.data.message}`);
  res.status(201).json({ message });
});

app.post('/api/service-inquiries', async (req, res) => {
  const parsed = serviceInquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const inquiry = await prisma.serviceInquiry.create({ data: parsed.data });
  res.status(201).json({ inquiry });
});

app.get('/api/admin/contact-messages', async (_req, res) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ messages });
});

app.get('/api/admin/service-inquiries', async (_req, res) => {
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
