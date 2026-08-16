import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CheckCircle,
  Shield,
  Activity,
  Database,
  LockKeyhole,
  Globe2,
  Menu,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  FileText,
  Upload,
  Trash2,
  Edit3,
  Save,
  LogIn,
  LogOut,
  Download,
} from 'lucide-react';
import './styles.css';
import logo from './assets/logo.png';

const CONTACT_EMAIL = 'caregrid.health@gmail.com';
const CONTACT_PHONE = '+61 421 283 398';
const CONTACT_PHONE_LINK = '+61421283398';
const CONTACT_LOCATION = 'Melbourne VIC, Australia';
const LOCAL_API = 'http://localhost:4000';
const configuredApi = import.meta.env.VITE_API_URL || '';
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalBrowser = ['localhost', '127.0.0.1', '::1'].includes(browserHost);
const API = configuredApi || (isLocalBrowser ? LOCAL_API : '');
const useEmailClientFallback = !API || (!isLocalBrowser && API.includes('localhost'));
const ADMIN_TOKEN_KEY = 'caregrid-admin-token';
const TRAINING_DOCUMENTS_UPDATED = 'caregrid-training-documents-updated';

type ContactFormBody = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

type TrainingDocument = {
  id: string;
  title: string;
  description: string;
  originalName: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  url: string;
};

