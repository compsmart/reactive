import Link from "next/link";
import Image from "next/image";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/Button";

const categories = [
  { name: 'Plumbing', icon: '/icons/wrench.png', jobs: '2,450+' },
  { name: 'Electrical', icon: '/icons/lightning.png', jobs: '1,890+' },
  { name: 'Carpentry', icon: '/icons/hammer.png', jobs: '1,230+' },
  { name: 'Painting', icon: '/icons/paintbrush.png', jobs: '980+' },
  { name: 'Roofing', icon: '/icons/roof.png', jobs: '750+' },
  { name: 'Landscaping', icon: '/icons/tree.png', jobs: '1,100+' },
  { name: 'Cleaning', icon: '/icons/sparkle.png', jobs: '2,100+' },
  { name: 'HVAC', icon: '/icons/snowflake.png', jobs: '680+' },
];

const benefits = [
  {
    icon: '/icons/money.png',
    title: 'Save Money',
    desc: 'Compare multiple quotes to get the best price. Average savings of 20% compared to going direct.',
  },
  {
    icon: '/icons/clock.png',
    title: 'Save Time',
    desc: 'No more searching. Post once and let contractors come to you with their best offers.',
  },
  {
    icon: '/icons/shield.png',
    title: 'Peace of Mind',
    desc: 'All contractors are verified and reviewed. Read real feedback from other homeowners.',
  },
  {
    icon: '/icons/checkmark.png',
    title: '100% Free',
    desc: 'Posting jobs and receiving quotes is completely free. No hidden fees, no obligations.',
  },
];

const testimonials = [
  {
    name: 'Emma Thompson',
    location: 'Manchester',
    quote: 'Had my bathroom completely renovated. Got 4 quotes within 24 hours and saved over £800 compared to the first company I called directly!',
    rating: 5,
    job: 'Bathroom Renovation',
  },
  {
    name: 'David Chen',
    location: 'Birmingham',
    quote: 'Quick and easy to use. Found a reliable electrician for rewiring my house. The reviews were accurate and the work was excellent.',
    rating: 5,
    job: 'House Rewiring',
  },
  {
    name: 'Sarah Williams',
    location: 'Leeds',
    quote: 'Used Reactive three times now for different jobs. Every time the contractors have been professional, punctual and fairly priced.',
    rating: 5,
    job: 'Multiple Jobs',
  },
];

export default function ResidentialPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-residential.jpg"
            alt="Residential Background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-teal-900/85 to-cyan-900/80" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20  w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <div className="relative w-5 h-5">
                <Image src="/icons/home.png" alt="" fill sizes="20px" className="object-contain" />
              </div>
              <span className="text-white/90 text-sm font-medium">For Homeowners</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Get Quotes in Minutes from
              <span className="text-emerald-300 block">Trusted Local Traders</span>
            </h1>
            
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl">
              Access the Reactive Network — Post your job for free and receive competitive quotes from verified, 
              reviewed contractors in your area. No obligations, no hassle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/residential/post-job">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 h-14 px-8 text-lg w-full sm:w-auto shadow-lg">
                  Post Your Job Now — Free
                </Button>
              </Link>
              <Link href="/residential/smart-search">
                <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white/20 h-14 px-8 text-lg w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Smart Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-6 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            {[
              { icon: '/icons/shield.png', label: 'Verified Contractors' },
              { icon: '/icons/star.png', label: 'Reviewed & Rated' },
              { icon: '/icons/checkmark.png', label: 'Insurance Checked' },
              { icon: '/icons/lock.png', label: 'Secure Payments' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-white">
                <div className="relative w-6 h-6">
                  <Image src={item.icon} alt="" fill sizes="24px" className="object-contain" />
                </div>
                <span className="font-medium text-sm md:text-base">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              Get your job done in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                step: '1',
                icon: '/icons/document.png',
                title: 'Describe Your Job',
                desc: 'Tell us what you need - from leaky taps to full renovations. Add photos for accurate quotes.',
              },
              {
                step: '2',
                icon: '/icons/quote.png',
                title: 'Receive Quotes',
                desc: 'Get up to 5 quotes from local, verified contractors. Compare prices, reviews and availability.',
              },
              {
                step: '3',
                icon: '/icons/checkmark.png',
                title: 'Hire & Relax',
                desc: 'Choose your contractor, book the job, and pay securely. We are here if you need us.',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                    <div className="relative w-12 h-12">
                      <Image src={item.icon} alt="" fill sizes="48px" className="object-contain" />
                    </div>
                  </div>
                  <span className="absolute -top-3 -left-3 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/residential/post-job">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-14 px-10 text-lg">
                Start Now — It Takes 2 Minutes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Popular Services
            </h2>
            <p className="text-xl text-slate-600">
              Find the right professional for any job
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/residential/post-job?category=${category.name.toLowerCase()}`}
                className="group bg-white rounded-xl p-6 border hover:border-emerald-500 hover:shadow-lg transition-all"
              >
                <div className="relative w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                  <Image src={category.icon} alt={category.name} fill sizes="48px" className="object-contain" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-slate-500">{category.jobs} jobs posted</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Why Homeowners Choose Reactive
              </h2>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <div className="relative w-6 h-6">
                        <Image src={benefit.icon} alt="" fill sizes="24px" className="object-contain" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{benefit.title}</h3>
                      <p className="text-slate-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Ready to get started?</h3>
              <ul className="space-y-4 mb-8">
                {[
                  'Post your job in under 2 minutes',
                  'Receive up to 5 quotes',
                  'Compare and choose the best',
                  'Hire with confidence',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="relative w-4 h-4">
                        <Image src="/icons/checkmark.png" alt="" fill sizes="16px" className="object-contain brightness-0 invert" />
                      </div>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/residential/post-job">
                <Button size="lg" className="w-full bg-white text-emerald-600 hover:bg-emerald-50 h-14 text-lg">
                  Post Your Job Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Homeowners Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <div key={i} className="relative w-5 h-5">
                      <Image src="/icons/star.png" alt="" fill sizes="20px" className="object-contain" />
                    </div>
                  ))}
                </div>
                <p className="text-slate-700 mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.location}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                    {testimonial.job}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Get Your Job Done Today
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Join over 50,000 homeowners who have found trusted contractors through Reactive
          </p>
          <Link href="/residential/post-job">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 h-14 px-10 text-lg shadow-lg">
              Post Your Job Now — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
