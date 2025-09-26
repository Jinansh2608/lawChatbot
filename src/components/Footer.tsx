import { Scale } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-gradient">LawGPT</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Disclaimer
            </a>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © 2025 LawGPT. All rights reserved.
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            Disclaimer: LawGPT provides general legal information and should not be considered as professional legal advice. 
            Always consult with a qualified lawyer for specific legal matters.
          </p>
        </div>
      </div>
    </footer>
  );
}