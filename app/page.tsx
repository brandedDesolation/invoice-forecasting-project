import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import AchieveSection from "@/components/AchieveSection";
import RolesSection from "@/components/RolesSections";
import Testimonials from "@/components/Testimonials";
import Integrations from "@/components/Integrations";
import Resources from "@/components/Resources";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Products />
      <AchieveSection />
      <RolesSection />
      <Testimonials />
      <Integrations />
      <Resources />
      <CTA />
      <Footer />
    </main>
  );
}


