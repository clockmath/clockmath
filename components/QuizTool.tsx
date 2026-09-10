'use client';

/**
 * QuizTool — the daily time quiz game + leaderboard client.
 *
 * The puzzle itself is generated locally from the UTC date (lib/quiz.ts), so
 * the game works fully offline/static. The leaderboard is the only network
 * feature (functions/api/quiz.js) and degrades gracefully: if the endpoint
 * is unreachable the result screen simply skips percentile + board.
 *
 * Timer fairness: the clock only runs while a question is awaiting an
 * answer — reading the post-answer explanation doesn't cost you time.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Trophy, Share2, Check, X, ArrowRight, RefreshCw, GraduationCap } from 'lucide-react';
import { RollingNumber } from '@/components/RollingNumber';
import { toolUsed, event as gaEvent } from '@/lib/gtag';
import {
  generateDailyQuiz,
  generatePracticeQuestion,
  getQuizDay,
  buildShareText,
  fmtMMSS,
  isValidInitials,
  QUIZ_QUESTION_COUNT,
  type DailyQuiz,
  type QuizQuestion,
} from '@/lib/quiz';

/**
 * Minimal analog dial for clock-reading questions. The accessible label
 * states the time — a screen-reader user can't inspect hand angles, so the
 * label IS their clock face.
 */
function ClockFace({ h, m }: { h: number; m: number }) {
  const minuteAngle = m * 6;
  const hourAngle = (h % 12) * 30 + m * 0.5;
  const hand = (angle: number, length: number, width: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x2: 60 + length * Math.cos(rad), y2: 60 + length * Math.sin(rad), width };
  };
  const hour = hand(hourAngle, 26, 5);
  const minute = hand(minuteAngle, 38, 3);
  const label = `Clock face showing ${h === 0 ? 12 : h}:${String(m).padStart(2, '0')}`;
  return (
    <svg
      viewBox="0 0 120 120"
      className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-6"
      role="img"
      aria-label={label}
    >
      <circle cx="60" cy="60" r="56" className="fill-background dark:fill-slate-900/60 stroke-border dark:stroke-slate-600" strokeWidth="2.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        const inner = i % 3 === 0 ? 46 : 49;
        return (
          <line
            key={i}
            x1={60 + inner * Math.cos(a)}
            y1={60 + inner * Math.sin(a)}
            x2={60 + 53 * Math.cos(a)}
            y2={60 + 53 * Math.sin(a)}
            className="stroke-muted-foreground"
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
            strokeLinecap="round"
          />
        );
      })}
      <line x1="60" y1="60" x2={hour.x2} y2={hour.y2} className="stroke-foreground" strokeWidth={hour.width} strokeLinecap="round" />
      <line x1="60" y1="60" x2={minute.x2} y2={minute.y2} className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth={minute.width} strokeLinecap="round" />
      <circle cx="60" cy="60" r="3.5" className="fill-foreground" />
    </svg>
  );
}

