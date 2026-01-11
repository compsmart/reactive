import Link from "next/link";
import Image from "next/image";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/Button";

const industries = [
  { name: 'Retail & Stores', image: '/images/industries/industry-retail.png', desc: 'Multi-location management' },
  { name: 'Hospitality', image: '/images/industries/industry-hospitality.png', desc: 'Hotels, restaurants, pubs' },
  { name: 'Property Management', image: '/images/industries/industry-property.png', desc: 'Landlords & agencies' },
  { name: 'Healthcare', image: '/images/industries/industry-healthcare.png', desc: 'Clinics & care homes' },
  { name: 'Education', image: '/images/industries/industry-education.png', desc: 'Schools & universities' },
  { name: 'Offices', image: '/images/industries/industry-offices.png', desc: 'Corporate facilities' },
];

const features = [
  {
    title: 'Multi-Location Management',
    desc: 'Manage maintenance across all your sites from one dashboard. Assign jobs, track progress, and control costs.',
    icon: '/icons/location.png',
  },
  {
    title: 'Approved Contractor Network',
    desc: 'Access our vetted network of commercial contractors. All verified, insured, and rated by other businesses.',
    icon: '/icons/checkmark.png',
  },
  {
    title: 'Spend Control & Reporting',
    desc: 'Set budgets, approval workflows, and generate reports. Full visibility into your maintenance spend.',
    icon: '/icons/document.png',
  },
  {
    title: 'Priority Response Times',
    desc: 'Get faster response for urgent issues. Our contractors understand commercial SLAs.',
    icon: '/icons/clock.png',
  },
  {
    title: 'Dedicated Account Manager',
    desc: 'Your own point of contact to help onboard, manage contractors, and resolve any issues.',
    icon: '/icons/users.png',
  },
  {
    title: 'Contract Management',
    desc: 'Manage ongoing contracts, scheduled maintenance, and recurring jobs in one place.',
    icon: '/icons/document.png',
  },
];

export default function CommercialPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-commercial.jpg"
            alt="Commercial Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/95 via-purple-900/90 to-indigo-900/85" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
                <div className="relative w-5 h-5">
                  <Image src="/icons/building.png" alt="" fill className="object-contain" />
                </div>
                <span className="text-white/90 text-sm font-medium">For Business</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Let Us Handle Your
                <span className="text-violet-300 block">Maintenance & Repairs</span>
              </h1>
              
              <p className="text-xl text-violet-100 mb-8">
                Be Part of the Reactive Network — Streamline facilities management across all your locations. 
                Access vetted contractors, control costs, and reduce downtime.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/commercial/onboarding">
                  <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 h-14 px-8 text-lg w-full sm:w-auto shadow-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white/20 h-14 px-8 text-lg w-full sm:w-auto">
                    Request Demo
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-12 h-12 bg-violet-500/30 rounded-xl flex items-center justify-center">
                    <Image src="/icons/trophy.png" alt="" fill className="object-contain p-2" />
                  </div>
                  <div className="text-white">
                    <p className="font-semibold">Trusted by 2,000+ businesses</p>
                    <p className="text-sm text-violet-200">Managing 15,000+ locations</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '30%', label: 'Average cost savings' },
                    { value: '4hr', label: 'Avg. response time' },
                    { value: '98%', label: 'Customer satisfaction' },
                    { value: '24/7', label: 'Emergency support' },
                  ].map((stat, index) => (
                    <div key={index} className="bg-white/10 rounded-xl p-4">
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-violet-200">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-8 bg-slate-100 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-sm mb-6">Trusted by leading businesses</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
            {['TechCorp', 'RetailMax', 'PropManage', 'HealthFirst', 'EduGroup'].map((name) => (
              <div key={name} className="text-xl font-bold text-slate-400">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built for Every Industry
            </h2>
            <p className="text-xl text-slate-600">
              From retail chains to healthcare facilities
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => (
              <div
                key={industry.name}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 w-full">
                  <Image 
                    src={industry.image} 
                    alt={industry.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-bold text-white text-lg mb-1">{industry.name}</h3>
                  <p className="text-sm text-slate-200">{industry.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="enterprise" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to manage facilities at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
                  <div className="relative w-8 h-8">
                    <Image src={feature.icon} alt="" fill className="object-contain" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Getting Started is Easy
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Create Account', desc: 'Sign up for free in minutes', icon: '/icons/users.png' },
              { step: '2', title: 'Add Your Locations', desc: 'Add all your sites and contacts', icon: '/icons/location.png' },
              { step: '3', title: 'Set Preferences', desc: 'Budget controls and approval workflows', icon: '/icons/gear.png' },
              { step: '4', title: 'Start Managing', desc: 'Post jobs and track everything', icon: '/icons/checkmark.png' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              No hidden fees. Pay only for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-600 mb-6">For small businesses</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">Free</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Up to 5 locations', 'Basic reporting', 'Email support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <div className="relative w-5 h-5">
                      <Image src="/icons/checkmark.png" alt="" fill className="object-contain" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/commercial/onboarding">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-violet-600 rounded-2xl p-8 text-white relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E86A33] text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <p className="text-violet-200 mb-6">For growing businesses</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">£199</span>
                <span className="text-violet-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited locations', 'Advanced analytics', 'Priority support', 'Custom workflows'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="relative w-5 h-5">
                      <Image src="/icons/checkmark.png" alt="" fill className="object-contain brightness-0 invert" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/commercial/onboarding?plan=pro">
                <Button className="w-full bg-white text-violet-600 hover:bg-violet-50">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-600 mb-6">For large organizations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro', 'Dedicated manager', 'API access', 'SLA guarantee'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <div className="relative w-5 h-5">
                      <Image src="/icons/checkmark.png" alt="" fill className="object-contain" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="#demo">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section id="demo" className="py-20 bg-violet-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Request a Demo
              </h2>
              <p className="text-slate-600">
                See how Reactive can transform your facilities management
              </p>
            </div>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
                <input type="email" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Locations</label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-slate-900">
                  <option>1-5</option>
                  <option>6-20</option>
                  <option>21-50</option>
                  <option>51-100</option>
                  <option>100+</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-lg">
                Request Demo
              </Button>
            </form>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
