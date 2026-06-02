import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Bot, CheckCircle, Shield, Stethoscope, Menu, X } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Header() {
  const [open, setOpen] = useState(false);
  const links = ['Home', 'About', 'Services', 'AI Consultant', 'Contact'];
  return <header className="header">
    <a className="brand" href="#home"><Activity /> CareGrid Health</a>
    <button className="menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? 'nav open' : 'nav'}>{links.map(l => <a key={l} href={`#${l.toLowerCase().replaceAll(' ', '-')}`} onClick={()=>setOpen(false)}>{l}</a>)}</nav>
  </header>
}

function Home() {
  return <section id="home" className="hero section">
    <div className="heroText">
      <span className="eyebrow">Melbourne • Digital Health Integration</span>
      <h1>Connecting the Future of Healthcare</h1>
      <p>Empowering Digital Health: CareGrid Health Pioneering Seamless Healthcare Integration</p>
      <p className="muted">We help healthcare organizations build smarter, connected, secure, and efficient digital health ecosystems across the Asia-Pacific region.</p>
      <div className="actions"><a className="btn primary" href="#contact">Contact Us</a><a className="btn secondary" href="#services">Explore Services</a></div>
    </div>
    <div className="heroCard"><Shield/><h3>Secure Healthcare Integration</h3><p>Reliable workflows, compliance-aware delivery, and scalable technology foundations.</p></div>
  </section>
}

function About() {
  return <section id="about" className="section split"><div><h2>About CareGrid Health</h2><p>CareGrid Health is a leading provider of digital health solutions, specializing in integration services. We address the rising demand for seamless healthcare integration across the Asia-Pacific region.</p></div><div className="cards"><div><h3>Mission</h3><p>Enable connected healthcare ecosystems through practical digital health integration.</p></div><div><h3>Vision</h3><p>Become a trusted APAC partner for secure, scalable healthcare interoperability.</p></div></div></section>
}

function Services() {
  const items = [
    ['Consulting Services','Turn complex digital ecosystems into seamless, reliable workflows. Improve efficiency, compliance, and value from technology investments.'],
    ['Implementation Services','Plan, configure, test, validate, and deploy healthcare platforms with minimal disruption and long-term scalability.'],
    ['Health Checks','Assess stability, security, and efficiency of integration environments, identifying risks before they become issues.']
  ];
  return <section id="services" className="section"><h2>Services</h2><div className="serviceGrid">{items.map(([t,d])=><article className="service" key={t}><CheckCircle/><h3>{t}</h3><p>{d}</p></article>)}</div></section>
}

function AIConsultant() {
  const [messages, setMessages] = useState([{role:'assistant', content:'Hello, I am the CareGrid Health AI Consultant. I can help with digital health integration questions, service discovery, and project scoping. I do not provide medical diagnosis or emergency advice.'}]);
  const [input, setInput] = useState('');
  async function send() {
    if (!input.trim()) return;
    const userMsg = {role:'user', content: input};
    setMessages(m => [...m, userMsg]);
    setInput('');
    const res = await fetch(`${API}/api/ai/chat`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message: userMsg.content})});
    const data = await res.json();
    setMessages(m => [...m, {role:'assistant', content: data.reply}]);
  }
  return <section id="ai-consultant" className="section"><h2><Bot/> AI Health Integration Consultant</h2><div className="chat">{messages.map((m,i)=><div key={i} className={`msg ${m.role}`}>{m.content}</div>)}<div className="chatInput"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about integration, implementation, or health checks..." onKeyDown={e=>e.key==='Enter'&&send()}/><button onClick={send}>Send</button></div></div><p className="small">Disclaimer: This assistant provides general digital health technology information only. It does not provide medical advice, diagnosis, treatment, or emergency support.</p></section>
}

function Contact() {
  const [status, setStatus] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    const res = await fetch(`${API}/api/contact`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    setStatus(res.ok ? 'Thank you. Your message has been submitted.' : 'Submission failed. Please try again.');
    if (res.ok) e.currentTarget.reset();
  }
  return <section id="contact" className="section split"><div><h2>Contact CareGrid Health</h2><p><b>Location:</b> Melbourne VIC, Australia</p><p><b>Phone:</b> +61 421 283 398</p><p><b>Email:</b> caregrid.health@gmail.com</p><p><b>Hours:</b> Mon–Fri, 08:00–17:00</p></div><form onSubmit={submit} className="form"><input name="name" placeholder="Name" required/><input name="phone" placeholder="Phone"/><input name="email" type="email" placeholder="Email" required/><textarea name="message" placeholder="Message" required/><button className="btn primary">Submit</button><p>{status}</p></form></section>
}

function App(){return <><Header/><main><Home/><About/><Services/><AIConsultant/><Contact/></main><footer>© 2026 CareGrid Health. Digital health integration services in Melbourne and APAC.</footer></>}
createRoot(document.getElementById('root')!).render(<App/>);
