import Link from "next/link";
import Image from "next/image";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/Button";

const benefits = [
  {
    icon: '/icons/users.png',
    title: '1000s of Customers',
    desc: 'Access thousands of residential and commercial customers actively looking for your services.',
  },
  {
    icon: '/icons/document.png',
    title: 'Your Own Business Page',
    desc: 'Create a professional profile showcasing your services, portfolio, and reviews.',
  },
  {
    icon: '/icons/briefcase.png',
    title: 'Win Quotes & Customers',
    desc: 'Bid on jobs that match your skills and location. You decide which jobs to pursue.',
  },
  {
    icon: '/icons/trophy.png',
    title: 'Build Your Reputation',
    desc: 'Collect reviews and ratings to stand out from the competition.',
  },
  {
    icon: '/icons/location.png',
    title: 'Free Directory Listing',
    desc: 'Get found by customers searching for contractors in your area. Free forever.',
  },
  {
    icon: '/icons/shield.png',
    title: 'Verified Badge',
    desc: 'Stand out with a verified badge showing you have passed our checks.',
  },
];

const howItWorks = [
  {
    step: '1',
    icon: '/icons/users.png',
    title: 'Create Your Profile',
    desc: 'Sign up free and add your business details, services, and portfolio.',
  },
  {
    step: '2',
    icon: '/icons/shield.png',
    title: 'Get Verified',
    desc: 'Complete our verification process to build trust with customers.',
  },
  {
    step: '3',
    icon: '/icons/search.png',
    title: 'Find Work',
    desc: 'Browse available jobs or receive notifications for matching opportunities.',
  },
  {
    step: '4',
    icon: '/icons/trophy.png',
    title: 'Grow Your Business',
    desc: 'Win jobs, deliver great work, collect reviews, and watch your business grow.',
  },
];

const testimonials = [
  {
    name: "Mike's Plumbing",
    trade: 'Plumber',
    quote: 'Reactive has transformed my business. I have won over 80 jobs in the past year and grown my team from 2 to 5.',
    jobs: '80+ jobs',
  },
  {
    name: 'Elite Electrical',
    trade: 'Electrician',
    quote: 'The quality of leads is excellent. These are real customers ready to hire, not time-wasters.',
    jobs: '120+ jobs',
  },
  {
    name: 'Precision Builders',
    trade: 'Builder',
    quote: 'Being a subscriber pays for itself within the first week. The ROI is incredible.',
    jobs: '45+ jobs',
  },
];

const faqs = [
  {
    q: 'Is it really free to join?',
    a: 'Yes! Creating your profile and being listed in our directory is completely free. You only pay when you want to unlock customer contact details for a specific job.',
  },
  {
    q: 'How much does it cost to unlock a job?',
    a: 'Lead prices vary by job type and typically range from £5-£20. Subscribers get unlimited unlocks included in their monthly fee.',
  },
  {
    q: 'How do I get verified?',
    a: 'We verify your business registration, insurance, and conduct basic background checks. The process takes 1-2 business days.',
  },
  {
    q: 'Can I choose which jobs to bid on?',
    a: 'Absolutely. You see all available jobs in your area and trade, and you decide which ones to pursue.',
  },
];

