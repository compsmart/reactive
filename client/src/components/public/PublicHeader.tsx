'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/residential', label: 'Homeowners' },
    { href: '/commercial', label: 'Business' },
    { href: '/contractors', label: 'Find a Contractor' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' 
        : 'bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative h-10 md:h-12 w-32 md:w-40">
              <Image
                src="/logo-wide.webp"
                alt="Reactive Ltd"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActive(link.href)
                    ? 'text-[#E86A33] bg-orange-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contractors/join">
              <Button variant="ghost" className="text-slate-600 font-medium">
                Join as Contractor
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="md">
                Log In
              </Button>
            </Link>
            <Link href="/residential/post-job">
              <Button size="md" className="shadow-md hover:shadow-lg">
                Get Quotes
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}>
          <nav className="flex flex-col gap-1 pt-2 border-t border-slate-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-orange-50 text-[#E86A33]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 px-4">
              <Link href="/contractors/join" className="w-full">
                <Button variant="outline" className="w-full justify-center">
                  Join as Contractor
                </Button>
              </Link>
              <div className="flex gap-2">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="ghost" className="w-full justify-center border border-slate-200">
                    Log In
                  </Button>
                </Link>
                <Link href="/residential/post-job" className="flex-1">
                  <Button className="w-full justify-center">
                    Get Quotes
                  </Button>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
