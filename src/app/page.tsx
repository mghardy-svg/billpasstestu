import Link from 'next/link';
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
} from 'lucide-react';

const features = [
  {
    title: 'Probability Predictions',
    description:
      'Our model analyzes historical data, campaign finances, and demographics to estimate passage probability.',
    icon: BarChart3,
    href: '/predictions',
    color: 'bg-blue-700',
  },
  {
    title: 'Campaign Finance Analysis',
    description:
      'Track real-time campaign contributions and spending from Cal-Access data.',
    icon: DollarSign,
    href: '/propositions',
    color: 'bg-green-700',
  },
  {
    title: 'What-If Scenarios',
    description:
      'Run simulations with different funding levels, turnout rates, or ballot framing.',
    icon: Zap,
    href: '/scenarios',
    color: 'bg-amber-600',
  },
  {
    title: 'District Impact',
    description:
      'See how proposition passage affects partisan balance across California districts.',
    icon: Map,
    href: '/districts',
    color: 'bg-purple-700',
  },
];

const upcomingPropositions = [
  {
    number: '1',
    title: 'Housing Bond Act',
    category: 'Housing',
    prediction: 0.62,
    status: 'Active',
  },
  {
    number: '2',
    title: 'Education Funding Reform',
    category: 'Education',
    prediction: 0.58,
    status: 'Active',
  },
  {
    number: '3',
    title: 'Environmental Protection',
    category: 'Environment',
    prediction: 0.71,
    status: 'Active',
  },
];

const dataSources = [
  {
    name: 'Cal-Access',
    description: 'Campaign finance data',
    url: 'https://cal-access.sos.ca.gov/',
  },
  {
    name: 'Census ACS',
    description: 'Demographic data',
    url: 'https://www.census.gov/programs-surveys/acs.html',
  },
  {
    name: 'CA Secretary of State',
    description: 'Official election data',
    url: 'https://www.sos.ca.gov/elections/ballot-measures',
  },
  {
    name: 'Google Civic Info',
    description: 'District information',
    url: 'https://developers.google.com/civic-information',
  },
];

const stats = [
  { label: 'Historical Props Analyzed', value: '200+', icon: BarChart3 },
  { label: 'Prediction Accuracy', value: '85%', icon: TrendingUp },
  { label: 'Active Propositions', value: '12', icon: Map },
  { label: 'Districts Tracked', value: '58', icon: Users },
];

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-24 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-amber-500/90 text-slate-900 border-0 px-4 py-1.5 text-sm font-semibold">
              🗳️ Beta Release - 2026 Election Cycle
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              California Proposition
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400 mt-2">
                Predictor & Analyzer
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Data-driven predictions for statewide ballot measures using machine learning, 
              historical voting patterns, campaign finance tracking, and demographic analysis.
            </p>
            
            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-300 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/propositions">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/50 px-8 py-6 text-lg">
                  View All Propositions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/scenarios">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg">
                  Run What-If Analysis
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-0">
              Platform Features
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Comprehensive Analysis Tools
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Our platform combines multiple authoritative data sources to provide accurate 
              predictions and deep insights into California ballot propositions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-slate-200 hover:border-blue-300 group">
                  <CardHeader>
                    <div
                      className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-slate-900 group-hover:text-blue-700 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Propositions Preview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge className="mb-3 bg-green-100 text-green-800 border-0">
                Live Tracking
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900">
                2026 Ballot Measures
              </h2>
              <p className="text-slate-600 mt-2">
                Real-time predictions and analysis for upcoming propositions
              </p>
            </div>
            <Link href="/propositions">
              <Button variant="outline" className="border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600">
                View All Propositions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingPropositions.map((prop) => (
              <Card key={prop.number} className="hover:shadow-lg transition-all duration-300 border-slate-200 relative overflow-hidden group">
                {/* Status indicator line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-green-600" />
                
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Badge className="mb-3 bg-slate-100 text-slate-700 border-0 text-xs font-semibold">
                        {prop.category}
                      </Badge>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                        Proposition {prop.number}
                      </h3>
                      <p className="text-slate-600 mt-1 text-sm">{prop.title}</p>
                    </div>
                    <span className="text-4xl font-bold text-slate-200 group-hover:text-blue-100 transition-colors">
                      {prop.number}
                    </span>
                  </div>
                  
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-600">
                        Passage Probability
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          prop.prediction >= 0.5 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {(prop.prediction * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          prop.prediction >= 0.5 
                            ? 'bg-gradient-to-r from-green-500 to-green-600' 
                            : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${prop.prediction * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Fail</span>
                      <span>Pass</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-100 text-slate-700 border-0">
              Data Sources
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Powered by Official Government Data
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our predictions are built on publicly available, authoritative data sources 
              from California state agencies and federal databases
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {dataSources.map((source) => (
              
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                  <ExternalLink className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                  {source.name}
                </h3>
                <p className="text-sm text-slate-600">{source.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Explore Proposition Predictions?
          </h2>
          <p className="text-blue-200 mb-10 max-w-2xl mx-auto text-lg">
            Dive into detailed analysis, run what-if scenarios, and understand how 
            ballot measures might affect California's legislative landscape.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/propositions">
              <Button size="lg" className="bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-lg shadow-amber-900/50 px-8 py-6 text-lg font-semibold">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg">
                Learn About Our Methodology
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