/** 26_625_000 → "7h 23m 45s" (used for the next-puzzle countdown). */
function fmtHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${m}m ${s}s`;
}

interface StoredResult {
  day: string;
  score: number;
  timeMs: number;
  results: boolean[];
  initials: string | null;
  percentile: number | null;
}

interface BoardEntry {
  i: string;
  s: number;
  t: number;
}

interface BoardState {
  count: number;
  top: BoardEntry[];
}

const RESULT_KEY_PREFIX = 'clockmath-quiz-result-';
// In-progress daily run: answers so far + banked ms. Survives reloads and
// mobile interruptions; index resumes at r.length (an answered question's
// feedback is skipped on resume rather than double-counted).
const PROGRESS_KEY_PREFIX = 'clockmath-quiz-progress-';
const STREAK_KEY = 'clockmath-quiz-streak';
const INITIALS_KEY = 'clockmath-quiz-initials';

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full/blocked — the game still works, it just won't remember.
  }
}

/** Streak update — forgiving by design: a missed day quietly restarts at 1,
 *  no "you lost your streak" messaging anywhere. */
function bumpStreak(day: string): number {
  const prev = readJSON<{ last: string; streak: number }>(STREAK_KEY);
  if (prev?.last === day) return prev.streak;
  const [y, m, d] = day.split('-').map(Number);
  const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  const streak = prev?.last === yesterday ? prev.streak + 1 : 1;
  writeJSON(STREAK_KEY, { last: day, streak });
  return streak;
}

const cardClass =
  'bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50';

type Phase = 'loading' | 'intro' | 'playing' | 'done' | 'practice';

export function QuizTool({ className = '' }: { className?: string }) {
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');

  // Playing state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Done state
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [boardDown, setBoardDown] = useState(false);
  // Percentile recomputed by the server against everyone who has played so
  // far — unlike stored.percentile, which is frozen at submit time.
  const [livePercentile, setLivePercentile] = useState<number | null>(null);
  const [livePosition, setLivePosition] = useState<number | null>(null);
  // Milliseconds until the next puzzle (next UTC midnight), ticking.
  const [nextPuzzleMs, setNextPuzzleMs] = useState<number | null>(null);
  // Interrupted run to offer resuming (null = start fresh).
  const [resumable, setResumable] = useState<{ r: boolean[]; ms: number } | null>(null);
  // Which day's board the leaderboard card shows.
  const [boardView, setBoardView] = useState<'today' | 'yesterday'>('today');
  const [yBoard, setYBoard] = useState<BoardState | null>(null);
  const [yBoardDown, setYBoardDown] = useState(false);
  // Last 7 completed days' winners (null champion = day had no initials).
  const [champions, setChampions] = useState<Array<{ day: string; champion: BoardEntry | null; count: number }> | null>(null);
  const [initials, setInitials] = useState<string[]>(['', '', '']);
  const [initialsError, setInitialsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState<string | null>(null);

  // Practice state
  const [practiceQ, setPracticeQ] = useState<QuizQuestion | null>(null);
  const [practiceAnswered, setPracticeAnswered] = useState<number | null>(null);
  const [practiceScore, setPracticeScore] = useState({ right: 0, total: 0 });

  const questionStartRef = useRef(0);
  const accumulatedRef = useRef(0);
  const firedToolUsed = useRef(false);
  const initialsRefs = useRef<Array<HTMLInputElement | null>>([null, null, null]);

  // Generate today's puzzle client-side only (the UTC day at the visitor's
  // moment of play — must match what the server considers "today").
  useEffect(() => {
    const day = getQuizDay();
    const q = generateDailyQuiz(day);
    setQuiz(q);
    const saved = readJSON<StoredResult>(RESULT_KEY_PREFIX + day);
    if (saved) {
      setStored(saved);
      setStreak(readJSON<{ last: string; streak: number }>(STREAK_KEY)?.streak ?? 0);
      setPhase('done');
    } else {
      const progress = readJSON<{ r: boolean[]; ms: number }>(PROGRESS_KEY_PREFIX + day);
      if (progress && Array.isArray(progress.r) && progress.r.length > 0 && progress.r.length < QUIZ_QUESTION_COUNT) {
        setResumable({ r: progress.r.map(Boolean), ms: Math.max(0, Number(progress.ms) || 0) });
      } else if (progress && Array.isArray(progress.r) && progress.r.length >= QUIZ_QUESTION_COUNT) {
        // They answered the last question but never saw the result screen
        // (left during Q5 feedback) — finalize the run instead of restarting.
        const r = progress.r.slice(0, QUIZ_QUESTION_COUNT).map(Boolean);
        const finalized: StoredResult = {
          day,
          score: r.filter(Boolean).length,
          timeMs: Math.round(Math.max(0, Number(progress.ms) || 0)),
          results: r,
          initials: null,
          percentile: null,
        };
        writeJSON(RESULT_KEY_PREFIX + day, finalized);
        try { localStorage.removeItem(PROGRESS_KEY_PREFIX + day); } catch { /* ignore */ }
        setStored(finalized);
        setStreak(bumpStreak(day));
        setPhase('done');
        return;
      }
      setPhase('intro');
    }
    const savedInitials = localStorage.getItem(INITIALS_KEY);
    if (savedInitials && /^[A-Z]{3}$/.test(savedInitials)) {
      setInitials(savedInitials.split(''));
    }
  }, []);

  // Live timer — only ticks while a question awaits an answer.
  useEffect(() => {
    if (phase !== 'playing' || answered !== null) return;
    let lastPersistedSec = -1;
    const id = setInterval(() => {
      const total = accumulatedRef.current + (performance.now() - questionStartRef.current);
      setElapsedMs(total);
      // Persist banked time about once a second so a reload mid-question
      // keeps the clock honest instead of resetting it.
      const sec = Math.floor(total / 1000);
      if (quiz && sec !== lastPersistedSec) {
        lastPersistedSec = sec;
        writeJSON(PROGRESS_KEY_PREFIX + quiz.day, { r: results, ms: Math.round(total) });
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, answered, questionIndex, quiz, results]);

  // Fetch the board on the intro (social-proof preview) and result screens.
  // On the result screen the caller's own score/time ride along so the
  // server returns a LIVE percentile that stays honest as later players
  // arrive.
  useEffect(() => {
    if ((phase !== 'done' && phase !== 'intro') || !quiz) return;
    let cancelled = false;
    const own = phase === 'done' && stored ? `&s=${stored.score}&t=${stored.timeMs}` : '';
    fetch(`/api/quiz?day=${quiz.day}${own}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return;
        setBoard({ count: data.count, top: data.top || [] });
        if (typeof data.percentile === 'number') setLivePercentile(data.percentile);
        if (typeof data.position === 'number') setLivePosition(data.position);
      })
      .catch(() => {
        if (!cancelled) setBoardDown(true);
      });
    return () => {
      cancelled = true;
    };
  }, [phase, quiz, stored]);

  // Countdown to the next puzzle (next UTC midnight), ticking each second
  // while the result screen is visible.
  useEffect(() => {
    if (phase !== 'done') return;
    const tick = () => {
      const now = new Date();
      const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
      setNextPuzzleMs(nextMidnight - now.getTime());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Fetch yesterday's final board on demand (boards live in KV for 14 days).
  useEffect(() => {
    if (boardView !== 'yesterday' || yBoard !== null || yBoardDown || !quiz) return;
    const [y, m, d] = quiz.day.split('-').map(Number);
    const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
    let cancelled = false;
    fetch(`/api/quiz?day=${yesterday}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!cancelled) setYBoard({ count: data.count, top: data.top || [] });
      })
      .catch(() => {
        if (!cancelled) setYBoardDown(true);
      });
    return () => {
      cancelled = true;
    };
  }, [boardView, yBoard, yBoardDown, quiz]);

  // This week's daily champions — one fetch per result-screen visit.
  useEffect(() => {
    if (phase !== 'done' || champions !== null) return;
    let cancelled = false;
    fetch('/api/quiz?week=1')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!cancelled && Array.isArray(data.days)) setChampions(data.days);
      })
      .catch(() => {
        /* strip simply doesn't render */
      });
    return () => {
      cancelled = true;
    };
  }, [phase, champions]);

  const startDaily = useCallback(() => {
    const seed = resumable;
    accumulatedRef.current = seed ? seed.ms : 0;
    questionStartRef.current = performance.now();
    setElapsedMs(seed ? seed.ms : 0);
    setResults(seed ? seed.r : []);
    setQuestionIndex(seed ? seed.r.length : 0);
    setAnswered(null);
    setPhase('playing');
  }, [resumable]);

  const finishDaily = useCallback(
    (finalResults: boolean[], timeMs: number) => {
      if (!quiz) return;
      const score = finalResults.filter(Boolean).length;
      const result: StoredResult = {
        day: quiz.day,
        score,
        timeMs: Math.round(timeMs),
        results: finalResults,
        initials: null,
        percentile: null,
      };
      writeJSON(RESULT_KEY_PREFIX + quiz.day, result);
      try { localStorage.removeItem(PROGRESS_KEY_PREFIX + quiz.day); } catch { /* ignore */ }
      setStored(result);
      setStreak(bumpStreak(quiz.day));
      setPhase('done');
      gaEvent({ action: 'quiz_completed', params: { score, time_ms: Math.round(timeMs) } });
    },
    [quiz],
  );

  const answerDaily = useCallback(
    (optionIndex: number) => {
      if (!quiz || answered !== null) return;
      accumulatedRef.current += performance.now() - questionStartRef.current;
      setElapsedMs(accumulatedRef.current);
      setAnswered(optionIndex);
      const correct = optionIndex === quiz.questions[questionIndex].correctIndex;
      const nextResults = [...results, correct];
      setResults(nextResults);
      writeJSON(PROGRESS_KEY_PREFIX + quiz.day, { r: nextResults, ms: Math.round(accumulatedRef.current) });
      if (!firedToolUsed.current) {
        firedToolUsed.current = true;
        toolUsed('quiz');
      }
    },
    [quiz, answered, questionIndex, results],
  );

  const nextDaily = useCallback(() => {
    if (!quiz) return;
    if (questionIndex + 1 >= QUIZ_QUESTION_COUNT) {
      finishDaily(results, accumulatedRef.current);
    } else {
      setQuestionIndex((i) => i + 1);
      setAnswered(null);
      questionStartRef.current = performance.now();
    }
  }, [quiz, questionIndex, results, finishDaily]);

  const submitScore = useCallback(
    async (withInitials: string | null) => {
      if (!quiz || !stored || submitting) return;
      if (withInitials && !isValidInitials(withInitials)) {
        setInitialsError(
          /^[A-Z]{3}$/.test(withInitials) ? 'Those letters are blocked — pick different ones.' : 'Three letters, A to Z.',
        );
        return;
      }
      setInitialsError(null);
      setSubmitting(true);
      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day: quiz.day,
            score: stored.score,
            timeMs: stored.timeMs,
            initials: withInitials,
          }),
        });
        if (res.status === 409) {
          // Already on the board from this browser — just refresh it.
          setInitialsError('This browser already submitted a score today.');
          const fresh = await fetch(`/api/quiz?day=${quiz.day}`).then((r) => r.json());
          setBoard({ count: fresh.count, top: fresh.top || [] });
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const updated: StoredResult = {
          ...stored,
          initials: withInitials,
          percentile: typeof data.percentile === 'number' ? data.percentile : null,
        };
        writeJSON(RESULT_KEY_PREFIX + quiz.day, updated);
        setStored(updated);
        setBoard({ count: data.count, top: data.top || [] });
        if (withInitials) localStorage.setItem(INITIALS_KEY, withInitials);
        gaEvent({ action: 'quiz_submitted', params: { with_initials: Boolean(withInitials) } });
      } catch {
        setBoardDown(true);
      } finally {
        setSubmitting(false);
      }
    },
    [quiz, stored, submitting],
  );

  const share = useCallback(async () => {
    if (!quiz || !stored) return;
    const text = buildShareText(quiz, stored.results, stored.timeMs);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        gaEvent({ action: 'quiz_shared' });
      } else {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
        gaEvent({ action: 'quiz_shared' });
      }
    } catch (err) {
      // Share sheet dismissed is normal; clipboard denial isn't — show the
      // text so the user can copy it by hand.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setShareFallback(text);
      }
    }
  }, [quiz, stored]);

  const startPractice = useCallback(() => {
    setPracticeQ(generatePracticeQuestion(Math.floor(Math.random() * 2 ** 31)));
    setPracticeAnswered(null);
    setPhase('practice');
  }, []);

  const answerPractice = useCallback(
    (optionIndex: number) => {
      if (!practiceQ || practiceAnswered !== null) return;
      setPracticeAnswered(optionIndex);
      setPracticeScore((s) => ({
        right: s.right + (optionIndex === practiceQ.correctIndex ? 1 : 0),
        total: s.total + 1,
      }));
      if (!firedToolUsed.current) {
        firedToolUsed.current = true;
        toolUsed('quiz', { mode: 'practice' });
      }
    },
    [practiceQ, practiceAnswered],
  );

  const nextPractice = useCallback(() => {
    setPracticeQ(generatePracticeQuestion(Math.floor(Math.random() * 2 ** 31)));
    setPracticeAnswered(null);
  }, []);

  const handleInitialChange = (index: number, raw: string) => {
    const ch = raw.replace(/[^a-zA-Z]/g, '').slice(-1).toUpperCase();
    setInitials((prev) => {
      const next = [...prev];
      next[index] = ch;
      return next;
    });
    setInitialsError(null);
    if (ch && index < 2) initialsRefs.current[index + 1]?.focus();
  };

  const handleInitialKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !initials[index] && index > 0) {
      initialsRefs.current[index - 1]?.focus();
    }
  };

  // -------------------------------------------------------------------------

  if (!quiz || phase === 'loading') {
    return (
      <div className={`${cardClass} ${className}`} aria-busy="true">
        <p className="text-sm text-muted-foreground">Loading today&apos;s quiz…</p>
      </div>
    );
  }

  const question = quiz.questions[questionIndex];

  const optionButton = (
    q: QuizQuestion,
    optionIndex: number,
    picked: number | null,
    onPick: (i: number) => void,
  ) => {
    const isCorrect = optionIndex === q.correctIndex;
    const isPicked = picked === optionIndex;
    const revealed = picked !== null;
    let cls =
      'w-full px-4 py-3 rounded-xl border text-base font-medium text-left transition-colors tabular-nums ';
    if (!revealed) {
      cls +=
        'bg-background dark:bg-slate-900/40 border-border dark:border-slate-600 text-foreground hover:border-emerald-500 hover:bg-emerald-500/5';
    } else if (isCorrect) {
      cls += 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300';
    } else if (isPicked) {
      cls += 'bg-red-500/10 border-red-400 text-red-700 dark:text-red-300';
    } else {
      cls += 'bg-background dark:bg-slate-900/40 border-border/50 dark:border-slate-700 text-muted-foreground';
    }
    return (
      <button
        key={optionIndex}
        onClick={() => onPick(optionIndex)}
        disabled={revealed}
        className={cls}
      >
        <span className="flex items-center justify-between gap-2">
          {q.options[optionIndex]}
          {revealed && isCorrect && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
          {revealed && isPicked && !isCorrect && <X className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </span>
      </button>
    );
  };

  const feedbackPanel = (q: QuizQuestion, picked: number, onNext: () => void, nextLabel: string) => {
    const correct = picked === q.correctIndex;
    return (
      <div
        className="mt-4 pt-4 border-t border-border/50 dark:border-slate-700/50"
        aria-live="polite"
      >
        <p className={`text-sm font-semibold mb-2 ${correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {correct ? 'Correct!' : `Not quite — it's ${q.options[q.correctIndex]}.`}
        </p>
        <p className="text-sm text-muted-foreground mb-3">{q.explanation}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            {nextLabel}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          {!correct && (
            <Link
              href={q.toolHref}
              className="text-sm text-emerald-700 dark:text-emerald-400 underline underline-offset-4 hover:text-emerald-600"
            >
              Practice with the {q.toolLabel}
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* ------------------------------------------------ intro */}
      {phase === 'intro' && (
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-foreground">
              ClockMath Daily #{quiz.number}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">{quiz.day}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Five quick questions on elapsed time, clock math, and payroll hours — the same five
            for everyone today. Answer fast: the leaderboard breaks ties on time, arcade style.
          </p>
          {board && board.count > 0 && (
            <p className="text-sm mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{board.count}</span>{' '}
                {board.count === 1 ? 'player has' : 'players have'} taken today&apos;s quiz
                {board.top.length > 0 && (
                  <>
                    {' '}— the score to beat is{' '}
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {board.top[0].i} · {board.top[0].s}/{QUIZ_QUESTION_COUNT} in {fmtMMSS(board.top[0].t)}
                    </span>
                  </>
                )}
                .
              </span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startDaily}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
            >
              <Trophy className="w-4 h-4" aria-hidden="true" />
              {resumable
                ? `Resume today's quiz — question ${resumable.r.length + 1} of ${QUIZ_QUESTION_COUNT}`
                : "Play today's quiz"}
            </button>
            <button
              onClick={startPractice}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-border dark:border-slate-600 text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              Warm up first
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ playing */}
      {phase === 'playing' && (
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Question {questionIndex + 1} of {QUIZ_QUESTION_COUNT}
            </span>
            <span className="text-sm font-semibold text-foreground" aria-label="Elapsed time">
              <RollingNumber value={fmtMMSS(elapsedMs)} />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-foreground mb-6">{question.prompt}</p>
          {question.clock && <ClockFace h={question.clock.h} m={question.clock.m} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((_, i) => optionButton(question, i, answered, answerDaily))}
          </div>
          {answered !== null &&
            feedbackPanel(
              question,
              answered,
              nextDaily,
              questionIndex + 1 >= QUIZ_QUESTION_COUNT ? 'See results' : 'Next question',
            )}
        </div>
      )}

      {/* ------------------------------------------------ done */}
      {phase === 'done' && stored && (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* Result card */}
          <div className={cardClass}>
            <h2 className="text-lg font-bold text-foreground mb-3">
              ClockMath Daily #{quiz.number}
            </h2>
            <div className="flex items-end gap-3 mb-2" aria-live="polite">
              <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                <RollingNumber value={`${stored.score}/${QUIZ_QUESTION_COUNT}`} />
              </span>
              <span className="text-muted-foreground mb-1">
                in <RollingNumber value={fmtMMSS(stored.timeMs)} />
              </span>
            </div>
            <p className="text-xl mb-3 tracking-widest" aria-hidden="true">
              {stored.results.map((r) => (r ? '🟩' : '🟥')).join('')}
            </p>
            {streak >= 2 && (
              <p className="text-sm text-muted-foreground mb-3">
                🔥 {streak}-day streak — nice consistency.
              </p>
            )}
            {typeof (livePercentile ?? stored.percentile) === 'number' && board && board.count > 1 && (
              <p className="text-sm font-medium text-foreground mb-3">
                You beat {livePercentile ?? stored.percentile}% of today&apos;s players so far
                {livePosition !== null && board.count > 0 ? (
                  <span className="text-muted-foreground font-normal">
                    {' '}— #{livePosition} of {board.count} today
                  </span>
                ) : null}
                .
              </p>
            )}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={startPractice}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                Keep practicing — unlimited random questions
              </button>
              <button
                onClick={share}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-emerald-600/60 dark:border-emerald-500/60 text-emerald-700 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-600/10 transition-colors"
              >
                {shareCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
                {shareCopied ? 'Copied!' : 'Share result'}
              </button>
            </div>
            {shareFallback && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Copy your result from here:
                </p>
                <textarea
                  readOnly
                  value={shareFallback}
                  rows={3}
                  aria-label="Your shareable result"
                  onFocus={(e) => e.target.select()}
                  className="w-full text-sm rounded-xl border border-border dark:border-slate-600 bg-background dark:bg-slate-900/40 text-foreground p-3"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4" aria-live="off">
              {nextPuzzleMs !== null ? (
                <>
                  Next puzzle in{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    <RollingNumber value={fmtHMS(nextPuzzleMs)} />
                  </span>
                  . Your result is saved on this device.
                </>
              ) : (
                'New puzzle at midnight UTC. Your result is saved on this device.'
              )}
            </p>
          </div>

          {/* Leaderboard card */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold text-foreground">
                {boardView === 'today' ? "Today's leaderboard" : "Yesterday's final board"}
              </h2>
              <div className="flex gap-1 text-xs" role="group" aria-label="Board day">
                {(['today', 'yesterday'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setBoardView(v)}
                    aria-pressed={boardView === v}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      boardView === v
                        ? 'bg-emerald-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {v === 'today' ? 'Today' : 'Yesterday'}
                  </button>
                ))}
              </div>
            </div>

            {boardView === 'today' && boardDown && (
              <p className="text-sm text-muted-foreground">
                The leaderboard is unreachable right now — your score is saved on this device, and
                sharing still works.
              </p>
            )}

            {boardView === 'today' && !boardDown && stored.percentile === null && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Enter three letters, arcade style, to put your score on today&apos;s board:
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2" role="group" aria-label="Your three initials">
                    {[0, 1, 2].map((i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          initialsRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="text"
                        autoCapitalize="characters"
                        value={initials[i]}
                        onChange={(e) => handleInitialChange(i, e.target.value)}
                        onKeyDown={(e) => handleInitialKeyDown(i, e)}
                        onFocus={(e) => e.target.select()}
                        aria-label={`Initial ${i + 1}`}
                        className="w-12 h-14 text-center text-2xl font-bold uppercase rounded-xl border border-border dark:border-slate-600 bg-background dark:bg-slate-900/40 text-foreground tabular-nums"
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => submitScore(initials.join(''))}
                    disabled={submitting || initials.join('').length !== 3}
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                  >
                    {submitting ? 'Sending…' : 'Submit'}
                  </button>
                </div>
                {initialsError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2" role="alert">
                    {initialsError}
                  </p>
                )}
                <button
                  onClick={() => submitScore(null)}
                  disabled={submitting}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground mt-2"
                >
                  Skip the board — just show my percentile
                </button>
              </div>
            )}

            {boardView === 'today' && !boardDown && board && board.top.length > 0 && (
              <ol className="space-y-2" aria-label="Top ten scores today">
                {board.top.map((entry, i) => (
                  <li
                    key={`${entry.i}-${i}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm tabular-nums ${
                      stored.initials === entry.i && stored.score === entry.s && stored.timeMs === entry.t
                        ? 'bg-emerald-500/10 border border-emerald-500/40'
                        : 'bg-background dark:bg-slate-900/40'
                    }`}
                  >
                    <span className="w-6 text-muted-foreground">{i + 1}.</span>
                    <span className="font-bold tracking-widest text-foreground">{entry.i}</span>
                    <span className="ml-auto text-foreground">{entry.s}/{QUIZ_QUESTION_COUNT}</span>
                    <span className="w-12 text-right text-muted-foreground">{fmtMMSS(entry.t)}</span>
                  </li>
                ))}
              </ol>
            )}

            {boardView === 'today' && !boardDown && board && board.top.length === 0 && stored.percentile !== null && (
              <p className="text-sm text-muted-foreground">
                No initials on the board yet — yours could be first.
              </p>
            )}

            {boardView === 'today' && !boardDown && board && board.count > 0 && (
              <p className="text-xs text-muted-foreground mt-4 tabular-nums">
                {board.count} player{board.count === 1 ? '' : 's'} so far today.
              </p>
            )}

            {boardView === 'yesterday' && yBoardDown && (
              <p className="text-sm text-muted-foreground">
                Yesterday&apos;s board is unavailable right now.
              </p>
            )}
            {boardView === 'yesterday' && yBoard && yBoard.top.length > 0 && (
              <>
                <ol className="space-y-2" aria-label="Top ten scores yesterday">
                  {yBoard.top.map((entry, i) => (
                    <li
                      key={`${entry.i}-${i}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm tabular-nums bg-background dark:bg-slate-900/40"
                    >
                      <span className="w-6 text-muted-foreground">{i + 1}.</span>
                      <span className="font-bold tracking-widest text-foreground">{entry.i}</span>
                      <span className="ml-auto text-foreground">{entry.s}/{QUIZ_QUESTION_COUNT}</span>
                      <span className="w-12 text-right text-muted-foreground">{fmtMMSS(entry.t)}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground mt-4 tabular-nums">
                  Final standings — {yBoard.count} player{yBoard.count === 1 ? '' : 's'} played.
                </p>
              </>
            )}
            {boardView === 'yesterday' && yBoard && yBoard.top.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No initials made yesterday&apos;s board.
              </p>
            )}
            {boardView === 'yesterday' && !yBoard && !yBoardDown && (
              <p className="text-sm text-muted-foreground">Loading yesterday&apos;s board…</p>
            )}

            {champions && champions.some((c) => c.champion) && (
              <div className="mt-6 pt-4 border-t border-border/50 dark:border-slate-700/50">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  This week&apos;s daily champions
                </h3>
                <ul className="space-y-2 text-sm tabular-nums">
                  {champions
                    .filter((c) => c.champion)
                    .map((c) => {
                      const [yy, mm, dd] = c.day.split('-').map(Number);
                      const weekday = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString(undefined, {
                        weekday: 'short',
                        timeZone: 'UTC',
                      });
                      return (
                        <li key={c.day} className="flex items-center gap-3 text-muted-foreground">
                          <span className="w-9">{weekday}</span>
                          <span className="font-bold tracking-widest text-foreground">{c.champion!.i}</span>
                          <span className="ml-auto">{c.champion!.s}/{QUIZ_QUESTION_COUNT}</span>
                          <span className="w-12 text-right">{fmtMMSS(c.champion!.t)}</span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ practice */}
      {phase === 'practice' && practiceQ && (
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Practice — untimed, unlimited
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {practiceScore.right}/{practiceScore.total} right
            </span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-foreground mb-6">{practiceQ.prompt}</p>
          {practiceQ.clock && <ClockFace h={practiceQ.clock.h} m={practiceQ.clock.m} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {practiceQ.options.map((_, i) => optionButton(practiceQ, i, practiceAnswered, answerPractice))}
          </div>
          {practiceAnswered !== null && feedbackPanel(practiceQ, practiceAnswered, nextPractice, 'Another one')}
          <div className="mt-4 pt-4 border-t border-border/50 dark:border-slate-700/50">
            <button
              onClick={() => setPhase(stored ? 'done' : 'intro')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              {stored ? 'Back to my result' : "Back to today's quiz"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
