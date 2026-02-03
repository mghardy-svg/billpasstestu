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
    color: 'bg-red-700',
  },
  {
    title: 'What-If Scenarios',
    description:
      'Run simulations with different funding levels, turnout rates, or ballot framing.',
    icon: Zap,
    href: '/scenarios',
    color: 'bg-blue-600',
  },
  {
    title: 'District Impact',
    description:
      'See how proposition passage affects partisan balance across California districts.',
    icon: Map,
    href: '/districts',
    color: 'bg-red-600',
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
    <div className="animate-fade-in bg-white">
      <section className="bg-white py-20 border-b-4 border-blue-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Badge className="bg-blue-900 text-white border-0 px-6 py-2 text-sm font-semibold">
                Beta Release - 2026 Election Cycle
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              California Proposition
              <span className="block text-blue-900 mt-2">
                Predictor & Analyzer
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-10 leading-relaxed max-w-3xl mx-auto">
              Data-driven predictions for statewide ballot measures using machine learning, 
              historical voting patterns, campaign finance tracking, and demographic analysis.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-gray-50 border-2 border-gray-200 rounded p-4">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-5 w-5 text-blue-900" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/propositions">
                <Button size="lg" className="bg-blue-900 text-white hover:bg-blue-800 px-8 py-6 text-lg font-semibold">
                  View All Propositions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/scenarios">
                <Button size="lg" className="bg-red-700 text-white hover:bg-red-800 px-8 py-6 text-lg font-semibold">
                  Run What-If Analysis
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white text-blue-900 border-2 border-blue-900">
              Platform Features
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Analysis Tools
            </h2>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">
              Our platform combines multiple authoritative data sources to provide accurate 
              predictions and deep insights into California ballot propositions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer bg-white border-2 border-gray-200">
                  <CardHeader>
                    <div className={`w-14 h-14 rounded ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge className="mb-3 bg-red-700 text-white border-0">
                Live Tracking
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900">
                2026 Ballot Measures
              </h2>
              <p className="text-gray-600 mt-2">
                Real-time predictions and analysis for upcoming propositions
              </p>
            </div>
            <Link href="/propositions">
              <Button variant="outline" className="border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white">
                View All Propositions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingPropositions.map((prop) => (
              <Card key={prop.number} className="hover:shadow-xl transition-shadow bg-white border-2 border-gray-200">
                <div className="h-2 bg-blue-900" />
                
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Badge className="mb-3 bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold">
                        {prop.category}
                      </Badge>
                      <h3 className="font-bold text-lg text-gray-900">
                        Proposition {prop.number}
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm">{prop.title}</p>
                    </div>
                    <span className="text-4xl font-bold text-gray-200">
                      {prop.number}
                    </span>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Passage Probability
                      </span>
                      <span className={`text-2xl font-bold ${prop.prediction >= 0.5 ? 'text-blue-900' : 'text-red-700'}`}>
                        {(prop.prediction * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded overflow-hidden">
                      <div
                        className={`h-full ${prop.prediction >= 0.5 ? 'bg-blue-900' : 'bg-red-700'}`}
                        style={{ width: `${prop.prediction * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
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

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white text-gray-700 border-2 border-gray-300">
              Data Sources
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Official Government Data
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our predictions are built on publicly available, authoritative data sources 
              from California state agencies and federal databases
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {dataSources.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-white rounded border-2 border-gray-200 hover:border-blue-900 hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 bg-blue-900 rounded flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {source.name}
                </h3>
                <p className="text-sm text-gray-600">{source.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-900 border-t-4 border-red-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Explore Proposition Predictions?
          </h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg">
            Dive into detailed analysis, run what-if scenarios, and understand how 
            ballot measures might affect California legislative landscape.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/propositions">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" className="bg-red-700 text-white hover:bg-red-800 px-8 py-6 text-lg font-semibold">
                Learn About Our Methodology
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
