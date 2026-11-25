'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status
  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data && data.authenticated && data.user) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) setCurrentUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  // For home page, use anchor links; for other pages, use full path
  const navLink = (hash, label) => {
    if (isHome) {
      return (
        <a href={hash} onClick={closeMenu}>
          {label}
        </a>
      );
    }
    return (
      <Link href={`/${hash}`} onClick={closeMenu}>
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <Link href="/" className="nav-brand">
          <Image src="/logo.jpeg" alt="Fitness Infu Logo" width={46} height={46} />
          <div className="nav-brand-text">
            <div className="nav-brand-name">
              FITNESS<span>INFU</span>
            </div>
            <div className="nav-brand-tag">Learn · Perform · Transform</div>
          </div>
        </Link>

        <ul className="nav-links">
          <li>{navLink('#about', 'About')}</li>
          <li>{navLink('#services', 'Programs')}</li>
          <li>{navLink('#testing', 'Testing')}</li>
          <li>{navLink('#philosophy', 'Philosophy')}</li>
          <li>{navLink('#testimonials', 'Results')}</li>
          <li>
            <Link href="/courses" onClick={closeMenu} className={pathname.startsWith('/courses') ? 'active-nav-link' : ''}>
              Courses
            </Link>
          </li>
          <li>
            <Link href="/sleep" onClick={closeMenu}>
              Sleep Test
            </Link>
          </li>
          <li>
            <Link href="/tdee" onClick={closeMenu}>
              TDEE
            </Link>
          </li>
          <li>
            <Link href="/premium-courses" onClick={closeMenu} className="nav-link-premium">
              Premium
            </Link>
          </li>
          <li>{navLink('#contact', 'Contact')}</li>
        </ul>

        <div className="nav-actions">
          {currentUser ? (
            <Link
              href="/user/dashboard"
              className="nav-user-btn authenticated"
              onClick={closeMenu}
              id="nav-user-dashboard-btn"
            >
              MY DASHBOARD
            </Link>
          ) : (
            <Link
              href="/user/login"
              className="nav-user-btn"
              onClick={closeMenu}
              id="nav-login-btn"
            >
              LOGIN AS USER
            </Link>
          )}

          {isHome ? (
            <a href="#contact" className="nav-cta" onClick={closeMenu}>
              Book Assessment
            </a>
          ) : (
            <Link href="/#contact" className="nav-cta" onClick={closeMenu}>
              Book Assessment
            </Link>
          )}
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
        {currentUser ? (
          <Link
            href="/user/dashboard"
            onClick={closeMenu}
            className="mob-user-btn authenticated"
          >
            👤 MY DASHBOARD ({currentUser.name?.split(' ')[0]})
          </Link>
        ) : (
          <Link
            href="/user/login"
            onClick={closeMenu}
            className="mob-user-btn"
          >
            🔑 LOGIN AS USER
          </Link>
        )}

        <Link href="/courses" onClick={closeMenu} className="mob-courses-highlight">
          📚 All Courses (Free &amp; Paid)
        </Link>

        {isHome ? (
          <>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#services" onClick={closeMenu}>Programs</a>
            <a href="#testing" onClick={closeMenu}>Testing</a>
            <a href="#philosophy" onClick={closeMenu}>Philosophy</a>
            <a href="#testimonials" onClick={closeMenu}>Results</a>
          </>
        ) : (
          <>
            <Link href="/#about" onClick={closeMenu}>About</Link>
            <Link href="/#services" onClick={closeMenu}>Programs</Link>
            <Link href="/#testing" onClick={closeMenu}>Testing</Link>
            <Link href="/#philosophy" onClick={closeMenu}>Philosophy</Link>
            <Link href="/#testimonials" onClick={closeMenu}>Results</Link>
          </>
        )}
        <Link href="/sleep" onClick={closeMenu}>Sleep Test</Link>
        <Link href="/tdee" onClick={closeMenu}>TDEE Calculator</Link>
        <Link href="/premium-courses" onClick={closeMenu} className="mob-premium">⭐ Premium Courses</Link>
        {isHome ? (
          <>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <a href="#contact" className="mob-cta" onClick={closeMenu}>
              Book Assessment
            </a>
          </>
        ) : (
          <>
            <Link href="/#contact" onClick={closeMenu}>Contact</Link>
            <Link href="/#contact" className="mob-cta" onClick={closeMenu}>
              Book Assessment
            </Link>
          </>
        )}
      </div>
    </>
  );
}
