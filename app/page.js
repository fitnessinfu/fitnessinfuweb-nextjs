import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Testing from '@/components/Testing';
import Philosophy from '@/components/Philosophy';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';
import Contact from '@/components/Contact';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Services />
      <Testing />
      <Philosophy />
      <Testimonials />
      <CTA />
      <Contact />
    </main>
  );
}
