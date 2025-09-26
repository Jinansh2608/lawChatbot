import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutCards from "@/components/AboutCards";
import ChatbotModal from "@/components/ChatbotModal";
import Footer from "@/components/Footer";

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero onOpenChat={() => setIsChatOpen(true)} />
      <AboutCards />
      <Footer />
      <ChatbotModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Index;