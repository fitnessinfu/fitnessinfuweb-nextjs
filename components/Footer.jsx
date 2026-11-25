'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="foot-brand">
        <Image src="/logo.jpeg" alt="Logo" width={36} height={36} />
        <div className="foot-brand-name">
          FITNESS<span>INFU</span>
        </div>
      </div>
      <div className="foot-copy">
        © {new Date().getFullYear()} Fitnessinfu Performance &amp; Wellness · Elakamon, Kerala, India
      </div>
      <div className="foot-links">
        <Link href="/#about">About</Link>
        <Link href="/#services">Programs</Link>
        <Link href="/#testing">Testing</Link>
        <Link href="/#philosophy">Philosophy</Link>
        <Link href="/#contact">Contact</Link>
      </div>
    </footer>
  );
}
