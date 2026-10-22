'use client';

import { useState } from 'react';
import StationChrome from '@/components/station/StationChrome';
import SiteFooter from '@/components/SiteFooter';
import { event as gaEvent } from '@/lib/gtag';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { useDarkMode } from '@/hooks/use-dark-mode';

export default function ContactPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Anti-spam: a hidden field only bots fill in.
  const [honeypot, setHoneypot] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Anti-spam checks
    try {
      // 1. Honeypot check - if filled, it's likely a bot
      if (honeypot.trim() !== '') {
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      // The form only opens the visitor's own mail app (mailto:), so a bot
      // can't send anything through it — content and timing "spam" checks
      // here only blocked real people (an address like john.russell@… failed
      // the old ".ru" test; a 5-minute lockout stopped retries when the mail
      // app didn't open). Oct 2026 audit: keep the honeypot and a format check.
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      // Create mailto link
      const subject = encodeURIComponent(
        formData.category 
          ? `[${formData.category}] ${formData.subject}`
          : formData.subject
      );
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      );
      
      const mailtoLink = `mailto:hello@clockmath.com?subject=${subject}&body=${body}`;
      
      // Open mail client
      window.location.href = mailtoLink;
      
      // Track the contact attempt
      gaEvent({
        action: 'contact_form_submitted',
        params: {
          category: formData.category,
          has_subject: Boolean(formData.subject),
          device: window.matchMedia?.('(pointer: coarse)')?.matches ? 'mobile' : 'desktop'
        }
      });

      setSubmitStatus('success');
      
      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: ''
        });
        setSubmitStatus('idle');
      }, 3000);

    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    {
      question: "How accurate are the time calculations?",
      answer: "Our calculations are precise to the second and account for daylight saving time changes automatically."
    },
    {
      question: "Can I use ClockMath for business purposes?",
      answer: "Absolutely! ClockMath is free for both personal and commercial use."
    },
    {
      question: "Do you have an API for developers?",
      answer: "We're currently developing an API. Contact us if you're interested in early access."
    },
    {
      question: "How do I report a bug or suggest a feature?",
      answer: "Use the form below with 'Bug Report' or 'Feature Request' as the category."
    }
  ];

  return (
    <StationChrome currentTool="contact" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(faqItems)} />
      <div className="st-intro">
        <h1 className="st-h1">Contact ClockMath</h1>
        <p className="st-lede">Questions, feedback, or feature requests</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-section">
        {/* FAQ Section */}
        <section className="bg-card/70 dark:bg-card/70 rounded-2xl p-6 sm:p-8 shadow-sm border border-border/50 dark:border-border/50">
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground mb-6">
            Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details key={index} className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-muted/50 rounded-lg hover:bg-slate-200 dark:hover:bg-muted transition-colors border border-slate-200 dark:border-border">
                    <h3 className="font-semibold text-slate-900 dark:text-foreground">
                      {item.question}
                    </h3>
                    <svg className="w-5 h-5 text-slate-600 dark:text-muted-foreground group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>
                <div className="px-4 py-3 text-slate-700 dark:text-muted-foreground bg-slate-50 dark:bg-card/30 rounded-b-lg border-x border-b border-slate-200 dark:border-border -mt-1">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-card/70 dark:bg-card/70 rounded-2xl p-6 sm:p-8 shadow-sm border border-border/50 dark:border-border/50">
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground mb-6">
            Send a message
          </h2>
          
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-primary">
                Your email client should have opened. If not, you can email us directly at{' '}
                <a href="mailto:hello@clockmath.com" className="underline hover:no-underline">
                  hello@clockmath.com
                </a>
              </p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">
                Unable to process your message. Please try again or email us directly at{' '}
                <a href="mailto:hello@clockmath.com" className="underline hover:no-underline">
                  hello@clockmath.com
                </a>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field - hidden from users but visible to bots */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
              <label htmlFor="website">Website (leave blank)</label>
              <input
                type="text"
                id="website"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background dark:bg-muted border border-border dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background dark:bg-muted border border-border dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background dark:bg-muted border border-border dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              >
                <option value="">Select a category</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Question">General Question</option>
                <option value="Business Inquiry">Business Inquiry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background dark:bg-muted border border-border dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="Brief description of your message"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background dark:bg-muted border border-border dark:border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-none"
                placeholder="Tell us more about your question or feedback..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.subject || !formData.message}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opening Email Client...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send a message
                </>
              )}
            </button>
          </form>

        </section>
      </div>

      <SiteFooter />
    </StationChrome>
  );
}
