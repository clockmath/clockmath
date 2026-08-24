'use client';

/**
 * Footer feedback affordance. Collapsed it is a single text link sitting in
 * the footer's contact row — zero added visual weight. Expanded it reveals a
 * minimal inline form (topic chips, message, optional reply email).
 *
 * Spam gates mirror /api/feedback: a honeypot field ("website") and the
 * elapsed time between opening the form and submitting. Submissions are
 * stored server-side even if the email leg isn't configured yet.
 */

import { useRef, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { event as gaEvent } from '@/lib/gtag';

type Topic = 'feedback' | 'feature';
type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<Topic>('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — humans never see it
  const [status, setStatus] = useState<Status>('idle');
  const openedAt = useRef<number>(0);

  const openForm = () => {
    openedAt.current = Date.now();
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10 || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
          topic,
          website,
          elapsedMs: Date.now() - openedAt.current,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      gaEvent({ action: 'feedback_submitted', params: { topic } });
    } catch {
      setStatus('error');
    }
  };

  if (!open) {
    return (
      <>
        {/* Separator lives here so it disappears with the trigger when the
            form expands — otherwise the contact row ends in a dangling "·". */}
        <span className="mx-2">·</span>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-foreground"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Feedback or feature request
        </button>
      </>
    );
  }

  if (status === 'sent') {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-3" role="status">
        Thanks — got it. Feedback goes straight to the developer.
      </p>
    );
  }

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      active
        ? 'bg-emerald-600 text-white border-emerald-600'
        : 'bg-transparent text-muted-foreground dark:text-slate-400 border-border dark:border-slate-600 hover:text-foreground'
    }`;

  return (
    <form onSubmit={submit} className="mx-auto max-w-md text-left mt-3" aria-label="Send feedback">
      <div className="flex items-center gap-2 mb-3" role="group" aria-label="Type of message">
        <button type="button" className={chipClass(topic === 'feedback')} aria-pressed={topic === 'feedback'} onClick={() => setTopic('feedback')}>
          Feedback
        </button>
        <button type="button" className={chipClass(topic === 'feature')} aria-pressed={topic === 'feature'} onClick={() => setTopic('feature')}>
          Feature request
        </button>
      </div>

      <label htmlFor="feedback-message" className="sr-only">
        Your message
      </label>
      <textarea
        id="feedback-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        maxLength={4000}
        required
        placeholder={topic === 'feature' ? 'What should ClockMath do next?' : "What's working? What's confusing?"}
        className="w-full text-sm rounded-xl border border-border dark:border-slate-600 bg-background dark:bg-slate-900/40 text-foreground p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      />

      <label htmlFor="feedback-email" className="sr-only">
        Email, optional, if you would like a reply
      </label>
      <input
        id="feedback-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={200}
        placeholder="Email (optional — only if you'd like a reply)"
        className="w-full text-sm rounded-xl border border-border dark:border-slate-600 bg-background dark:bg-slate-900/40 text-foreground p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      />

      {/* Honeypot: visually hidden, skipped by keyboard, invisible to humans */}
      <div aria-hidden="true" className="absolute w-px h-px overflow-hidden -left-[9999px]">
        <label htmlFor="feedback-website">Website</label>
        <input
          id="feedback-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2" role="alert">
          Couldn&apos;t send right now — you can email{' '}
          <a href="mailto:hello@clockmath.com" className="underline underline-offset-2">
            hello@clockmath.com
          </a>{' '}
          instead.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={message.trim().length < 10 || status === 'sending'}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'sending' ? 'Sending…' : 'Send'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground underline underline-offset-4"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
