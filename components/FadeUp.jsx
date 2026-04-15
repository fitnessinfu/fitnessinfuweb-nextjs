'use client';

import { useEffect, useRef } from 'react';

export default function FadeUp({ children, className = '', delay = '', style = {} }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = ['fade-up', delay, className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes} style={style}>
      {children}
    </div>
  );
}
