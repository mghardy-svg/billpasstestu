import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import {
  BarChart3,
  DollarSign,
  Map,
  Zap,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Users,
  Newspaper,
  Scale,
} from 'lucide-react';

const features = [
  {
    title: 'Probability Predictions',
    description:
      'Our model analyzes historical data, campaign finances, and demographics to estimate passage probability.',
    icon: BarChart3,
    href: '/predictions',
    accent: 'border-t-[var(--navy)]',
    iconBg: 'bg-[#0B1F4B]',
    tag: 'ML Model',
  },
  {
    title: 'Campaign Finance',
    description:
      'Track real-time campaign contributions and spending from Cal-Access data.',
    icon: DollarSign,
    href: '/propositions',
    accent: 'border-t-[var(--crimson)]',
    iconBg: 'bg-[#B91C1C]',
    tag: 'Live Data',
  },
  {
    title: 'What-If Scenarios',
    description:
      'Run simulations with different funding levels, turnout rates, or ballot framing.',
    icon: Zap,
    href: '/scenarios',
    accent: 'border-t-[var(--navy)]',
    iconBg: 'bg-[#0B1F4B]',
    tag: 'Interactive',
  },
  {
    title: 'District Impact',
    description:
      'See how proposition passage affects partisan balance across California districts.',
    icon: Map,
    href: '/districts',
    accent: 'border-t-[var(--crimson)]',
    iconBg: 'bg-[#B91C1C]',
    tag: 'Mapping',
  },
];

const upcomingPropositions = [
  {
    number: '1',
    title: 'Housing Bond Act',
    category: 'Housing',
    prediction: 0.62,
    status: 'Active',
    summary: 'Authorizes $10B in state bonds to fund affordable housing construction and rental assistance programs statewide.',
  },
  {
    number: '2',
    title: 'Education Funding Reform',
    category: 'Education',
    prediction: 0.58,
    status: 'Active',
    summary: 'Restructures how K-12 school districts receive state allocations, tying funding to student outcomes.',
  },
  {
    number: '3',
    title: 'Environmental Protection',
    category: 'Environment',
    prediction: 0.71,
    status: 'Active',
    summary: 'Establishes constitutional protections for clean air and water; creates enforcement agency with subpoena power.',
  },
];

const dataSources = [
  {
    name: 'Cal-Access',
    description: 'Campaign finance data',
    url: 'https://cal-access.sos.ca.gov/',
    icon: DollarSign,
  },
  {
    name: 'Census ACS',
    description: 'Demographic data',
    url: 'https://www.census.gov/programs-surveys/acs.html',
    icon: Users,
  },
  {
    name: 'CA Secretary of State',
    description: 'Official election data',
    url: 'https://www.sos.ca.gov/elections/ballot-measures',
    icon: Scale,
  },
  {
    name: 'Google Civic Info',
    description: 'District information',
    url: 'https://developers.google.com/civic-information',
    icon: Map,
  },
];

const stats = [
  { label: 'Historical Props Analyzed', value: '200+', icon: BarChart3 },
  { label: 'Prediction Accuracy', value: '85%',  icon: TrendingUp },
  { label: 'Active Propositions',    value: '12',  icon: Newspaper },
  { label: 'Districts Tracked',      value: '58',  icon: Users },
];

const newsHighlights = [
  {
    tag: 'Housing',
    headline: 'Prop 1 Gains Ground as Housing Costs Surge in Bay Area',
    date: 'Feb 14, 2026',
    img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
  },
  {
    tag: 'Education',
    headline: 'School Districts Split on Funding Reform Proposition',
    date: 'Feb 12, 2026',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
  },
  {
    tag: 'Environment',
    headline: 'Environmental Prop Leads Polls Heading Into Spring',
    date: 'Feb 10, 2026',
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
  },
];

