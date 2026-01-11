import Link from "next/link";
import Image from "next/image";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/Button";

const tradeCategories = [
  { name: 'Plumbing', icon: '/icons/wrench.png', jobs: '2,450+', href: '/contractors?trade=plumbing' },
  { name: 'Electrical', icon: '/icons/lightning.png', jobs: '1,890+', href: '/contractors?trade=electrical' },
  { name: 'Carpentry', icon: '/icons/hammer.png', jobs: '1,230+', href: '/contractors?trade=carpentry' },
  { name: 'Painting', icon: '/icons/paintbrush.png', jobs: '980+', href: '/contractors?trade=painting' },
  { name: 'Roofing', icon: '/icons/roof.png', jobs: '750+', href: '/contractors?trade=roofing' },
  { name: 'Landscaping', icon: '/icons/tree.png', jobs: '1,100+', href: '/contractors?trade=landscaping' },
  { name: 'Cleaning', icon: '/icons/sparkle.png', jobs: '2,100+', href: '/contractors?trade=cleaning' },
  { name: 'HVAC', icon: '/icons/snowflake.png', jobs: '680+', href: '/contractors?trade=hvac' },
  { name: 'Plastering', icon: '/icons/trowel.png', jobs: '520+', href: '/contractors?trade=plastering' },
  { name: 'Building', icon: '/icons/building.png', jobs: '890+', href: '/contractors?trade=building' },
  { name: 'Joinery', icon: '/icons/saw.png', jobs: '430+', href: '/contractors?trade=joinery' },
  { name: 'Handyman', icon: '/icons/toolbox.png', jobs: '1,560+', href: '/contractors?trade=handyman' },
];

