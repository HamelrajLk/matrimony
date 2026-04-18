import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SearchSection from "@/components/landing/SearchSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PartnersSection from "@/components/landing/PartnersSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CtaBanner from "@/components/landing/CtaBanner";
import MarqueeBanner from "@/components/landing/MarqueeBanner";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        background: "#FFFBF7",
        color: "#2A1A1A",
        overflowX: "hidden",
      }}
    >
      <Navbar />
      <HeroSection />
      <SearchSection />
      <FeaturesSection />
      <PartnersSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaBanner />
      <MarqueeBanner />
      <Footer />
    </div>
  );
}
