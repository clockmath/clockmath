'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import KeyDates from '@/components/KeyDates';
import { countdownProps } from '@/lib/countdowns';

// 2027 NCAA Division I tournaments, the first with 76 teams (expansion from
// 68 announced May 7, 2026; 12 opening-round games). Men's: Selection Sunday
// Mar 14, Opening Round Mar 16–17, first round Mar 18–19, second round
// Mar 20–21, Sweet 16 Mar 25–26, Elite Eight Mar 27–28, Final Four Apr 3 and
// title game Apr 5 at Ford Field, Detroit. Women's: bracket Mar 14, Opening
// Round Mar 17–18, Final Four Apr 2 and title game Apr 4 at Nationwide
// Arena, Columbus (NCAA.com schedule articles of May 7 and Aug 12, 2026;
// checked Nov 12, 2026). Tip-off times come with the bracket. The board
// counts to the first games, Mar 16, and reads "arrived" until Apr 5.

const DATES = [
  { what: 'Selection Sunday', note: 'Both brackets revealed', date: '2027-03-14' },
  { what: 'Opening Round', note: "Men's: 12 games, the new 76-team field", date: '2027-03-16', end: '2027-03-17' },
  { what: 'First round', note: "Men's round of 64", date: '2027-03-18', end: '2027-03-19' },
  { what: 'Second round', note: "Men's round of 32", date: '2027-03-20', end: '2027-03-21' },
  { what: 'Sweet 16', note: "Men's regionals", date: '2027-03-25', end: '2027-03-26' },
  { what: 'Elite Eight', note: "Men's regional finals", date: '2027-03-27', end: '2027-03-28' },
  { what: "Women's Final Four", note: 'Nationwide Arena, Columbus', date: '2027-04-02' },
  { what: "Men's Final Four", note: 'Ford Field, Detroit', date: '2027-04-03' },
  { what: "Women's championship game", note: 'Columbus', date: '2027-04-04' },
  { what: "Men's championship game", note: 'Detroit', date: '2027-04-05' },
];

export default function MarchMadnessCountdownPage() {
  return (
    <EventPage
      {...countdownProps('march-madness')}
      heading={'When Does March Madness 2027 Start?'}
      tagline="Selection Sunday is March 14; the first games are March 16; the men's title game is April 5 in Detroit"
      lastUpdated="2026-11-12"
      breadcrumb="March Madness 2027"
      facts={[
        { label: 'Selection Sunday', value: 'March 14, 2027' },
        { label: 'First games', value: "March 16 (men's), March 17 (women's)" },
        { label: "Men's Final Four", value: 'April 3 and 5, Ford Field, Detroit' },
        { label: "Women's Final Four", value: 'April 2 and 4, Columbus, Ohio' },
        { label: 'Teams', value: '76 in each tournament (was 68)' },
      ]}
      intro={
        <>
          <strong>March Madness 2027</strong> is the first with <strong>76 teams</strong> in each tournament, up from
          68. The brackets are revealed on <strong>Selection Sunday, March 14</strong>, the men&apos;s tournament tips
          off with 12 Opening Round games on <strong>Tuesday, March 16</strong>, and it ends with the Final Four at Ford
          Field in Detroit on <strong>April 3 and 5</strong>. The women&apos;s Final Four is in Columbus, Ohio, on April
          2 and 4. The countdown above runs to the first games; the table below has the days left until every round.
          Planning a watch party for a date that isn&apos;t listed? The{' '}
          <Link href="/tools/days-between-dates/" className="text-primary hover:text-primary/80 font-semibold">
            days between dates calculator
          </Link>{' '}
          counts any gap.
        </>
      }
      extraContent={
        <KeyDates
          title="March Madness 2027 dates"
          dates={DATES}
          footnote="Days are counted to the start of each date in your own timezone. Women's rounds before the Final Four are a day later than the men's: Opening Round March 17–18, first round March 19–20, second round March 21–22. Source: NCAA.com, 2027 tournament schedules."
        >
          Every round of the 2027 tournaments, with the days left until each. Game times come out with the brackets on
          Selection Sunday.
        </KeyDates>
      }
      faqs={[
        {
          question: 'When does March Madness 2027 start?',
          answer:
            "The men's tournament starts with the Opening Round on Tuesday, March 16, 2027, two days after Selection Sunday (March 14). The first round of 64 is Thursday and Friday, March 18 and 19. The women's tournament starts a day later, on March 17.",
        },
        {
          question: 'When is Selection Sunday 2027?',
          answer: 'Sunday, March 14, 2027. Both the men’s and women’s brackets are revealed that day.',
        },
        {
          question: 'When and where is the 2027 Final Four?',
          answer:
            "The men's Final Four is at Ford Field in Detroit: the semifinals on Saturday, April 3 and the national championship game on Monday, April 5, 2027. The women's Final Four is at Nationwide Arena in Columbus, Ohio, on Friday, April 2 and Sunday, April 4.",
        },
        {
          question: 'How many teams are in the 2027 NCAA tournament?',
          answer:
            '76 in each of the men’s and women’s tournaments, up from 68. The NCAA announced the expansion on May 7, 2026. The extra teams play 12 Opening Round games for places in the round of 64.',
        },
        {
          question: 'How many days until the Final Four?',
          answer:
            "The men's Final Four starts on Saturday, April 3, 2027 and the women's on Friday, April 2. The dates table on this page gives the days left until each, updated daily.",
        },
        {
          question: 'What time do the March Madness games start?',
          answer:
            'Tip-off times are set after the brackets are revealed on Selection Sunday, March 14. Early-round games run from about noon to midnight Eastern on each game day.',
        },
      ]}
    />
  );
}
