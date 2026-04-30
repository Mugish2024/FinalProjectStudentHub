import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import './Contact.css';

interface ContactProps {
    onBack: () => void;
}

const Contact: React.FC<ContactProps> = ({ onBack }) => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setForm({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="contact-page">
            <header className="contact-top">
                <button onClick={onBack} className="contact-back"><ArrowLeft size={16} /> Back</button>
                <h1>Contact AUCASA StudentHub</h1>
                <p>Reach our team for support, association services, and platform issues.</p>
            </header>
            <main className="contact-grid">
                <section className="contact-card">
                    <h2>Send us a message</h2>
                    {sent && <div className="contact-success">Message submitted. We will contact you soon.</div>}
                    <form onSubmit={submit} className="contact-form">
                        <input placeholder="Your full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                        <input type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                        <input placeholder="Subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required />
                        <textarea rows={6} placeholder="Write your message..." value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} required />
                        <button type="submit">Submit Message</button>
                    </form>
                </section>
                <section className="contact-card">
                    <h2>Office details</h2>
                    <div className="contact-item"><Phone size={16} /> +250 788 000 000</div>
                    <div className="contact-item"><Mail size={16} /> aucasa@auca.ac.rw</div>
                    <div className="contact-item"><MapPin size={16} /> Main Campus, Block B, Room 102</div>
                    <p className="contact-note">Working Hours: Monday to Friday, 8:00 AM - 5:00 PM</p>
                </section>
            </main>
        </div>
    );
};

export default Contact;
