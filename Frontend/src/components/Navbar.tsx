import { useState, useEffect } from "react";
import { Scale, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "glass" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">LawGPT</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="#about"
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              About
            </a>
            <button 
              onClick={() => navigate("/chat")}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:shadow-glow"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Open Chat</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}