function openPreparedContactEmail(body: ContactFormBody) {
  const subject = encodeURIComponent('New CareGrid Health Contact Message');
  const message = encodeURIComponent(`Name: ${body.name}\nPhone: ${body.phone || ''}\nEmail: ${body.email || ''}\n\n${body.message}`);
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${message}`;
}

function documentUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return API ? `${API}${url}` : url;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Training', href: '#training' },
    { label: 'Experience', href: '#experience' },
    { label: 'Contact', href: '#contact' },
    { label: 'Admin', href: '#admin' },
  ];

  return (
    <header className="header">
      <a className="brand" href="#home">
        <img src={logo} alt="CareGrid Health" className="brandLogo" />
      </a>
      <button className="menu" onClick={() => setOpen(!open)} aria-label="Open menu">{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'nav open' : 'nav'}>
        {links.map((link) => (
          <a key={link.label} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
        ))}
      </nav>
    </header>
  );
}

function Home() {
  const proofPoints = [
    ['42+', 'years combined experience'],
    ['APAC', 'regional integration focus'],
    ['24/7', 'resilient workflow thinking'],
  ];

  return (
    <section id="home" className="hero section">
      <div className="heroInner">
        <div className="heroText">
          <span className="eyebrow">Digital Health Integration</span>
          <h1>Connecting the Future of Healthcare</h1>
          <p className="heroSlogan">Empowering Digital Health: CareGrid Health Pioneering Seamless Healthcare Integration</p>
          <p className="muted">We help healthcare organizations build smarter, connected, secure, and efficient digital health ecosystems across the world.</p>
          <div className="actions">
            <a className="btn primary" href="#contact">Contact Us</a>
            <a className="btn secondary" href="#services">Explore Services</a>
          </div>
          <div className="heroStats">
            {proofPoints.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="heroVisual" aria-label="CareGrid Health integration capability overview">
          <img src={logo} alt="" />
          <div className="integrationRows">
            <div><Activity aria-hidden="true" /><span>Clinical workflows</span></div>
            <div><Database aria-hidden="true" /><span>Data integration</span></div>
            <div><LockKeyhole aria-hidden="true" /><span>Security aware delivery</span></div>
            <div><Globe2 aria-hidden="true" /><span>APAC implementation support</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="section split">
      <div>
        <h2>About CareGrid Health</h2>
        <p>CareGrid Health is a leading provider of digital health solutions, specializing in integration services. Uniquely positioned to address the rising demand for seamless healthcare integration across the Asia-Pacific region, we enable smarter, connected healthcare systems.</p>
        <p>Our experienced team has 42+ years of combined experience in successfully delivering digital health and integration services in Australia, New Zealand, the Middle East, Europe, and the United States of America.</p>
      </div>
      <div className="cards">
        <div>
          <h3>Mission</h3>
          <p>Enable connected healthcare ecosystems through practical digital health integration.</p>
        </div>
        <div>
          <h3>Vision</h3>
          <p>Become a trusted APAC partner for secure, scalable healthcare interoperability.</p>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    ['Consulting Services', 'At CareGrid Health, we specialize in turning complex digital ecosystems into seamless, reliable workflows. Our consulting services help you maximize efficiency, ensure compliance, and unlock more value from your technology investments.'],
    ['Implementation Services', "At CareGrid Health, we make technology transitions seamless. Whether you're deploying a new solution or upgrading existing platforms, our team ensures smooth implementation with minimal disruption. We manage the process end-to-end - planning, configuring, testing, and validating - so your systems run efficiently from day one. With a focus on scalability, compliance, and long-term performance, we help you stay ahead while keeping patient care at the center."],
    ['Health Checks', "Ensure your systems are performing at their best with CareGrid Health's comprehensive Health Checks. Our experts assess the stability, security, and efficiency of your integration environment, identifying potential risks before they become issues. With actionable insights and tailored recommendations, we help you optimize performance, reduce downtime, and keep your healthcare operations running smoothly."],
  ];

  return (
    <section id="services" className="section">
      <div className="sectionHeader">
        <span className="sectionKicker">What we do</span>
        <h2>Services</h2>
        <p>Practical consulting, implementation, and health-check support for complex healthcare technology environments.</p>
      </div>
      <div className="serviceGrid">
        {items.map(([title, description]) => (
          <article className="service" key={title}>
            <CheckCircle />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Training() {
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);

  useEffect(() => {
    async function loadTrainingDocuments() {
      if (!API) return;
      try {
        const res = await fetch(`${API}/api/training-documents?ts=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Unable to load training documents.');
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch {
        setDocuments([]);
      }
    }

    function refreshWhenTrainingOpens() {
      if (window.location.hash === '#training') loadTrainingDocuments();
    }

    loadTrainingDocuments();
    window.addEventListener(TRAINING_DOCUMENTS_UPDATED, loadTrainingDocuments);
    window.addEventListener('hashchange', refreshWhenTrainingOpens);

    return () => {
      window.removeEventListener(TRAINING_DOCUMENTS_UPDATED, loadTrainingDocuments);
      window.removeEventListener('hashchange', refreshWhenTrainingOpens);
    };
  }, []);

  return (
    <section id="training" className="section trainingSection">
      <div className="sectionHeader">
        <span className="sectionKicker">Resources</span>
        <h2>Training</h2>
      </div>
      <article className="trainingPanel">
        <CheckCircle />
        <div>
          <h3>CGH Healthcare Interoperability Training</h3>
          <p>Practical training focused on healthcare interoperability, integration delivery, and connected digital health workflows for clinical and operational teams.</p>
        </div>
      </article>
      {documents.length > 0 && (
        <div className="documentList">
          {documents.map((document) => (
            <article className="documentCard" key={document.id}>
              <FileText aria-hidden="true" />
              <div>
                <h3>{document.title}</h3>
                {document.description && <p>{document.description}</p>}
                <span>{document.originalName} - {formatFileSize(document.size)}</span>
              </div>
              <a className="iconAction" href={documentUrl(document.url)} target="_blank" rel="noreferrer" aria-label={`Download ${document.title}`} title="Download">
                <Download aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Admin() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [replacementFile, setReplacementFile] = useState<File | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!storedToken) return;
    setToken(storedToken);
    loadDocuments(storedToken);
  }, []);

  async function adminFetch(path: string, options: RequestInit = {}, authToken = token) {
    if (!API) throw new Error('Backend API is not configured.');
    const headers = new Headers(options.headers);
    if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Request failed. Please try again.');
    return data;
  }

  async function loadDocuments(authToken = token) {
    try {
      const data = await adminFetch('/api/admin/training-documents', {}, authToken);
      setDocuments(data.documents || []);
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to load documents.' });
    }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'info', message: 'Signing in...' });
    try {
      const data = await adminFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username, password }),
      }, '');
      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword('');
      setStatus({ type: 'success', message: 'Signed in.' });
      await loadDocuments(data.token);
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Login failed.' });
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    setStatus({ type: 'info', message: 'Uploading document...' });
    try {
      await adminFetch('/api/admin/training-documents', { method: 'POST', body: formData });
      form.reset();
      setStatus({ type: 'success', message: 'Document uploaded.' });
      await loadDocuments();
      window.dispatchEvent(new Event(TRAINING_DOCUMENTS_UPDATED));
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      setLoading(false);
    }
  }

  async function saveDocument(id: string) {
    setLoading(true);
    setStatus({ type: 'info', message: 'Saving document...' });
    try {
      await adminFetch(`/api/admin/training-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      if (replacementFile) {
        const formData = new FormData();
        formData.append('file', replacementFile);
        await adminFetch(`/api/admin/training-documents/${id}/file`, { method: 'PUT', body: formData });
      }
      setEditingId('');
      setReplacementFile(null);
      setStatus({ type: 'success', message: 'Document updated.' });
      await loadDocuments();
      window.dispatchEvent(new Event(TRAINING_DOCUMENTS_UPDATED));
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Update failed.' });
    } finally {
      setLoading(false);
    }
  }

  async function deleteDocument(id: string) {
    if (!window.confirm('Delete this document?')) return;
    setLoading(true);
    setStatus({ type: 'info', message: 'Deleting document...' });
    try {
      await adminFetch(`/api/admin/training-documents/${id}`, { method: 'DELETE' });
      setStatus({ type: 'success', message: 'Document deleted.' });
      await loadDocuments();
      window.dispatchEvent(new Event(TRAINING_DOCUMENTS_UPDATED));
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  }

  function startEditing(document: TrainingDocument) {
    setEditingId(document.id);
    setEditTitle(document.title);
    setEditDescription(document.description);
    setReplacementFile(null);
  }

  function logout() {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
    setDocuments([]);
    setStatus({ type: 'success', message: 'Signed out.' });
  }

  const totalDocumentSize = documents.reduce((total, document) => total + document.size, 0);

  return (
    <section id="admin" className="section adminSection">
      <div className="adminShell">
        <div className="adminHero">
          <div>
            <span className="adminEyebrow">Secure admin console</span>
            <h2>Content Manager</h2>
            <p>Manage CareGrid Health training documents from one private workspace.</p>
          </div>
          {token && (
            <div className="adminSession">
              <span>Signed in</span>
              <strong>{username}</strong>
              <button className="btn secondary compactButton" type="button" onClick={logout}><LogOut aria-hidden="true" />Logout</button>
            </div>
          )}
        </div>

        {status.message && <p className={`formStatus adminStatus ${status.type}`} role="status">{status.message}</p>}

        {!token ? (
          <div className="adminLoginLayout">
            <form className="form adminLogin adminPanel" onSubmit={login}>
              <div className="panelHeader">
                <Shield aria-hidden="true" />
                <div>
                  <h3>Admin Login</h3>
                  <p>Private access for document management.</p>
                </div>
              </div>
              <div className="formField">
                <label htmlFor="admin-username"><User aria-hidden="true" />Username</label>
                <input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              </div>
              <div className="formField">
                <label htmlFor="admin-password"><Shield aria-hidden="true" />Password</label>
                <input id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" />
              </div>
              <button className="btn primary formSubmit" type="submit" disabled={loading}><LogIn aria-hidden="true" /><span>Login</span></button>
            </form>
            <aside className="adminSidePanel">
              <FileText aria-hidden="true" />
              <h3>Training Library</h3>
              <p>Uploaded files appear in the public Training section for visitors.</p>
            </aside>
          </div>
        ) : (
          <div className="adminWorkspace">
            <div className="adminStats">
              <div><span>Documents</span><strong>{documents.length}</strong></div>
              <div><span>Storage</span><strong>{formatFileSize(totalDocumentSize)}</strong></div>
              <div><span>Status</span><strong>Active</strong></div>
            </div>

            <div className="adminContentGrid">
              <form className="form uploadForm adminPanel" onSubmit={uploadDocument}>
                <div className="panelHeader">
                  <Upload aria-hidden="true" />
                  <div>
                    <h3>Upload Document</h3>
                    <p>Add a file to the public Training library.</p>
                  </div>
                </div>
                <div className="formField">
                  <label htmlFor="document-title"><FileText aria-hidden="true" />Document title</label>
                  <input id="document-title" name="title" placeholder="Healthcare Interoperability Training" required />
                </div>
                <div className="formField">
                  <label htmlFor="document-description"><MessageSquare aria-hidden="true" />Description</label>
                  <textarea id="document-description" name="description" rows={4} placeholder="Short public description" />
                </div>
                <div className="formField">
                  <label htmlFor="document-file"><Upload aria-hidden="true" />Document file</label>
                  <input id="document-file" name="file" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt" required />
                </div>
                <button className="btn primary formSubmit" type="submit" disabled={loading}><Upload aria-hidden="true" /><span>Upload Document</span></button>
              </form>

              <section className="adminPanel documentManager">
                <div className="adminToolbar">
                  <div>
                    <h3>Training Documents</h3>
                    <p>{documents.length === 1 ? '1 document published' : `${documents.length} documents published`}</p>
                  </div>
                </div>
                <div className="adminDocumentList">
                  {documents.map((document) => (
                    <article className="adminDocument" key={document.id}>
                      {editingId === document.id ? (
                        <div className="editDocumentForm">
                          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} aria-label="Document title" />
                          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} aria-label="Document description" />
                          <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={(e) => setReplacementFile(e.target.files?.[0] || null)} aria-label="Replacement document file" />
                          <div className="documentActions">
                            <button className="iconAction" type="button" onClick={() => saveDocument(document.id)} disabled={loading} title="Save"><Save aria-hidden="true" /></button>
                            <button className="iconAction" type="button" onClick={() => { setEditingId(''); setReplacementFile(null); }} title="Cancel"><X aria-hidden="true" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <FileText aria-hidden="true" />
                          <div>
                            <h3>{document.title}</h3>
                            {document.description && <p>{document.description}</p>}
                            <span>{document.originalName} - {formatFileSize(document.size)}</span>
                          </div>
                          <div className="documentActions">
                            <a className="iconAction" href={documentUrl(document.url)} target="_blank" rel="noreferrer" title="Download"><Download aria-hidden="true" /></a>
                            <button className="iconAction" type="button" onClick={() => startEditing(document)} title="Edit"><Edit3 aria-hidden="true" /></button>
                            <button className="iconAction danger" type="button" onClick={() => deleteDocument(document.id)} title="Delete"><Trash2 aria-hidden="true" /></button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                  {documents.length === 0 && (
                    <div className="emptyDocuments">
                      <FileText aria-hidden="true" />
                      <p>No training documents uploaded yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Experience() {
  const experienceItems = [
    'Assessment Management',
    'Billing',
    'Cardiology',
    'Care Management',
    'Clinical Decision Support',
    'Dental',
    'Dictation/Transcription',
    'Emergency Department',
    'EMR/EHR',
    'Endoscopy',
    'Financial',
    'Food Services',
    'Maternity/Obs',
    'Medical Credentialing',
    'Medication Management/Dispensation',
    'Oncology',
    'Pathology',
    'Patient Administration',
    'Pharmacy',
    'Practice Management',
    'Radiology',
    'Risk Management',
    'Secure Messaging',
    'Australian Government PRODA B2B',
    'Immunisation Register',
    'Robotic Process Automation',
  ];

  return (
    <section id="experience" className="section experienceSection">
      <div className="sectionIntro sectionHeader">
        <span className="sectionKicker">Capability map</span>
        <h2>Experience</h2>
        <p>Discover our Integration experience:</p>
        <p>Integration experience with:</p>
      </div>
      <ul className="experienceGrid">
        {experienceItems.map((item) => (
          <li key={item}><CheckCircle aria-hidden="true" /><span>{item}</span></li>
        ))}
      </ul>
    </section>
  );
}

function Contact() {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#contact') return;
    setStatus({ type: '', message: '' });
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const body = {
      name: String(form.get('name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      email: String(form.get('email') || '').trim(),
      message: String(form.get('message') || '').trim(),
    };

    if (!body.name || !body.message) {
      e.preventDefault();
      setStatus({ type: 'error', message: 'Please enter your name and message.' });
      return;
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      e.preventDefault();
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (useEmailClientFallback) {
      e.preventDefault();
      openPreparedContactEmail(body);
      setStatus({ type: 'success', message: 'Your email app has been opened with a prepared message. Please press send to complete.' });
      return;
    }

    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: 'info', message: 'Sending your message...' });

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...body, email: body.email || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 502 || res.status === 503) {
          openPreparedContactEmail(body);
          setStatus({ type: 'success', message: 'Your email app has been opened with a prepared message. Please press send to complete.' });
          return;
        }
        throw new Error(data?.error || 'Submission failed. Please try again.');
      }
      setStatus({ type: 'success', message: 'Your message has been sent. Thank you.' });
      formElement.reset();
    } catch (error) {
      if (error instanceof TypeError) {
        openPreparedContactEmail(body);
        setStatus({ type: 'success', message: 'The contact service is not reachable, so your email app has been opened with a prepared message. Please press send to complete.' });
        return;
      }
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="section split contactSection">
      <div className="contactDetails">
        <h2>Contact</h2>
        <div className="contactList">
          <a className="contactItem" href={`tel:${CONTACT_PHONE_LINK}`}>
            <Phone aria-hidden="true" />
            <span>{CONTACT_PHONE}</span>
          </a>
          <a className="contactItem" href={`mailto:${CONTACT_EMAIL}`}>
            <Mail aria-hidden="true" />
            <span>{CONTACT_EMAIL}</span>
          </a>
          <div className="contactItem">
            <MapPin aria-hidden="true" />
            <span>{CONTACT_LOCATION}</span>
          </div>
        </div>
        <div className="mapBlock">
          <h3>Find our location</h3>
          <div className="mapFrame">
            <iframe
              title="Map showing Melbourne VIC Australia"
              src="https://www.google.com/maps?q=Melbourne%20VIC%20Australia&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="form contactForm">
        <div className="formField">
          <label htmlFor="contact-name"><User aria-hidden="true" />Name</label>
          <input id="contact-name" name="name" autoComplete="name" placeholder="Your name" />
        </div>
        <div className="formField">
          <label htmlFor="contact-phone"><Phone aria-hidden="true" />Phone</label>
          <input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={CONTACT_PHONE} />
        </div>
        <div className="formField">
          <label htmlFor="contact-email"><Mail aria-hidden="true" />Email</label>
          <input id="contact-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="formField">
          <label htmlFor="contact-message"><MessageSquare aria-hidden="true" />Message</label>
          <textarea id="contact-message" name="message" rows={7} placeholder="How can we help?" />
        </div>
        {status.message && <p className={`formStatus ${status.type}`} role="status" aria-live="polite">{status.message}</p>}
        <button className="btn primary formSubmit" type="submit" disabled={submitting}>
          <Send aria-hidden="true" />
          <span>{submitting ? 'Sending...' : 'Submit'}</span>
        </button>
      </form>
    </section>
  );
}

function App() {
  return (
    <>
      <Header />
      <main>
        <Home />
        <About />
        <Services />
        <Training />
        <Experience />
        <Contact />
        <Admin />
      </main>
      <footer>&copy; 2026 CareGrid Health. Digital health integration services in Australia, APAC and North America.</footer>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
