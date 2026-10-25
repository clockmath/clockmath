'use client';

import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { revealIfHidden } from '@/hooks/use-answer-feedback';

/**
 * The answer, pinned to the foot of a phone's screen while you edit a tool
 * whose answer board is out of sight (a week of shifts pushes the total far
 * below; Oct 2026). Shown only while the tool's fields are on screen and its
 * answer isn't; a tap scrolls to the full answer. A visual convenience: the
 * board itself is the answer screen readers hear, so this is aria-hidden.
 */
export function AnswerBar({
  formRef,
  answerRef,
  children,
}: {
  formRef: RefObject<HTMLElement | null>;
  answerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [formIn, setFormIn] = useState(false);
  const [answerIn, setAnswerIn] = useState(true);

  useEffect(() => {
    const form = formRef.current;
    const answer = answerRef.current;
    if (!form || !answer || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === form) setFormIn(e.isIntersecting);
          // "On screen" once a third of the answer shows
          if (e.target === answer) setAnswerIn(e.isIntersecting && e.intersectionRatio >= 0.33);
        }
      },
      { threshold: [0, 0.33, 0.66, 1] },
    );
    io.observe(form);
    io.observe(answer);
    return () => io.disconnect();
  }, [formRef, answerRef]);

  const show = formIn && !answerIn;

  // The install offer moves up out of the bar's way
  useEffect(() => {
    const root = document.documentElement;
    if (show) root.dataset.answerBar = '';
    else delete root.dataset.answerBar;
    return () => {
      delete root.dataset.answerBar;
    };
  }, [show]);

  return (
    <button
      type="button"
      className="st-answer-bar"
      data-show={show ? 'true' : undefined}
      aria-hidden="true"
      tabIndex={-1}
      onClick={() => revealIfHidden(answerRef.current)}
    >
      <span className="st-answer-bar-body">{children}</span>
      <span className="st-answer-bar-go">See all</span>
    </button>
  );
}
