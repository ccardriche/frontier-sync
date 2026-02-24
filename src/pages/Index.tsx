import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import anchorLogo from "@/assets/anchor-logo.png";
import { useNavigate } from "react-router-dom";
import { Truck, MapPin, Users, Brain, ArrowRight, Zap, Globe, Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Hero = ({ navigate }: { navigate: (path: string) => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4 py-20">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <Brain className="w-4 h-4" />
              AI-Powered Logistics Intelligence
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-display font-bold mb-6 text-glow"
          >
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              ANCHOR
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={fadeInUp}
            className="text-xl md:text-2xl text-muted-foreground mb-4 font-light"
          >
            The Future of Global Logistics
          </motion.p>

          <motion.p 
            variants={fadeInUp}
            className="text-lg text-muted-foreground/80 mb-10 max-w-2xl mx-auto"
          >
            Connect shippers, drivers, and infrastructure owners on one intelligent platform. 
            From last-mile delivery to cross-continental freight — powered by adaptive AI.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="hero" size="xl" className="w-full sm:w-auto" onClick={() => navigate("/dashboard")}>
              Launch Command Center
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto" onClick={() => navigate("/roles")}>
              Choose Your Role
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating Stats */}
        <motion.div 
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {[
            { label: "Active Jobs", value: "2,847", icon: Truck },
            { label: "Live Drivers", value: "1,234", icon: Users },
            { label: "Countries", value: "48+", icon: Globe },
            { label: "Delivery Rate", value: "99.2%", icon: Shield },
          ].map((stat, index) => (
            <Card key={index} variant="glass" className="text-center p-4 hover:scale-105 transition-transform">
              <CardContent className="p-0">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-display font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 1, duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: Truck,
      title: "Smart Dispatch",
      description: "AI-powered job matching connects the right driver to the right load instantly."
    },
    {
      icon: MapPin,
      title: "Pioneer Mapping",
      description: "Crowdsourced road intelligence — works in low-infrastructure regions with offline sync."
    },
    {
      icon: Brain,
      title: "Agentic AI Brain",
      description: "Self-learning system that optimizes routes, predicts delays, and automates dispatch."
    },
    {
      icon: Zap,
      title: "Real-Time Tracking",
      description: "GPS breadcrumbs with terrain tagging — know exactly where your cargo is."
    },
    {
      icon: Users,
      title: "Multi-Sided Marketplace",
      description: "Shippers, drivers, gig workers, and landowners — all on one platform."
    },
    {
      icon: Shield,
      title: "Verified Network",
      description: "KYC verification for drivers, secure proof-of-delivery, and escrow payments."
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      
      <div className="container relative z-10 px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Built for the <span className="text-primary text-glow">Future</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            ANCHOR combines cutting-edge AI with battle-tested logistics infrastructure
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="glow" className="h-full hover:scale-[1.02] transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = ({ navigate }: { navigate: (path: string) => void }) => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow" />
      
      <div className="container relative z-10 px-4">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Card variant="glow" className="p-8 md:p-12">
            <CardContent className="p-0">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Ready to <span className="text-primary text-glow">Transform</span> Your Logistics?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join the next generation of logistics operators. Whether you ship, drive, or own infrastructure — ANCHOR has you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

const Navbar = ({ navigate }: { navigate: (path: string) => void }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={anchorLogo} alt="Anchor Logo" className="w-14 h-14 rounded" />
          <span className="font-display text-xl font-bold text-primary">ANCHOR</span>
        </div>

        {/* Desktop buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth?tab=login")}>Sign In</Button>
          <Button variant="hero" size="sm" onClick={() => navigate("/auth?tab=signup")}>Sign Up</Button>
        </div>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-border/30 glass overflow-hidden"
          >
            <div className="container px-4 py-4 flex flex-col gap-3">
              <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/auth?tab=login"); setMobileOpen(false); }}>
                Sign In
              </Button>
              <Button variant="hero" className="w-full" onClick={() => { navigate("/auth?tab=signup"); setMobileOpen(false); }}>
                Sign Up
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar navigate={navigate} />
      <Hero navigate={navigate} />
      <Features />
      <CTA navigate={navigate} />
    </div>
  );
};

export default Index;