const galleryImages = [
  { src: '/gallery/kitchen-renovation.jpg', alt: 'Kitchen Renovation', category: 'Kitchen' },
  { src: '/gallery/bathroom-renovation.jpg', alt: 'Bathroom Installation', category: 'Bathroom' },
  { src: '/gallery/electrical-work.jpg', alt: 'Electrical Work', category: 'Electrical' },
  { src: '/gallery/landscaping-work.jpg', alt: 'Garden Landscaping', category: 'Landscaping' },
  { src: '/gallery/roofing-work.jpg', alt: 'Roof Installation', category: 'Roofing' },
  { src: '/gallery/carpentry-work.jpg', alt: 'Custom Joinery', category: 'Carpentry' },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Homeowner, London',
    quote: 'Found an amazing plumber within hours. The quote was competitive and the work was excellent. The Reactive network made it so simple!',
    rating: 5,
    image: '/icons/users.png',
  },
  {
    name: 'Thompson Construction',
    role: 'Contractor Partner',
    quote: 'Joining the Reactive network transformed our business. We have won over 60 jobs in the last 6 months through the platform.',
    rating: 5,
    image: '/icons/users.png',
  },
  {
    name: 'Metro Property Group',
    role: 'Commercial Client',
    quote: 'Managing maintenance across our 25 properties has never been easier. Response times are incredible and contractors are reliable.',
    rating: 5,
    image: '/icons/users.png',
  },
];

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-home.jpg"
            alt="Network Background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-[#E86A33]/20" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8 animate-fade-in">
              <div className="relative w-5 h-5">
                <Image src="/icons/shield.png" alt="" fill sizes="20px" className="object-contain" />
              </div>
              <span className="text-white/90 text-sm font-medium">Verified Contractors Only</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] animate-slide-up">
              Find Trusted Local
              <span className="block text-[#E86A33]">Contractors</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl animate-slide-up stagger-1">
              Access the Reactive Network — Connect with verified plumbers, electricians, builders and more. 
              Get competitive quotes and hire with confidence.
            </p>

            {/* Search Box */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl animate-slide-up stagger-2">
              <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5">
                    <Image src="/icons/search.png" alt="" fill sizes="20px" className="object-contain opacity-50" />
                  </div>
                  <input
                    type="text"
                    placeholder="What do you need done?"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border-0 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#E86A33] focus:bg-white transition-all"
                  />
                </div>
                <div className="flex-1 sm:max-w-[180px] relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10">
                    <Image src="/icons/location.png" alt="" fill sizes="20px" className="object-contain opacity-50" />
                  </div>
                  <input
                    type="text"
                    placeholder="Postcode"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border-0 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#E86A33] focus:bg-white transition-all"
                  />
                </div>
                <Link href="/residential/post-job" className="flex">
                  <Button size="lg" className="h-14 px-8 whitespace-nowrap shadow-lg hover:shadow-xl flex-shrink-0">
                    Get Quotes
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 md:gap-12 mt-12 animate-slide-up stagger-3">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white">50k+</p>
                <p className="text-slate-400 text-sm">Jobs Completed</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white">10k+</p>
                <p className="text-slate-400 text-sm">Verified Contractors</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl md:text-4xl font-bold text-white">4.8</p>
                <div className="relative w-7 h-7">
                  <Image src="/icons/star.png" alt="" fill sizes="20px" className="object-contain" />
                </div>
                <p className="text-slate-400 text-sm">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Find the Right Professional
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Browse our network of verified contractors across all trades
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tradeCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group bg-slate-50 hover:bg-[#E86A33] rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="relative w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Image
                    src={category.icon}
                    alt={category.name}
                    fill
                    sizes="48px"
                    className="object-contain group-hover:brightness-0 group-hover:invert transition-all"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-white text-center transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-500 group-hover:text-white/80 text-center mt-1 transition-colors">
                  {category.jobs} jobs
                </p>
              </Link>
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
            <p className="text-lg text-slate-600">
              Get your job done in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '1',
                icon: '/icons/document.png',
                title: 'Describe Your Job',
                desc: 'Tell us what you need — from simple repairs to full renovations. Add photos for accurate quotes.',
              },
              {
                step: '2',
                icon: '/icons/quote.png',
                title: 'Get Quotes',
                desc: 'Receive up to 5 quotes from verified local contractors. Compare prices, reviews and availability.',
              },
              {
                step: '3',
                icon: '/icons/checkmark.png',
                title: 'Hire & Pay Safely',
                desc: 'Choose your contractor and book the job. Pay securely through our platform with full protection.',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                    <div className="relative w-12 h-12">
                      <Image src={item.icon} alt="" fill sizes="48px" className="object-contain" />
                    </div>
                  </div>
                  <span className="absolute -top-3 -left-3 w-10 h-10 bg-[#E86A33] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/residential/post-job">
              <Button size="lg" className="h-14 px-10 text-lg shadow-lg hover:shadow-xl">
                Post Your Job Now — It&apos;s Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Homeowners & Business Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Residential */}
            <Link href="/residential" className="group">
              <div className="relative h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-10 overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E86A33]/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative w-12 h-12 bg-[#E86A33]/20 rounded-xl flex items-center justify-center">
                      <Image src="/icons/home.png" alt="" fill sizes="48px" className="object-contain p-2" />
                    </div>
                    <span className="text-[#E86A33] font-semibold">For Homeowners</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Access the Reactive Network
                  </h3>
                  <p className="text-slate-300 mb-6">
                    Get quotes from trusted local tradespeople. Compare prices, read reviews, and hire with confidence. It&apos;s free to post a job.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {['Free to post jobs', 'Verified contractors', 'No obligation quotes'].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-300">
                        <div className="relative w-5 h-5">
                          <Image src="/icons/checkmark.png" alt="" fill sizes="20px" className="object-contain" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 text-[#E86A33] font-semibold group-hover:gap-4 transition-all">
                    Post a Job
                    <div className="relative w-5 h-5">
                      <Image src="/icons/arrow.png" alt="" fill sizes="20px" className="object-contain" />
                    </div>
                  </span>
                </div>
              </div>
            </Link>

            {/* Commercial */}
            <Link href="/commercial" className="group">
              <div className="relative h-full bg-gradient-to-br from-[#E86A33] to-[#C85A28] rounded-3xl p-8 md:p-10 overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Image src="/icons/briefcase.png" alt="" fill sizes="48px" className="object-contain p-2 brightness-0 invert" />
                    </div>
                    <span className="text-white/90 font-semibold">For Business</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Be Part of the Reactive Network
                  </h3>
                  <p className="text-white/90 mb-6">
                    Streamline facilities management across all locations. Access vetted contractors, control costs, and reduce downtime.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {['Multi-location management', 'Dedicated account manager', 'Volume discounts'].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-white/90">
                        <div className="relative w-5 h-5">
                          <Image src="/icons/checkmark.png" alt="" fill sizes="20px" className="object-contain brightness-0 invert" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 text-white font-semibold group-hover:gap-4 transition-all">
                    Get Started
                    <div className="relative w-5 h-5">
                      <Image src="/icons/arrow.png" alt="" fill sizes="20px" className="object-contain brightness-0 invert" />
                    </div>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Work Gallery */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Quality Work, Every Time
            </h2>
            <p className="text-lg text-slate-400">
              See examples of work completed by our network contractors
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="inline-block px-3 py-1 bg-[#E86A33] text-white text-sm rounded-full">
                    {image.category}
                  </span>
                  <p className="text-white font-medium mt-2">{image.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-slate-600">
              See what our customers and contractors say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <div key={i} className="relative w-5 h-5">
                      <Image src="/icons/star.png" alt="" fill sizes="20px" className="object-contain" />
                    </div>
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 bg-[#E86A33]/10 rounded-full flex items-center justify-center">
                    <Image src={testimonial.image} alt="" fill sizes="48px" className="object-contain p-2" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contractor CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-contractors.jpg"
            alt="Workshop Background"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-[#E86A33]/30" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E86A33]/20 rounded-full mb-6">
                <div className="relative w-5 h-5">
                  <Image src="/icons/gear.png" alt="" fill sizes="20px" className="object-contain" />
                </div>
                <span className="text-[#E86A33] font-medium">For Contractors</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Are You a Contractor?
                <span className="block text-[#E86A33] mt-2">Join the Reactive Network</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Connect with thousands of customers looking for your services. Create your profile, 
                win jobs, and grow your business with our verified contractor network.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                {[
                  { icon: '/icons/users.png', label: '1000s of Customers' },
                  { icon: '/icons/document.png', label: 'Your Own Profile Page' },
                  { icon: '/icons/trophy.png', label: 'Win More Jobs' },
                  { icon: '/icons/shield.png', label: 'Verified Badge' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <Image src={item.icon} alt="" fill sizes="32px" className="object-contain" />
                    </div>
                    <span className="text-white font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contractors/join">
                  <Button size="lg" className="h-14 px-8 text-lg shadow-lg hover:shadow-xl animate-pulse-glow">
                    Join for Free
                  </Button>
                </Link>
                <Link href="/contractors">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-white text-white hover:bg-white/10">
                    Browse Directory
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">Quick Stats</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Jobs Posted Monthly', value: '5,000+', color: 'bg-[#E86A33]/20' },
                    { label: 'Average Job Value', value: '£450', color: 'bg-green-500/20' },
                    { label: 'Active Contractors', value: '10,000+', color: 'bg-blue-500/20' },
                  ].map((stat, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 ${stat.color} rounded-xl`}>
                      <div>
                        <p className="font-semibold text-white">{stat.label}</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-[#E86A33] to-[#C85A28]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of homeowners, businesses, and contractors who trust Reactive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/residential/post-job">
              <Button size="lg" variant="secondary" className="bg-white text-[#E86A33] hover:bg-slate-100 h-14 px-8 text-lg shadow-lg">
                Post a Job
              </Button>
            </Link>
            <Link href="/contractors/join">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-14 px-8 text-lg">
                Join as Contractor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
