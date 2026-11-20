import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import StackedTable from '@/components/StackedTable';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { YearGrid, YearLegend, YearPrintButton } from '@/components/YearCalendar';
import { generateSEOMetadata } from '@/lib/seo';
import { CALENDAR_YEARS, andList } from '@/lib/yearCalendar';
import { REGIONS, REGION_IDS, dayLabel, regionDescription, regionFacts, regionMarks, regionTitle, type RegionId } from '@/lib/regionCalendar';

/**
 * /calendar/<year>/uk/ and /canada/ (Nov 2026): the year calendar for another
 * country, on the same grid as the US pages. Each route is a few lines that
 * call these; the holidays are in lib/regionCalendar.ts.
 */
export function regionMetadata(id: RegionId, year: number): Metadata {
  const name = id;
  const extra = {
    uk: [`bank holidays ${year}`, `uk bank holidays ${year}`, `${year} bank holidays`, `uk calendar ${year}`, `${year} calendar with bank holidays`],
    canada: [`statutory holidays ${year}`, `canada statutory holidays ${year}`, `stat holidays ${year}`, `canada holidays ${year}`, `${year} calendar canada with holidays`],
    australia: [`public holidays ${year}`, `nsw public holidays ${year}`, `public holidays ${year} nsw`, `australia public holidays ${year}`, `${year} calendar australia with public holidays`],
  }[id];
  return generateSEOMetadata({
    title: regionTitle(id, year),
    description: regionDescription(id, year),
    path: `/calendar/${year}/${id}`,
    ogImage: '/og/countdown/holidays.png?v=3',
    keywords: [`${year} calendar ${name}`, `${name} calendar ${year}`, `printable ${year} calendar ${name}`, ...extra].join(', '),
  });
}

const LABELS: Record<RegionId, { h1: string; legend: { off: string; weekend: string; other: string }; key: string; regionalHeading: string; heading: string; extraWord: string; weekendNoExtra: string }> = {
  uk: {
    h1: 'UK Calendar with Bank Holidays',
    legend: { off: 'Bank holiday (England and Wales)', weekend: 'Bank holiday on a weekend', other: 'Other days and clock changes' },
    key: 'Shaded: bank holiday in England and Wales. Outlined: a bank holiday on a weekend, with a substitute day on the next weekday.',
    regionalHeading: 'Scotland and Northern Ireland',
    heading: 'Bank holidays',
    extraWord: 'substitute',
    weekendNoExtra: 'None',
  },
  canada: {
    h1: 'Canada Calendar with Statutory Holidays',
    legend: { off: 'Statutory holiday', weekend: 'Statutory holiday on a weekend', other: 'Provincial and other days' },
    key: 'Shaded: Canada Labour Code statutory holiday. Outlined: one on a weekend (a day off is usually given on the next working day).',
    regionalHeading: 'Provincial holidays',
    heading: 'Statutory holidays',
    extraWord: 'substitute',
    weekendNoExtra: 'Usually the next working day',
  },
  australia: {
    h1: 'Australia Calendar with NSW Public Holidays',
    legend: { off: 'Public holiday (NSW)', weekend: 'Public holiday on a weekend', other: 'Other days and clock changes' },
    key: 'Shaded: NSW public holiday or additional day. Outlined: a public holiday on a weekend (some get an additional weekday).',
    regionalHeading: 'Banks and other states',
    heading: 'NSW public holidays',
    extraWord: 'additional day',
    weekendNoExtra: 'The weekend day itself',
  },
};

