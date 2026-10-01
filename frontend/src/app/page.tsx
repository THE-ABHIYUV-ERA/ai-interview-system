"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mic, Building2, TrendingUp, Users, Play, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("@/components/Hero3D"), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-[#C24E1F]/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C24E1F]" />
          <span className="font-medium tracking-wide text-sm uppercase">Acumen</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Sign In</Link>
          <Button className="bg-[#C24E1F] text-white hover:bg-[#A33D14] rounded-full px-6 h-10 text-sm font-medium transition-colors">Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={stagger}
            className="relative z-10"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C24E1F]" />
              <span className="text-xs font-medium tracking-wide uppercase text-white/80">The new standard for interview prep</span>
            </motion.div>
            
            <motion.div variants={fadeUp}>
              <h1 className="font-[family-name:--font-fraunces] text-6xl md:text-8xl leading-[0.95] tracking-tight mb-6">
                Practice.<br />
                <span className="text-white/40 italic">Prepare.</span><br />
                Perform.
              </h1>
            </motion.div>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/60 mb-10 max-w-md leading-relaxed font-light">
              Elevate your interview technique with hyper-realistic AI simulations. Designed for ambitious professionals aiming for top-tier roles.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-14 px-8 rounded-full bg-[#C24E1F] text-white hover:bg-[#A33D14] text-base font-medium shadow-[0_0_40px_rgba(194,78,31,0.2)] transition-transform hover:scale-[1.02]">
                Start your session <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="ghost" className="h-14 px-8 rounded-full border border-white/10 text-white hover:bg-white/5 text-base font-medium backdrop-blur-sm">
                View methodology
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 1.2 }}
            className="absolute inset-0 md:relative z-0 md:h-[600px] flex items-center justify-center -mr-12 md:-mr-24"
          >
            <Hero3D />
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm font-medium tracking-wide text-white/40 uppercase">Trusted by candidates placed at</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
             <div className="flex items-center gap-2 font-bold text-xl tracking-tighter"><div className="w-6 h-6 rounded bg-white"></div> Vertex</div>
             <div className="flex items-center gap-2 font-bold text-xl tracking-widest uppercase"><div className="w-6 h-6 rounded-full border-2 border-white"></div> Nexus</div>
             <div className="flex items-center gap-2 font-[family-name:--font-fraunces] text-xl italic text-white">Lumina</div>
             <div className="flex items-center gap-2 font-medium text-xl"><Building2 className="w-6 h-6"/> Apex</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-20">
            <h2 className="font-[family-name:--font-fraunces] text-4xl md:text-5xl tracking-tight mb-6">Engineered for excellence.</h2>
            <p className="text-lg text-white/50 leading-relaxed font-light">We replaced generic advice with data-driven feedback, real-time analytics, and hyper-specific role simulations.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Mic,
                title: "Vocal Nuance Analysis",
                desc: "Real-time assessment of pacing, tone, and filler words to ensure you speak with absolute conviction."
              },
              {
                icon: TrendingUp,
                title: "Adaptive Interrogation",
                desc: "The AI dynamically scales question difficulty based on your previous answers, exactly like a real interviewer."
              },
              {
                icon: Users,
                title: "Role-Specific Scenarios",
                desc: "From System Design to Behavioral, practice with scenarios calibrated precisely to your target company and level."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
                className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="mb-6 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                  <feature.icon strokeWidth={1} className="w-5 h-5 text-[#C24E1F]" />
                </div>
                <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-[family-name:--font-fraunces] text-4xl md:text-5xl tracking-tight mb-12">The methodology.</h2>
              <div className="space-y-12">
                {[
                  { icon: Clock, title: "01. Configure your target", desc: "Upload your resume and select your target role and company. The system builds a custom interview profile in seconds." },
                  { icon: Play, title: "02. Engage in the simulation", desc: "Interact via voice with our low-latency AI. Face realistic follow-ups and conversational curveballs." },
                  { icon: CheckCircle2, title: "03. Review the analytics", desc: "Receive a comprehensive post-interview brief detailing your strengths, weaknesses, and concrete areas for improvement." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full border border-[#C24E1F]/30 flex items-center justify-center text-[#C24E1F] bg-[#C24E1F]/5">
                        <step.icon strokeWidth={1.5} className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">{step.title}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-[#0E0E0E]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent p-8 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C24E1F]/80 animate-pulse" />
                  <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Recording</span>
                </div>
                
                <div className="space-y-4 w-3/4">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                  <div className="h-3 bg-white/10 rounded w-4/6" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#C24E1F]">Analysis complete</div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      whileInView={{ width: "78%" }} 
                      transition={{ duration: 1.5 }} 
                      viewport={{ once: true }}
                      className="h-full bg-[#C24E1F]" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-40 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C24E1F] mx-auto mb-8 opacity-50" />
          <h3 className="font-[family-name:--font-fraunces] text-3xl md:text-5xl leading-tight mb-8">
            &quot;The level of feedback I received was indistinguishable from a senior engineering manager at Stripe. It completely transformed my delivery.&quot;
          </h3>
          <p className="text-white/60 font-medium uppercase tracking-widest text-sm">— Sarah J., Senior Frontend Engineer</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-medium mb-8">Ready to master your next interview?</h2>
          <Button size="lg" className="h-14 px-10 rounded-full bg-[#C24E1F] text-white hover:bg-[#A33D14] text-base font-medium shadow-[0_0_30px_rgba(194,78,31,0.2)] transition-transform hover:scale-105">
            Start for free
          </Button>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-white/5 text-center text-sm text-white/30">
        <p>© 2026 Acumen Interview Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
