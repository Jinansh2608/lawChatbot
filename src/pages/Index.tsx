import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutCards from "@/components/AboutCards";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <AboutCards />
      <Footer />
    </div>
  );
};

export default Index;