export default function RegionCalendarPage({ id, year }: { id: RegionId; year: number }) {
  const region = REGIONS[id];
  const labels = LABELS[id];
  const holidays = region.holidays(year);
  const marks = regionMarks(id, year);
  const facts = regionFacts(id, year);
  const regional = region.regional(year);
  const others = region.other(year);
  // One row per holiday: substitute days are shown against the holiday they stand in for
  const named = holidays.filter((m) => !/\((substitute|additional) day\)$/.test(m.name));
  const weekend = named.filter((m) => m.kind === 'weekend-holiday');
  const rows = named.map((m) => ({
    holiday: m.name,
    date: dayLabel(m.date),
    off: m.kind === 'off' ? 'Same day' : m.observed ? `${id === 'australia' ? 'Also ' : ''}${dayLabel(m.observed)} (${labels.extraWord})` : labels.weekendNoExtra,
  }));

  const lede = {
    uk: `Every month of ${year} with the bank holidays in England and Wales marked: ${facts.daysOff} days off and ${facts.workingDays} working days. Scotland and Northern Ireland's own days are listed below.`,
    canada: `Every month of ${year} with Canada's 10 statutory holidays marked, ${facts.daysOff} of them on a weekday, and the provincial days most calendars show.`,
    australia: `Every month of ${year} with the New South Wales public holidays marked, additional days included: ${facts.daysOff} weekdays off and ${facts.workingDays} working days. Other states set their own.`,
  }[id];

  const ukCount = (where: string) => regional.filter((r) => r.where === where).length;
  const nswWeekend = weekend.filter((m) => m.observed);
  const FAQS =
    id === 'australia'
      ? [
          {
            question: `How many public holidays are there in NSW in ${year}?`,
            answer: `${named.length} public holidays, ${facts.daysOff} of them on a weekday once the additional days are counted.${nswWeekend.length ? ` ${andList(nswWeekend.map((m) => `${m.name} (${dayLabel(m.date)})`))} ${nswWeekend.length === 1 ? 'falls' : 'fall'} on a weekend, so ${andList(nswWeekend.map((m) => dayLabel(m.observed!)))} ${nswWeekend.length === 1 ? 'is an additional public holiday' : 'are additional public holidays'}.` : ''} Easter Saturday and Easter Sunday are public holidays in NSW too.`,
          },
          {
            question: `Is Anzac Day ${year} a public holiday on the Monday in NSW?`,
            answer: (() => {
              const anzac = named.find((m) => m.name === 'Anzac Day')!;
              return anzac.observed
                ? `Yes. Anzac Day falls on ${dayLabel(anzac.date)}, which stays a public holiday, and NSW adds ${dayLabel(anzac.observed)} as an additional public holiday.`
                : `Anzac Day is ${dayLabel(anzac.date)}, a weekday, so there's no additional day.`;
            })(),
          },
          {
            question: `How many working days are there in ${year} in NSW?`,
            answer: `${facts.workingDays}: ${facts.weekdays} weekdays less ${facts.daysOff} public holidays and additional days that fall on one. Other states have different holidays, so their counts differ.`,
          },
          {
            question: 'Are public holidays the same in every state?',
            answer: `No. Each state and territory sets its own. Queensland, for one, has Labour Day in May and the King's Birthday in October, and didn't add a Monday for Anzac Day 2026. This calendar is New South Wales.`,
          },
        ]
      : id === 'uk'
      ? [
          {
            question: `How many bank holidays are there in ${year}?`,
            answer:
              `England and Wales have ${facts.daysOff} bank holidays in ${year}` +
              (weekend.length ? `, with ${andList(weekend.map((m) => `${m.name} (${dayLabel(m.date)})`))} on a weekend, so the substitute day is ${andList(weekend.map((m) => dayLabel(m.observed ?? m.date)))}` : '') +
              `. Scotland adds ${ukCount('Scotland')} of its own and has no Easter Monday; Northern Ireland adds ${ukCount('Northern Ireland')}.`,
          },
          {
            question: `How many working days are there in ${year} in the UK?`,
            answer: `${facts.workingDays} in England and Wales: ${facts.weekdays} weekdays less ${facts.daysOff} bank holidays. Employers don't have to give bank holidays off, so check your contract.`,
          },
          {
            question: `When do the clocks change in ${year}?`,
            answer: `The clocks go forward on ${dayLabel(others.find((m) => m.name === 'Clocks go forward')!.date)} and back on ${dayLabel(others.find((m) => m.name === 'Clocks go back')!.date)}, at 1am GMT, the last Sundays of March and October.`,
          },
        ]
      : [
          {
            question: `How many statutory holidays are there in Canada in ${year}?`,
            answer:
              `The Canada Labour Code has 10 general holidays for federally regulated work, and ${facts.daysOff} fall on a weekday in ${year}.` +
              (weekend.length ? ` ${andList(weekend.map((m) => `${m.name} (${dayLabel(m.date)})`))} ${weekend.length === 1 ? 'falls' : 'fall'} on a weekend; the Code then gives a paid day off at another time, usually the next working day.` : '') +
              ' Provinces set the holidays for everyone else, mostly the same days plus their own.',
          },
          {
            question: `When is Family Day ${year}?`,
            answer: `${dayLabel(regional[0].date)}, the third Monday in February: Family Day in Alberta, British Columbia, New Brunswick, Ontario and Saskatchewan, Louis Riel Day in Manitoba, Islander Day in Prince Edward Island and Heritage Day in Nova Scotia. It isn't a federal statutory holiday.`,
          },
          {
            question: `How many working days are there in ${year} in Canada?`,
            answer: `${facts.workingDays}: ${facts.weekdays} weekdays less the ${facts.daysOff} statutory holidays that fall on one. Provincial holidays and days in lieu for weekend holidays come off that too, depending on where you work.`,
          },
          {
            question: `When do the clocks change in Canada in ${year}?`,
            answer: `Where they change, forward on ${dayLabel(others.find((m) => m.name.startsWith('Clocks go forward'))!.date)} and back on ${dayLabel(others.find((m) => m.name.startsWith('Clocks go back'))!.date)}. Saskatchewan and Yukon don't change, and British Columbia, Alberta, the Northwest Territories and Manitoba stayed on summer time from November 2026.`,
          },
        ];

  return (
    <StationChrome currentTool="year-calendar">
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / <Link href={`/calendar/${year}/`}>{year} Calendar</Link> / {region.name}
        </nav>
        <h1 className="st-h1">
          {year} {labels.h1}
        </h1>
        <p className="st-lede">{lede}</p>
      </div>

      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <YearPrintButton
          year={year}
          marks={marks}
          label={`Print the ${year} ${region.name} calendar`}
          text={{
            title: `${year} ${region.name} calendar`,
            summary: {
              uk: `Bank holidays in England and Wales in ${year}: ${facts.daysOff} days off, ${facts.workingDays} working days`,
              canada: `Statutory holidays in ${year}: ${facts.daysOff} on a weekday, ${facts.workingDays} working days`,
              australia: `NSW public holidays in ${year}: ${facts.daysOff} weekdays off, ${facts.workingDays} working days`,
            }[id],
            key: labels.key,
            url: `clockmath.com/calendar/${year}/${id}`,
            chart: `calendar_${year}_${id}`,
          }}
        />
        <CalendarLinks id={id} year={year} />
      </div>

      <section className="max-w-3xl mx-auto mb-section st-cal-section" aria-label={`${year} ${region.name} calendar`}>
        <YearGrid year={year} marks={marks} monthLinks={false} />
        <YearLegend {...labels.legend} />
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          {labels.heading} {year}
        </h2>
        <StackedTable
          rows={rows}
          firstKey="holiday"
          firstHeader="Holiday"
          stack="inline"
          minWidth="sm:min-w-[30rem]"
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'off', header: 'Day off', mobileLabel: 'Day off:' },
          ]}
        />
        <p className="text-muted-foreground text-sm mt-3">
          {
            {
              uk: `England and Wales. ${facts.daysOff} bank holidays and ${facts.workingDays} working days in ${year}.`,
              canada: `The Canada Labour Code's general holidays, for federally regulated work. ${facts.daysOff} fall on a weekday, leaving ${facts.workingDays} working days in ${year}.`,
              australia: `New South Wales. ${facts.daysOff} weekdays off and ${facts.workingDays} working days in ${year}.`,
            }[id]
          }
        </p>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">{labels.regionalHeading}</h2>
        <ul className="st-list">
          {regional.map((r) => (
            <li key={r.date + r.name}>
              <span>
                {r.name} <span className="text-muted-foreground">({r.where})</span>
              </span>
              <span>{dayLabel(r.date)}</span>
            </li>
          ))}
        </ul>
        {id === 'uk' && (
          <p className="text-muted-foreground text-sm mt-3">
            Scotland has no Easter Monday bank holiday, and its summer bank holiday is the first Monday in August rather
            than the last.
          </p>
        )}
        {id === 'australia' && (
          <p className="text-muted-foreground text-sm mt-3">
            Other states and territories set their own public holidays: Queensland, for one, has Labour Day in May and
            the King&apos;s Birthday in October. Check your own state&apos;s list.
          </p>
        )}
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Other days in {year}</h2>
        <ul className="st-list">
          {others.map((m) => (
            <li key={m.date + m.name}>
              <span>{m.name}</span>
              <span>{dayLabel(m.date)}</span>
            </li>
          ))}
        </ul>
      </section>

      <StationFold>
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="bg-card dark:bg-card rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-border/50">
                <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">About this calendar</h2>
          <p className="text-muted-foreground">
            Weeks start on Sunday. {region.source}{' '}
            {
              {
                uk: 'The grid shows England and Wales; Scotland and Northern Ireland are listed above.',
                canada: 'The grid shows the federal statutory holidays; provincial holidays are dotted and listed above.',
                australia: 'The grid shows New South Wales; other states differ. NSW has published 2026 and 2027 so far.',
              }[id]
            }
          </p>
          <CalendarLinks id={id} year={year} />
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}

