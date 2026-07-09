import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, Shield, Menu, X, User, Phone, MessageSquare, Send } from 'lucide-react';
import './styles.css';
import logo from './assets/logo.png';

const CONTACT_EMAIL = 'caregrid.health@gmail.com';
const LOCAL_API = 'http://localhost:4000';
const configuredApi = import.meta.env.VITE_API_URL || '';
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalBrowser = ['localhost', '127.0.0.1', '::1'].includes(browserHost);
const API = configuredApi || (isLocalBrowser ? LOCAL_API : '');
const useEmailClientFallback = !API || (!isLocalBrowser && API.includes('localhost'));

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Contact', href: '#contact' },
  ];
  return <header className="header">
    <a className="brand" href="#home"><img src={logo} alt="CareGrid Health" className="brandLogo" /></a>
    <button className="menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? 'nav open' : 'nav'}>{links.map(l => <a key={l.label} href={l.href} onClick={()=>setOpen(false)}>{l.label}</a>)}</nav>
  </header>
}

function Home() {
  return <section id="home" className="hero section">
    <div className="heroText">
      <span className="eyebrow">Digital Health Integration</span>
      <h1>Connecting the Future of Healthcare</h1>
      <p>Empowering Digital Health: CareGrid Health Pioneering Seamless Healthcare Integration</p>
      <p className="muted">We help healthcare organizations build smarter, connected, secure, and efficient digital health ecosystems across the world.</p>
      <div className="actions"><a className="btn primary" href="#contact">Contact Us</a><a className="btn secondary" href="#services">Explore Services</a></div>
    </div>
    <div className="heroCard"><Shield/><h3>Secure Healthcare Integration</h3><p>Reliable workflows, compliance-aware delivery, and scalable technology foundations.</p></div>
  </section>
}

function About() {
  return <section id="about" className="section split"><div><h2>About CareGrid Health</h2><p>CareGrid Health is a leading provider of digital health solutions, specializing in integration services. We address the rising demand for seamless healthcare integration across the Asia-Pacific region.</p><p>Our experienced team has 42+ years of combined experience in successfully delivering digital health and integration services in Australia, New Zealand, the Middle East, Europe, and the United States of America.</p></div><div className="cards"><div><h3>Mission</h3><p>Enable connected healthcare ecosystems through practical digital health integration.</p></div><div><h3>Vision</h3><p>Become a trusted APAC partner for secure, scalable healthcare interoperability.</p></div></div></section>
}

function Services() {
  const items = [
    ['Consulting Services','Turn complex digital ecosystems into seamless, reliable workflows. Improve efficiency, compliance, and value from technology investments.'],
    ['Implementation Services','Plan, configure, test, validate, and deploy healthcare platforms with minimal disruption and long-term scalability.'],
    ['Health Checks','Assess stability, security, and efficiency of integration environments, identifying risks before they become issues.']
  ];
  return <section id="services" className="section"><h2>Services</h2><div className="serviceGrid">{items.map(([t,d])=><article className="service" key={t}><CheckCircle/><h3>{t}</h3><p>{d}</p></article>)}</div></section>
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
      message: String(form.get('message') || '').trim(),
    };

    if (!body.name || !body.message) {
      e.preventDefault();
      setStatus({ type: 'error', message: 'Please enter your name and message.' });
      return;
    }

    if (useEmailClientFallback) {
      e.preventDefault();
      const subject = encodeURIComponent('New CareGrid Health Contact Message');
      const message = encodeURIComponent(`Name: ${body.name}\nPhone: ${body.phone || ''}\n\n${body.message}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${message}`;
      setStatus({ type: 'success', message: 'Your email app has been opened with a prepared message. Please press send to complete.' });
      return;
    }

    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: 'info', message: 'Sending your message...' });
    try {
      const res = await fetch(`${API}/api/contact`, {method:'POST', headers:{'Content-Type':'application/json', 'Accept':'application/json'}, body:JSON.stringify(body)});
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Submission failed. Please try again.');
      setStatus({ type: 'success', message: 'Your message has been sent. Thank you.' });
      formElement.reset();
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }
  return <section id="contact" className="section split"><div><h2>Contact CareGrid Health</h2><p><b>Location:</b> Melbourne VIC, Australia</p><p><b>Phone:</b> +61 421 283 398</p><p><b>Email:</b> caregrid.health@gmail.com</p><p><b>Hours:</b> Mon–Fri, 08:00–17:00</p></div><form onSubmit={submit} noValidate className="form contactForm"><div className="formField"><label htmlFor="contact-name"><User aria-hidden="true"/>Name</label><input id="contact-name" name="name" autoComplete="name" placeholder="Your name"/></div><div className="formField"><label htmlFor="contact-phone"><Phone aria-hidden="true"/>Phone</label><input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+61 421 283 398"/></div><div className="formField"><label htmlFor="contact-message"><MessageSquare aria-hidden="true"/>Message</label><textarea id="contact-message" name="message" rows={7} placeholder="How can we help?"/></div>{status.message && <p className={`formStatus ${status.type}`} role="status" aria-live="polite">{status.message}</p>}<button className="btn primary formSubmit" type="submit" disabled={submitting}><Send aria-hidden="true"/><span>{submitting ? 'Sending...' : 'Submit'}</span></button></form></section>
}

function App(){return <><Header/><main><Home/><About/><Services/><Contact/></main><footer>© 2026 CareGrid Health. Digital health integration services in Australia, APAC and North America.</footer></>}
createRoot(document.getElementById('root')!).render(<App/>);
