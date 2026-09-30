"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Mic, FileText, Brain, Activity, BarChart, ArrowRight } from "lucide-react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get('/health/');
        if (response.data.status === 'ok') {
          setBackendStatus("Backend: Connected");
        } else {
          setBackendStatus("Backend: Offline");
        }
      } catch (error) {
        setBackendStatus("Backend: Offline");
      }
    };
    
    checkBackend();
  }, []);

  const features = [
    {
      title: "AI-Powered Interviews",
      description: "Engage in realistic, dynamic interviews with our advanced AI.",
      icon: <Brain className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Resume-Based Questions",
      description: "Get personalized questions based on your specific experience.",
      icon: <FileText className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Adaptive Questioning",
      description: "Questions adapt to your skill level in real-time.",
      icon: <Activity className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Voice Interaction",
      description: "Practice your verbal communication with voice support.",
      icon: <Mic className="w-8 h-8 text-blue-500" />
    },
    {
      title: "AI Performance Analysis",
      description: "Receive instant, detailed feedback on your answers.",
      icon: <BarChart className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Detailed Interview Reports",
      description: "Review comprehensive reports to track your progress.",
      icon: <FileText className="w-8 h-8 text-blue-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b">
        <h1 className="text-xl font-bold text-slate-900">AI Interview System</h1>
        <div className="flex items-center gap-4">
          <span className={`text-sm px-3 py-1 rounded-full ${backendStatus.includes('Connected') ? 'bg-green-100 text-green-700' : backendStatus.includes('Checking') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {backendStatus}
          </span>
          <Button variant="outline">Sign In</Button>
        </div>
      </header>

      {/* Hero */}
      <main className="px-6 py-20 max-w-5xl mx-auto text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
          Your AI-Powered Personal Interviewer
        </h2>
        <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Practice realistic interviews, receive instant AI feedback, and improve your interview performance.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            Start Interview <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>

        {/* Features */}
        <section className="mt-32">
          <h3 className="text-3xl font-bold text-slate-900 mb-12">Powerful Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow text-left">
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mt-32 bg-slate-900 text-white rounded-3xl p-12 text-left shadow-xl">
          <h3 className="text-3xl font-bold mb-10 text-center">How it works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              "Upload Resume",
              "Select Job Role",
              "Take AI Interview",
              "Get Detailed Feedback"
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  {i + 1}
                </div>
                <h4 className="font-semibold text-lg">{step}</h4>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12 mt-20 text-center text-slate-500">
        <p>© {new Date().getFullYear()} AI Interview System. All rights reserved.</p>
      </footer>
    </div>
  );
}