const linkClass = 'text-primary hover:text-primary/80 font-semibold';

/** The same country's other years, then the other countries' calendars for this year */
function CalendarLinks({ id, year }: { id: RegionId; year: number }) {
  const region = REGIONS[id];
  const otherYears = region.years.filter((y) => y !== year && CALENDAR_YEARS.includes(y));
  const otherCountries = [
    { href: `/calendar/${year}/`, label: 'US' },
    ...REGION_IDS.filter((r) => r !== id && REGIONS[r].years.includes(year)).map((r) => ({ href: `/calendar/${year}/${r}/`, label: REGIONS[r].name })),
  ];
  return (
    <nav aria-label="Other calendars" className="text-sm text-muted-foreground">
      {otherYears.length > 0 && (
        <span className="block">
          Other years:{' '}
          {otherYears.map((y, i) => (
            <span key={y}>
              {i > 0 && ' · '}
              <Link href={`/calendar/${y}/${id}/`} className={linkClass}>
                {y} {region.name}
              </Link>
            </span>
          ))}
        </span>
      )}
      <span className="block">
        Other countries:{' '}
        {otherCountries.map((c, i) => (
          <span key={c.href}>
            {i > 0 && ' · '}
            <Link href={c.href} className={linkClass}>
              {year} {c.label}
            </Link>
          </span>
        ))}
      </span>
    </nav>
  );
}
