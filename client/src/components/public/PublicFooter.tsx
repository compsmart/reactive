'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    homeowners: [
      { label: 'How It Works', href: '/residential#how-it-works' },
      { label: 'Post a Job', href: '/residential/post-job' },
      { label: 'Find Contractors', href: '/contractors' },
      { label: 'Customer Reviews', href: '/reviews' },
    ],
    business: [
      { label: 'Contract Management', href: '/commercial' },
      { label: 'Enterprise Solutions', href: '/commercial#enterprise' },
      { label: 'Get a Demo', href: '/commercial#demo' },
      { label: 'Pricing', href: '/commercial#pricing' },
    ],
    contractors: [
      { label: 'Join the Network', href: '/contractors/join' },
      { label: 'Contractor Directory', href: '/contractors' },
      { label: 'How to Win Jobs', href: '/contractors/join#benefits' },
      { label: 'Subscription Plans', href: '/contractors/join#pricing' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  };

  const trustBadges = [
    { icon: '/icons/shield.png', label: 'Verified Contractors' },
    { icon: '/icons/star.png', label: '4.8/5 Average Rating' },
    { icon: '/icons/checkmark.png', label: '50,000+ Jobs Completed' },
    { icon: '/icons/lock.png', label: 'Secure Payments' },
  ];

  return (
    <footer className="bg-slate-900 text-white relative">
      {/* Top Separator - Creates visual distinction from content above */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E86A33] to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-950/50 to-transparent pointer-events-none" />
      
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <div className="relative h-10 w-32">
                <Image
                  src="/logo-wide.webp"
                  alt="Reactive Ltd"
                  fill
                  sizes="128px"
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-sm text-slate-400 mb-4 max-w-xs">
              Connecting homeowners and businesses with trusted local contractors across the UK.
            </p>
            <p className="text-xs text-slate-500 italic">
              "Be Part of the Reactive Network"
            </p>
          </div>

          {/* Homeowners */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Homeowners</h4>
            <ul className="space-y-3">
              {footerLinks.homeowners.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-[#E86A33] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Business</h4>
            <ul className="space-y-3">
              {footerLinks.business.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-[#E86A33] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contractors */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Contractors</h4>
            <ul className="space-y-3">
              {footerLinks.contractors.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-[#E86A33] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-[#E86A33] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-[#E86A33] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 py-8 border-t border-slate-800">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2 text-slate-400">
              <div className="relative w-6 h-6">
                <Image
                  src={badge.icon}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-contain opacity-80"
                />
              </div>
              <span className="text-sm">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800 gap-4">
          <div className="relative h-8 w-28">
            <Image
              src="/logo-wide.webp"
              alt="Reactive Ltd"
              fill
              sizes="112px"
              className="object-contain"
            />
          </div>
          
          <p className="text-sm text-slate-400 text-center">
            © {currentYear} Reactive Ltd. All rights reserved.
          </p>
          
        </div>
      </div>
    </footer>
  );
}