export default function ContractorJoinPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-contractors.jpg"
            alt="Workshop Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#E86A33]/95 via-orange-600/90 to-amber-600/85" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
                <div className="relative w-5 h-5">
                  <Image src="/icons/gear.png" alt="" fill className="object-contain brightness-0 invert" />
                </div>
                <span className="text-white/90 text-sm font-medium">For Contractors</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Add Your Business
                <span className="text-amber-200 block">for FREE</span>
              </h1>
              
              <p className="text-xl text-amber-100 mb-8">
                Be Part of the Reactive Network — Join thousands of tradespeople growing their business. 
                Create your profile, win jobs, and get paid.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register?role=contractor">
                  <Button size="lg" className="bg-white text-[#E86A33] hover:bg-orange-50 h-14 px-8 text-lg w-full sm:w-auto shadow-lg">
                    Join Now — It&apos;s Free
                  </Button>
                </Link>
                <Link href="/contractors">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white/20 h-14 px-8 text-lg w-full sm:w-auto">
                    Browse Directory
                  </Button>
                </Link>
              </div>
              
              <div className="text-amber-200 text-sm mt-4 flex flex-wrap gap-4">
                <span className="flex items-center gap-1">
                  <span className="relative w-4 h-4 inline-block">
                    <Image src="/icons/checkmark.png" alt="" fill className="object-contain brightness-0 invert" />
                  </span>
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <span className="relative w-4 h-4 inline-block">
                    <Image src="/icons/checkmark.png" alt="" fill className="object-contain brightness-0 invert" />
                  </span>
                  Free to join
                </span>
                <span className="flex items-center gap-1">
                  <span className="relative w-4 h-4 inline-block">
                    <Image src="/icons/checkmark.png" alt="" fill className="object-contain brightness-0 invert" />
                  </span>
                  Cancel anytime
                </span>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Quick Stats</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Jobs Posted Monthly', sublabel: 'Active opportunities', value: '5,000+', color: 'bg-[#E86A33]/10', valueColor: 'text-[#E86A33]' },
                    { label: 'Average Job Value', sublabel: 'Across all trades', value: '£450', color: 'bg-green-50', valueColor: 'text-green-600' },
                    { label: 'Active Contractors', sublabel: 'And growing', value: '10,000+', color: 'bg-blue-50', valueColor: 'text-blue-600' },
                  ].map((stat, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 ${stat.color} rounded-xl`}>
                      <div>
                        <p className="font-semibold text-slate-900">{stat.label}</p>
                        <p className="text-sm text-slate-500">{stat.sublabel}</p>
                      </div>
                      <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Join the Reactive Network?
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to grow your trade business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-shadow group">
                <div className="relative w-14 h-14 mb-4 group-hover:scale-110 transition-transform">
                  <Image src={benefit.icon} alt="" fill className="object-contain" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-[#E86A33]/20" />
                )}
                <div className="relative text-center">
                  <div className="w-16 h-16 bg-[#E86A33] rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/register?role=contractor">
              <Button size="lg" className="h-14 px-10 text-lg">
                Create Your Free Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-slate-600 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">£0</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  { text: 'Directory listing', included: true },
                  { text: 'Business profile page', included: true },
                  { text: 'Bid on jobs (pay per lead)', included: true },
                  { text: 'Customer reviews', included: true },
                  { text: 'Unlock fee per lead', included: false },
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 ${item.included ? 'text-slate-600' : 'text-slate-400'}`}>
                    <div className="relative w-5 h-5">
                      <Image 
                        src={item.included ? '/icons/checkmark.png' : '/icons/checkmark.png'} 
                        alt="" 
                        fill 
                        className={`object-contain ${item.included ? '' : 'opacity-30'}`} 
                      />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register?role=contractor">
                <Button variant="outline" size="lg" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-[#E86A33] to-orange-500 rounded-2xl p-8 text-white relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-1 rounded-full">
                BEST VALUE
              </span>
              <h3 className="text-2xl font-bold mb-2">Pro Subscription</h3>
              <p className="text-orange-100 mb-6">For serious tradespeople</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">£29.99</span>
                <span className="text-orange-200">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Everything in Free',
                  'Unlimited job unlocks',
                  'Priority in search results',
                  'Verified Pro badge',
                  'Analytics dashboard',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="relative w-5 h-5">
                      <Image src="/icons/checkmark.png" alt="" fill className="object-contain brightness-0 invert" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register?role=contractor&plan=pro">
                <Button size="lg" className="w-full bg-white text-[#E86A33] hover:bg-orange-50">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-slate-500 mt-8">
            No contracts. Cancel anytime. All plans include our money-back guarantee.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-slate-600">
              Hear from contractors who&apos;ve grown with us
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="relative w-5 h-5">
                      <Image src="/icons/star.png" alt="" fill className="object-contain" />
                    </div>
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.trade}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                    {testimonial.jobs}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#E86A33] to-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-orange-100 mb-10">
            Join 10,000+ contractors already winning work on the Reactive Network
          </p>
          <Link href="/auth/register?role=contractor">
            <Button size="lg" className="bg-white text-[#E86A33] hover:bg-orange-50 h-14 px-10 text-lg shadow-lg">
              Create Your Free Profile
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
