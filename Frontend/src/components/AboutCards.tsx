import { Shield, Brain, Zap, BookOpen, Users, Lock } from "lucide-react";

export default function AboutCards() {
  const features = [
    {
      icon: Shield,
      title: "Accurate Legal Answers",
      description: "Powered by Indian Penal Code, FAISS vector database, and RAG technology for precise legal information.",
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      icon: Brain,
      title: "Layman-Friendly Explanations",
      description: "Complex legal jargon simplified into easy-to-understand language for everyone.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: Zap,
      title: "Instant Responses",
      description: "Get immediate answers to your legal queries with our GPT-style conversational interface.",
      gradient: "from-pink-500/20 to-orange-500/20"
    },
    {
      icon: BookOpen,
      title: "Comprehensive Coverage",
      description: "Access information on IPC sections, punishments, bail provisions, and legal procedures.",
      gradient: "from-green-500/20 to-blue-500/20"
    },
    {
      icon: Users,
      title: "Lawyer Verified",
      description: "All responses are structured and verified according to legal standards and best practices.",
      gradient: "from-orange-500/20 to-red-500/20"
    },
    {
      icon: Lock,
      title: "Private & Secure",
      description: "Your conversations are confidential. No personal data is stored or shared.",
      gradient: "from-indigo-500/20 to-purple-500/20"
    }
  ];

  return (
    <section id="about" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="text-gradient">LawGPT</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted AI companion for understanding Indian law and legal rights
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative glass rounded-2xl p-8 hover:shadow-card transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}