export default function HomePage() {
  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero-texture relative overflow-hidden">
        {/* Capitol background image with overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1600&q=80"
            alt="California State Capitol"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-28">
          <div className="max-w-4xl mx-auto text-center">

            {/* Eyebrow */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-xs tracking-widest uppercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-slow inline-block" />
                Beta Release · 2026 Election Cycle
              </span>
            </div>

            <h1
              className="text-6xl md:text-7xl font-black text-white mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              California
              <span className="block italic text-red-300">Proposition</span>
              Predictor
            </h1>

            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              Data-driven forecasts for statewide ballot measures — powered by machine learning,
              historical voting patterns, campaign finance tracking, and demographic analysis.
            </p>

            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 max-w-3xl mx-auto stagger">
              {stats.map((stat) => (
                <div key={stat.label} className="animate-slide-up bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <stat.icon className="h-5 w-5 text-red-300 mx-auto mb-1" />
                  <div className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                  <div className="text-xs text-blue-200 mt-0.5 leading-tight font-mono">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/propositions">
                <button className="vote-button inline-flex items-center gap-2 px-8 py-4 text-base rounded">
                  View All Propositions <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/scenarios">
                <button className="vote-button-alt inline-flex items-center gap-2 px-8 py-4 text-base rounded">
                  Run What-If Analysis <Zap className="h-4 w-4" />
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="#FAFAF8"/>
          </svg>
        </div>
      </section>

      {/* ── NEWS HIGHLIGHTS ──────────────────────────── */}
      <section className="py-16 bg-[#FAFAF8] border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <span className="section-label">Latest Coverage</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsHighlights.map((item, i) => (
              <article key={i} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg mb-3 aspect-video bg-gray-100">
                  <Image
                    src={item.img}
                    alt={item.headline}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 left-3 bg-red-700 text-white text-xs font-mono px-2 py-1 rounded uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <h3
                  className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-900 transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {item.headline}
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">{item.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <span className="section-label">Platform Features</span>
            <h2
              className="text-4xl font-black text-gray-900 mt-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Comprehensive Analysis Tools
            </h2>
            <p className="text-gray-600 mt-3 max-w-xl">
              Multiple authoritative data sources combined to deliver accurate predictions
              and deep insight into California ballot measures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <div className={`animate-slide-up h-full bg-white border border-gray-100 border-t-4 rounded-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group ${feature.accent}`}>
                  <div className={`w-12 h-12 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{feature.tag}</span>
                  <h3
                    className="text-lg font-bold text-gray-900 mt-1 mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                  <div className="mt-4 flex items-center text-blue-900 text-xs font-mono gap-1 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROPOSITIONS ─────────────────────────────── */}
      <section className="py-20 bg-[#F4F5F7]">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <span className="section-label">Live Tracking</span>
              <h2
                className="text-4xl font-black text-gray-900 mt-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                2026 Ballot Measures
              </h2>
              <p className="text-gray-500 mt-2 text-sm">Real-time predictions and analysis for upcoming propositions</p>
            </div>
            <Link href="/propositions">
              <button className="vote-button inline-flex items-center gap-2">
                All Propositions <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingPropositions.map((prop) => {
              const pass = prop.prediction >= 0.5;
              return (
                <div
                  key={prop.number}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Colored top bar */}
                  <div className={`h-1.5 ${pass ? 'bg-[#0B1F4B]' : 'bg-[#B91C1C]'}`} />

                  {/* Prop image / banner */}
                  <div className="relative h-36 bg-gray-100 overflow-hidden">
                    <Image
                      src={
                        prop.category === 'Housing'
                          ? 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=70'
                          : prop.category === 'Education'
                          ? 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=70'
                          : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=70'
                      }
                      alt={prop.title}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                    <span className={`absolute top-3 left-3 text-xs font-mono px-2 py-1 rounded uppercase tracking-wider text-white ${pass ? 'bg-[#0B1F4B]' : 'bg-[#B91C1C]'}`}>
                      {prop.category}
                    </span>
                    <span className="absolute bottom-3 right-3 text-6xl font-black text-gray-200 leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      {prop.number}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3
                      className="font-bold text-lg text-gray-900 mb-1"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Proposition {prop.number}
                    </h3>
                    <p className="text-gray-500 text-sm mb-1 font-semibold">{prop.title}</p>
                    <p className="text-gray-400 text-xs leading-relaxed mb-4">{prop.summary}</p>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Passage Probability</span>
                        <span
                          className={`text-2xl font-black ${pass ? 'text-[#0B1F4B]' : 'text-[#B91C1C]'}`}
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {(prop.prediction * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="prob-bar-track">
                        <div
                          className={pass ? 'prob-bar-fill-blue' : 'prob-bar-fill-red'}
                          style={{ width: `${prop.prediction * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs font-mono text-gray-400">
                        <span>Fail</span>
                        <span>50%</span>
                        <span>Pass</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAP / VISUAL BREAK ───────────────────────── */}
      <section className="relative py-0 overflow-hidden">
        <div className="relative h-64 md:h-80">
          <Image
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1600&q=70"
            alt="California map aerial"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F4B]/90 via-[#0B1F4B]/60 to-transparent flex items-center">
            <div className="container mx-auto px-4">
              <span className="section-label text-white/70 border-white/40">District Intelligence</span>
              <h2
                className="text-4xl font-black text-white mt-2 mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                58 Counties.<br/>Every Vote Mapped.
              </h2>
              <Link href="/districts">
                <button className="vote-button inline-flex items-center gap-2 mt-2">
                  Explore District Impact <Map className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA SOURCES ─────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <span className="section-label mx-auto">Data Sources</span>
            <h2
              className="text-3xl font-black text-gray-900 mt-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Powered by Official Government Data
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              Built on publicly available, authoritative sources from California state agencies and federal databases.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {dataSources.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-6 rounded-xl border-2 border-gray-100 bg-gray-50 hover:border-[#0B1F4B] hover:bg-[#0B1F4B] transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#0B1F4B] group-hover:bg-white flex items-center justify-center mb-3 transition-colors duration-300">
                  <source.icon className="h-5 w-5 text-white group-hover:text-[#0B1F4B] transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-white text-sm mb-0.5 transition-colors duration-300" style={{ fontFamily: 'var(--font-display)' }}>
                  {source.name}
                </h3>
                <p className="text-xs text-gray-400 group-hover:text-blue-200 transition-colors duration-300 font-mono">{source.description}</p>
                <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-white mt-2 transition-colors duration-300" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER BANNER ────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&q=70"
            alt="California legislature"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[#0B1F4B]" style={{ opacity: 0.92 }} />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-700" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-24 text-center">
          <span className="section-label text-red-300/70 border-red-400/40 mx-auto mb-4 inline-block">Get Started</span>
          <h2
            className="text-5xl font-black text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to Explore<br />
            <span className="italic text-red-300">Proposition Predictions?</span>
          </h2>
          <p className="text-blue-200 mb-10 max-w-xl mx-auto">
            Dive into detailed analysis, run what-if scenarios, and understand how
            ballot measures might reshape California's legislative landscape.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/propositions">
              <button className="inline-flex items-center gap-2 bg-white text-[#0B1F4B] font-mono font-semibold px-8 py-4 rounded hover:bg-gray-100 transition-all">
                View Propositions <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/about">
              <button className="vote-button-alt inline-flex items-center gap-2 px-8 py-4">
                Our Methodology
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
