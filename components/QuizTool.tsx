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
    const id = setInterval(() => {
      setElapsedMs(accumulatedRef.current + (performance.now() - questionStartRef.current));
    }, 250);
    return () => clearInterval(id);
  }, [phase, answered, questionIndex]);

  // Fetch the board when the result screen shows.
  useEffect(() => {
    if (phase !== 'done' || !quiz) return;
    let cancelled = false;
    fetch(`/api/quiz?day=${quiz.day}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!cancelled) setBoard({ count: data.count, top: data.top || [] });
      })
      .catch(() => {
        if (!cancelled) setBoardDown(true);
      });
    return () => {
      cancelled = true;
    };
  }, [phase, quiz]);

  const startDaily = useCallback(() => {
    accumulatedRef.current = 0;
    questionStartRef.current = performance.now();
    setElapsedMs(0);
    setResults([]);
    setQuestionIndex(0);
    setAnswered(null);
    setPhase('playing');
  }, []);

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
      setResults((prev) => [...prev, correct]);
      if (!firedToolUsed.current) {
        firedToolUsed.current = true;
        toolUsed('quiz');
      }
    },
    [quiz, answered, questionIndex],
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
          <p className="text-sm text-muted-foreground mb-6">
            Five quick questions on elapsed time, clock math, and payroll hours — the same five
            for everyone today. Answer fast: the leaderboard breaks ties on time, arcade style.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startDaily}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
            >
              <Trophy className="w-4 h-4" aria-hidden="true" />
              Play today&apos;s quiz
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
            {typeof stored.percentile === 'number' && board && board.count > 1 && (
              <p className="text-sm font-medium text-foreground mb-3">
                You beat {stored.percentile}% of today&apos;s players.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={share}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                {shareCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
                {shareCopied ? 'Copied!' : 'Share result'}
              </button>
              <button
                onClick={startPractice}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border dark:border-slate-600 text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                Keep practicing
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
            <p className="text-xs text-muted-foreground mt-4">
              New puzzle at midnight UTC. Your result is saved on this device.
            </p>
          </div>

          {/* Leaderboard card */}
          <div className={cardClass}>
            <h2 className="text-lg font-bold text-foreground mb-3">Today&apos;s leaderboard</h2>

            {boardDown && (
              <p className="text-sm text-muted-foreground">
                The leaderboard is unreachable right now — your score is saved on this device, and
                sharing still works.
              </p>
            )}

            {!boardDown && stored.percentile === null && (
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

            {!boardDown && board && board.top.length > 0 && (
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

            {!boardDown && board && board.top.length === 0 && stored.percentile !== null && (
              <p className="text-sm text-muted-foreground">
                No initials on the board yet — yours could be first.
              </p>
            )}

            {!boardDown && board && board.count > 0 && (
              <p className="text-xs text-muted-foreground mt-4 tabular-nums">
                {board.count} player{board.count === 1 ? '' : 's'} so far today.
              </p>
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
