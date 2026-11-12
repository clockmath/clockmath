'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import KeyDates from '@/components/KeyDates';
import { countdownProps } from '@/lib/countdowns';

// FIFA Women's World Cup 2027, Brazil: Thu Jun 24 – Sun Jul 25, 2027, 32
// teams, 64 matches in 8 host cities. Opener (Brazil) and final at the
// Maracanã, Rio de Janeiro; one semi-final and the third-place match at
// Arena Itaquera, São Paulo (FIFA media release, Aug 20, 2026). Stage dates
// from FIFA's match schedule as listed on Wikipedia: groups Jun 24–Jul 8,
// round of 16 Jul 10–13, quarter-finals Jul 16–17, semi-finals Jul 20 (São
// Paulo) and Jul 21 (Rio), third place Jul 24 (checked Nov 12, 2026).
// Kickoff times are not final until after the draw; Brazil is on UTC−3 all
// year (no daylight saving since 2019). The board counts to Jun 24 in the
// visitor's own timezone and reads "arrived" through the final.

const DATES = [
  { what: 'Opening match', note: 'Brazil at the Maracanã, Rio de Janeiro', date: '2027-06-24' },
  { what: 'Group stage', note: '8 groups of 4, 48 matches', date: '2027-06-24', end: '2027-07-08' },
  { what: 'Round of 16', date: '2027-07-10', end: '2027-07-13' },
  { what: 'Quarter-finals', date: '2027-07-16', end: '2027-07-17' },
  { what: 'Semi-finals', note: 'São Paulo (Jul 20) and Rio de Janeiro (Jul 21)', date: '2027-07-20', end: '2027-07-21' },
  { what: 'Third-place match', note: 'Arena Itaquera, São Paulo', date: '2027-07-24' },
  { what: 'Final', note: 'Maracanã, Rio de Janeiro', date: '2027-07-25' },
];

export default function WomensWorldCupCountdownPage() {
  return (
    <EventPage
      {...countdownProps('womens-world-cup-2027')}
      heading={"How Many Days Until the 2027 Women's World Cup?"}
      tagline="Brazil, June 24 to July 25, 2027: the opening match and the final at the Maracanã"
      lastUpdated="2026-11-12"
      breadcrumb="Women's World Cup 2027"
      facts={[
        { label: 'Dates', value: 'June 24 – July 25, 2027' },
        { label: 'Host', value: 'Brazil, 8 cities' },
        { label: 'Opening match and final', value: 'Maracanã, Rio de Janeiro' },
        { label: 'Teams and matches', value: '32 teams, 64 matches' },
        { label: 'Brazil time', value: 'UTC−3 (BRT), no daylight saving' },
      ]}
      intro={
        <>
          The <strong>2027 FIFA Women&apos;s World Cup</strong> is the first held in South America. It runs from{' '}
          <strong>Thursday, June 24</strong>, when hosts Brazil open at the Maracanã in Rio de Janeiro, to the final at
          the same stadium on <strong>Sunday, July 25, 2027</strong>: 32 teams and 64 matches in eight cities. Kickoff
          times are set after the draw. Brazil keeps Brasília time (UTC−3) all year, so during the tournament it is one
          hour ahead of New York, four hours behind London and five behind Paris. The{' '}
          <Link href="/tools/timezone/" className="text-primary hover:text-primary/80 font-semibold">
            time zone converter
          </Link>{' '}
          turns any kickoff into your own time.
        </>
      }
      extraContent={
        <KeyDates
          title="2027 Women's World Cup dates"
          dates={DATES}
          footnote="Days are counted to the start of each date in your own timezone. Source: FIFA match schedule (August 2026); match times follow the final draw."
        >
          Every stage of the tournament, with the days left until each.
        </KeyDates>
      }
      faqs={[
        {
          question: "How many days until the 2027 Women's World Cup?",
          answer:
            "The 2027 Women's World Cup starts on Thursday, June 24, 2027. The line at the top of this page gives the days and weeks left, updated daily, and the timer counts down to the second.",
        },
        {
          question: "When is the 2027 Women's World Cup?",
          answer: 'From Thursday, June 24 to Sunday, July 25, 2027, in Brazil.',
        },
        {
          question: "Where is the 2027 Women's World Cup final?",
          answer:
            'At the Estádio do Maracanã in Rio de Janeiro on Sunday, July 25, 2027. The Maracanã also hosts the opening match on June 24 and one of the semi-finals.',
        },
        {
          question: "Which cities host the 2027 Women's World Cup?",
          answer:
            'Eight: Rio de Janeiro (Maracanã), São Paulo (Arena Itaquera), Belo Horizonte (Mineirão), Brasília (Estádio Nacional), Fortaleza (Arena Castelão), Porto Alegre (Beira-Rio), Recife (Arena de Pernambuco) and Salvador (Arena Fonte Nova).',
        },
        {
          question: 'What time are the Women’s World Cup games in the US and UK?',
          answer:
            'Kickoff times are not final until after the draw. Matches are played on Brasília time (UTC−3), which in June and July is 1 hour ahead of Eastern time, 4 hours ahead of Pacific time, 4 hours behind UK time and 5 hours behind Central European time. A 4 PM kickoff in Rio is 3 PM in New York, noon in Los Angeles and 8 PM in London.',
        },
        {
          question: "How many teams are in the 2027 Women's World Cup?",
          answer: '32: hosts Brazil and 31 qualifiers, in eight groups of four. The tournament has 64 matches.',
        },
      ]}
    />
  );
}
