// node --test tests/ — daily quiz generator (lib/quiz.ts). The worker
// re-scores leaderboard submissions with this same code, so it must be
// deterministic and well-formed for every day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyQuiz, QUIZ_QUESTION_COUNT, isValidInitials } from '../lib/quiz.ts';

const days = Array.from({ length: 400 }, (_, i) => new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10));

test('same day, same quiz', () => {
  for (const day of ['2026-09-14', '2026-09-15', '2026-10-20', '2027-02-14']) {
    assert.deepEqual(generateDailyQuiz(day), generateDailyQuiz(day));
  }
});

test('every day: 5 questions, unique options, correct answer in range', () => {
  for (const day of days) {
    const quiz = generateDailyQuiz(day);
    assert.equal(quiz.day, day);
    assert.equal(quiz.questions.length, QUIZ_QUESTION_COUNT);
    for (const q of quiz.questions) {
      assert.ok(q.options.length >= 2 && q.options.length <= 10, `${day}: ${q.options.length} options`);
      assert.equal(new Set(q.options).size, q.options.length, `${day}: duplicate options in "${q.prompt}"`);
      assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length);
    }
  }
});

test('re-scoring from picks (what the worker does)', () => {
  const quiz = generateDailyQuiz('2026-10-20');
  const right = quiz.questions.map((q) => q.correctIndex);
  const score = (picks: number[]) => picks.reduce((n, p, i) => n + (p === quiz.questions[i].correctIndex ? 1 : 0), 0);
  assert.equal(score(right), 5);
  const oneWrong = [...right];
  oneWrong[2] = (oneWrong[2] + 1) % quiz.questions[2].options.length;
  assert.equal(score(oneWrong), 4);
});

test('initials: three letters A–Z, blocklist applies', () => {
  assert.equal(isValidInitials('ABC'), true);
  assert.equal(isValidInitials('abc'), false);
  assert.equal(isValidInitials('AB'), false);
  assert.equal(isValidInitials('KKK'), false);
});
