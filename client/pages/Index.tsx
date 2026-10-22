import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ArrowRight,
  Users,
  Calendar,
  Target,
  Zap,
  Brain,
  Clock,
  ChevronRight,
  Play,
  BarChart3,
  Shield,
  Globe,
  Smartphone,
  Star,
  Award,
  TrendingUp,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Download,
  Lightbulb,
  Rocket,
  Timer,
  Heart,
  BookOpen,
  Layers,
  Compass,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  // Add custom CSS for animations
  const customStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes gradientX {
      0%, 100% { background-size: 200% 200%; background-position: left center; }
      50% { background-size: 200% 200%; background-position: right center; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    .animate-fade-in { animation: fadeIn 0.6s ease-out; }
    .animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }
    .animate-gradient-x { animation: gradientX 4s ease infinite; }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animation-delay-200 { animation-delay: 0.2s; }
    .animation-delay-400 { animation-delay: 0.4s; }
    .animation-delay-600 { animation-delay: 0.6s; }
    .animation-delay-800 { animation-delay: 0.8s; }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }
  `;

  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = customStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Get dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning!";
    if (hour >= 12 && hour < 17) return "Good afternoon!";
    if (hour >= 17 && hour < 22) return "Good evening!";
    return "Hello there!";
  };

  // Add smooth scrolling behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  const faqData = [
    {
      question: "Is Trifocus really free?",
      answer:
        "Yes! Trifocus is completely free to start. We believe everyone deserves access to great productivity tools. We'll introduce optional premium features in the future, but core functionality will always be free.",
    },
    {
      question: "How does the AI learn my patterns?",
      answer:
        "Our AI analyzes your mood check-ins, task completion patterns, and timing preferences to make personalized suggestions. All learning happens locally and privately - we never store or share your personal data.",
    },
    {
      question: "Can I use it on my phone?",
      answer:
        "Absolutely! Trifocus works on any device with a web browser. Your data syncs seamlessly across all devices.",
    },
    {
      question: "What makes this different from other productivity apps?",
      answer:
        "Trifocus uniquely combines mood tracking with productivity. Instead of just managing tasks, we help you understand when you're most productive and suggest the right work for your current energy level.",
    },
    {
      question: "How do I get started?",
      answer:
        "Simply click 'Get Started' and you'll be guided through a quick 2-minute setup. Add your first mood check-in, create a task, and start building productive habits immediately.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/95 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 group-hover:scale-105 transition-all duration-300">
              {/* Animated focus logo with pulsing rings */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xl">
                  {/* Animated focus target */}
                  <div className="relative w-6 h-6">
                    {/* Outer ring - slow pulse */}
                    <div
                      className="absolute inset-0 border-2 border-white/40 rounded-full animate-pulse"
                      style={{ animationDuration: "2s" }}
                    ></div>
                    {/* Middle ring - medium pulse */}
                    <div
                      className="absolute inset-1 border-2 border-white/60 rounded-full animate-pulse"
                      style={{
                        animationDuration: "1.5s",
                        animationDelay: "0.3s",
                      }}
                    ></div>
                    {/* Inner ring - fast pulse */}
                    <div
                      className="absolute inset-2 border-2 border-white/80 rounded-full animate-pulse"
                      style={{
                        animationDuration: "1s",
                        animationDelay: "0.6s",
                      }}
                    ></div>
                    {/* Center dot - always solid */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                    {/* Rotating focus indicator */}
                    <div
                      className="absolute inset-0 animate-spin"
                      style={{ animationDuration: "8s" }}
                    >
                      <div className="w-1 h-1 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center relative">
              <span className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                Trifocus
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide transition-opacity duration-300 group-hover:opacity-100 opacity-0 absolute top-6 left-0 whitespace-nowrap">
                AI PRODUCTIVITY
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#how-it-works"
              className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium relative group"
            >
              How it Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#why-choose"
              className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium relative group"
            >
              Why Choose
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#faq"
              className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium relative group"
            >
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/signin">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-105"
              >
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 hover:shadow-lg transition-all duration-300">
                Get started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all duration-300"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-600" />
            ) : (
              <Menu className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 border-t border-slate-200 bg-white/95 backdrop-blur-sm">
            <nav className="flex flex-col space-y-4">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50"
              >
                How it Works
              </a>
              <a
                href="#why-choose"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50"
              >
                Why Choose
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-600 hover:text-blue-600 transition-all duration-300 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50"
              >
                FAQ
              </a>
              <div className="pt-4 border-t border-slate-200 flex flex-col space-y-3">
                <Link to="/signin" className="w-full">
                  <Button
                    variant="ghost"
                    className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 justify-start w-full"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup" className="w-full">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full">
                    Get started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
          <div className="absolute -top-10 left-1/2 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              variant="outline"
              className="mb-6 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:scale-105 transition-all duration-300 animate-fade-in"
            >
              ⚡ AI-powered productivity for modern professionals
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6 animate-fade-in-up animation-delay-200">
              {getGreeting()}
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
                Ready to focus?
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
              Track your mood, manage tasks with AI suggestions, build habits,
              and maintain focus. All in one beautifully designed workspace that
              adapts to your daily rhythm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up animation-delay-600">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 hover:scale-105 hover:shadow-xl transition-all duration-300 group"
                >
                  <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Start Your 7-Day Streak
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 px-8 hover:scale-105 transition-all duration-300 group"
              >
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                See it in action
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-slate-500 animate-fade-in-up animation-delay-800">
              <div className="flex items-center hover:text-emerald-600 transition-colors duration-300 group">
                <Check className="w-4 h-4 mr-2 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                Free to start
              </div>
              <div className="flex items-center hover:text-emerald-600 transition-colors duration-300 group">
                <Check className="w-4 h-4 mr-2 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                No setup required
              </div>
              <div className="flex items-center hover:text-emerald-600 transition-colors duration-300 group">
                <Check className="w-4 h-4 mr-2 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                Works everywhere
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Your productivity dashboard
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Get a preview of how Trifocus will help you stay organized,
              motivated, and focused throughout your day.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent h-1/2 bottom-0"></div>
            <div className="relative bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-slate-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-400 rounded-full"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs sm:text-sm text-slate-500">
                      app.trifocus.com
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Dashboard - Simple Dashboard View Only */}
              <div className="sm:hidden bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* App Header */}
                <div className="bg-white px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                          <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xl">
                            <div className="relative w-5 h-5">
                              <div
                                className="absolute inset-0 border border-white/40 rounded-full animate-pulse"
                                style={{ animationDuration: "2s" }}
                              ></div>
                              <div
                                className="absolute inset-0.5 border border-white/60 rounded-full animate-pulse"
                                style={{
                                  animationDuration: "1.5s",
                                  animationDelay: "0.3s",
                                }}
                              ></div>
                              <div
                                className="absolute inset-1 border border-white/80 rounded-full animate-pulse"
                                style={{
                                  animationDuration: "1s",
                                  animationDelay: "0.6s",
                                }}
                              ></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                              <div
                                className="absolute inset-0 animate-spin"
                                style={{ animationDuration: "8s" }}
                              >
                                <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        Trifocus
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-5 5v-5z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4"
                          />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-6 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {getGreeting()}, Alex!
                    </h2>
                    <span className="text-xl">👋</span>
                  </div>

                  {/* Today's Tasks */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                      Today's Tasks
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Morning workout
                          </div>
                          <div className="text-xs text-gray-500">
                            Completed 2 hours ago
                          </div>
                        </div>
                        <div className="text-emerald-600 text-xs font-medium">
                          Done
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Client proposal
                          </div>
                          <div className="text-xs text-gray-500">
                            Due in 1 hour
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Active
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Website mockups
                          </div>
                          <div className="text-xs text-gray-500">
                            Later today
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs">Pending</div>
                      </div>
                    </div>
                  </div>

                  {/* Focus Session */}
                  <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-orange-800 font-medium">
                        Focus Time
                      </div>
                      <button className="w-auto bg-orange-600 text-white text-xs px-3 py-1 rounded-full hover:bg-orange-700 transition-colors">
                        Start
                      </button>
                    </div>
                    <div className="text-lg font-bold text-orange-900">
                      25:00
                    </div>
                    <div className="text-xs text-orange-700">
                      Pomodoro session ready
                    </div>
                  </div>

                  {/* Today's Habits */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                      Today's Habits
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">🧘</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Meditation
                          </div>
                          <div className="text-xs text-gray-500">
                            7-day streak
                          </div>
                        </div>
                      </div>
                      <button className="w-auto bg-blue-600 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
                        Start now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="bg-white border-t border-gray-100 px-6 py-4">
                  <div className="flex items-center justify-around">
                    <button className="flex flex-col items-center space-y-1 text-blue-600">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">Home</span>
                    </button>
                    <button className="flex flex-col items-center space-y-1 text-gray-400">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs">Tasks</span>
                    </button>
                    <button className="flex flex-col items-center space-y-1 text-gray-400">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="text-xs">Habits</span>
                    </button>
                    <button className="flex flex-col items-center space-y-1 text-gray-400">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4" />
                      </div>
                      <span className="text-xs">Mood</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Dashboard Layout */}
              <div className="hidden sm:flex">
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 p-6">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-sm">
                        <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg">
                          <div className="relative w-4 h-4">
                            <div
                              className="absolute inset-0 border border-white/40 rounded-full animate-pulse"
                              style={{ animationDuration: "2s" }}
                            ></div>
                            <div
                              className="absolute inset-0.5 border border-white/60 rounded-full animate-pulse"
                              style={{
                                animationDuration: "1.5s",
                                animationDelay: "0.3s",
                              }}
                            ></div>
                            <div
                              className="absolute inset-1 border border-white/80 rounded-full animate-pulse"
                              style={{
                                animationDuration: "1s",
                                animationDelay: "0.6s",
                              }}
                            ></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                            <div
                              className="absolute inset-0 animate-spin"
                              style={{ animationDuration: "8s" }}
                            >
                              <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-slate-900">
                      Trifocus
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-3 p-2 bg-blue-50 text-blue-700 rounded-lg">
                      <div className="w-4 h-4 bg-blue-600 rounded"></div>
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tasks</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <Target className="w-4 h-4" />
                      <span>Habits</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <BookOpen className="w-4 h-4" />
                      <span>Journal</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <Brain className="w-4 h-4" />
                      <span>Mood Tracker</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <Clock className="w-4 h-4" />
                      <span>Focus Timer</span>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 lg:p-8 bg-white">
                  {/* Greeting Banner */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold mb-2">
                          {getGreeting().slice(0, -1)}, Alex!
                        </h2>
                        <p className="text-blue-100">
                          You have 3 tasks and 2 habits planned for today
                        </p>
                        <div className="flex items-center space-x-4 mt-4">
                          <Button
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                          >
                            📋 Today's Tasks
                          </Button>
                          <Button
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                          >
                            🎯 Start Focus Session
                          </Button>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-blue-100 mb-1">
                          Current Streak
                        </div>
                        <div className="text-3xl font-bold">7 days</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Mood */}
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3">Today's Mood</h3>
                          <div className="text-center">
                            <div className="text-4xl mb-2">😊</div>
                            <div className="text-sm font-medium text-slate-900">
                              Energetic & Focused
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tasks */}
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3">Today's Tasks</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3 p-2 bg-emerald-50 rounded-lg">
                              <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm line-through">
                                  Client proposal
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                              <div className="w-4 h-4 border-2 border-blue-600 rounded-full"></div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  Website mockups
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* AI Suggestions */}
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3">AI Suggestions</h3>
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-700 mb-2">
                                Great time to tackle that website task!
                              </p>
                              <Button
                                size="sm"
                                className="bg-blue-600 text-white text-xs px-3 py-1"
                              >
                                Let's Do It
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Habits */}
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3">Today's Habits</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🧘</span>
                                <div>
                                  <div className="text-sm font-medium">
                                    Meditation
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    7 day streak
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-emerald-600 font-medium">
                                Done
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">💪</span>
                                <div>
                                  <div className="text-sm font-medium">
                                    Workout
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    3 day streak
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs px-2 py-1"
                              >
                                Mark Done
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Unique Bento Grid Layout */}
      <section className="py-20 bg-slate-50" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need for productive days
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Mood tracking, AI suggestions, task management, and habit building
              - all working together to help you thrive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Large feature - Mood Tracking */}
            <div className="md:col-span-2 lg:col-span-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 lg:p-8 border border-orange-100 hover:border-orange-200 hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <span className="text-3xl group-hover:animate-bounce animate-mood-float">
                    😊
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                    Mood Tracking
                  </h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    Track your daily energy and emotions with simple emoji
                    check-ins. Our AI learns your patterns to suggest optimal
                    work times.
                  </p>
                  <div className="flex space-x-2">
                    {["😊", "😐", "🤔", "😴", "🥳"].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-white/60 rounded-lg flex items-center justify-center text-lg hover:scale-125 hover:bg-white/80 transition-all duration-300 cursor-pointer"
                      >
                        <span
                          className="animate-mood-sway"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        >
                          {emoji}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="md:col-span-1 lg:col-span-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Sparkles className="w-6 h-6 text-white animate-ai-thinking group-hover:animate-pulse group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                AI Suggestions
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Get personalized recommendations based on your patterns and
                mood.
              </p>
            </div>

            {/* Smart Tasks */}
            <div className="md:col-span-1 lg:col-span-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg relative">
                <div className="absolute inset-0 rounded-xl border-2 border-white/30 opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-opacity duration-300"></div>
                <CheckCircle2 className="w-6 h-6 text-white animate-smart-task-progress group-hover:scale-110 group-hover:animate-pulse transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors duration-300">
                Smart Tasks
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Organize tasks by priority with time estimates and categories.
              </p>
            </div>

            {/* Habit Building */}
            <div className="md:col-span-2 lg:col-span-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 lg:p-8 border border-purple-100 hover:border-purple-200 hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg relative">
                <div className="absolute inset-2 rounded-full border border-white/40 group-hover:animate-ping"></div>
                <Target className="w-8 h-8 text-white animate-habit-circle group-hover:animate-pulse" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                Habit Building
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Build lasting habits with progress tracking and streak counters.
                Our system adapts to your schedule and provides gentle
                reminders.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all duration-300 group/item">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg group-hover/item:scale-110 transition-transform duration-300 animate-meditation-breathe">
                      🧘
                    </span>
                    <span className="font-medium text-sm">
                      Morning Meditation
                    </span>
                  </div>
                  <div className="text-xs text-purple-600 font-medium">
                    7 day streak!
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all duration-300 group/item">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg group-hover/item:scale-110 transition-transform duration-300 animate-exercise-bounce">
                      💪
                    </span>
                    <span className="font-medium text-sm">Daily Exercise</span>
                  </div>
                  <div className="text-xs text-purple-600 font-medium">
                    3 day streak
                  </div>
                </div>
              </div>
            </div>

            {/* Journal & Notes */}
            <div className="md:col-span-1 lg:col-span-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 hover:border-amber-200 hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <BookOpen className="w-6 h-6 text-white animate-journal-open-close group-hover:animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors duration-300">
                Journal & Notes
              </h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Capture thoughts, reflections, and ideas with rich text
                journaling and quick notes.
              </p>
              <div className="bg-white/60 rounded-lg p-3 border border-amber-200 text-xs text-slate-600 hover:bg-white/80 transition-all duration-300">
                <div className="mb-2 font-medium">Today's reflection:</div>
                <div className="italic">
                  "Feeling productive after that focused work session..."
                </div>
              </div>
            </div>

            {/* Calendar Sync */}
            <div className="md:col-span-1 lg:col-span-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100 hover:border-cyan-200 hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Calendar className="w-6 h-6 text-white animate-calendar-modern-slide group-hover:animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">
                Calendar Sync
              </h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Seamlessly sync with your existing calendar and never miss
                important events.
              </p>
              <div className="bg-white/60 rounded-lg p-3 border border-cyan-200 hover:bg-white/80 transition-all duration-300">
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>9:00 AM - Team standup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>2:00 PM - Client call</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Flexible Workflow Layout */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Trifocus adapts to your unique workflow
            </h2>
            <p className="text-lg text-slate-600">
              Whether you work in structured routines or handle individual tasks
              as they come - Trifocus flexibly supports your style
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Left Column - Flexible Workflows */}
            <div className="space-y-6 md:space-y-8">
              <div className="text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
                  Works with any workflow
                </h3>
                <p className="text-slate-600">
                  Trifocus adapts to how you naturally work - no rigid processes
                  required
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-2">
                        Quick task capture
                      </h4>
                      <p className="text-slate-600 text-sm">
                        Got a random task? Just add it. No need to plan your
                        whole day first.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-2">
                        Smart suggestions
                      </h4>
                      <p className="text-slate-600 text-sm">
                        AI learns your patterns and suggests what to work on
                        based on your current mood and energy.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Timer className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-2">
                        Flexible focus
                      </h4>
                      <p className="text-slate-600 text-sm">
                        Use focus timers when you need them, skip them when you
                        don't. Your choice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Key Features */}
            <div className="space-y-6 md:space-y-8">
              <div className="text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
                  Essential tools included
                </h3>
                <p className="text-slate-600">
                  Everything you need for productivity and well-being in one
                  place
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl">😊</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Mood Tracking
                  </h4>
                  <p className="text-slate-600 text-xs">Daily check-ins</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Task Manager
                  </h4>
                  <p className="text-slate-600 text-xs">
                    Organize & prioritize
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Habit Builder
                  </h4>
                  <p className="text-slate-600 text-xs">Streak tracking</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Journal & Notes
                  </h4>
                  <p className="text-slate-600 text-xs">Capture thoughts</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    Focus Timer
                  </h4>
                  <p className="text-slate-600 text-xs">Pomodoro & custom</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                    AI Insights
                  </h4>
                  <p className="text-slate-600 text-xs">Smart suggestions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Use it your way
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Whether you're a structured planner or spontaneous doer, prefer
              daily routines or work in bursts - Trifocus adapts to your natural
              style without forcing rigid workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-600 mr-2" />
                Quick individual tasks
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-600 mr-2" />
                Structured daily planning
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-600 mr-2" />
                Flexible habit building
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Trifocus - Icon Grid Layout */}
      <section className="py-20 bg-slate-50" id="why-choose">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why choose Trifocus?
            </h2>
            <p className="text-lg text-slate-600">
              Built with modern professionals in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Wellness-First Design",
                description:
                  "Unlike other productivity apps, we prioritize your mental health with mood tracking and stress-aware scheduling.",
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: Brain,
                title: "Smart AI Assistant",
                description:
                  "Our AI learns your patterns and suggests the right tasks at the right time, making you more productive naturally.",
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: Layers,
                title: "All-in-One Platform",
                description:
                  "Tasks, habits, mood tracking, and focus sessions - everything you need in one beautiful, cohesive experience.",
                color: "from-purple-500 to-pink-600",
              },
              {
                icon: Rocket,
                title: "Quick Setup",
                description:
                  "Start being productive in under 2 minutes. No complex setup, no overwhelming features - just what you need.",
                color: "from-orange-500 to-red-500",
              },
              {
                icon: Globe,
                title: "Cross-Platform",
                description:
                  "Access your productivity dashboard from anywhere - web, mobile, or desktop. Your data syncs seamlessly.",
                color: "from-cyan-500 to-blue-600",
              },
              {
                icon: Shield,
                title: "Privacy Focused",
                description:
                  "Your personal data stays private. We use privacy-first AI that learns without storing sensitive information.",
                color: "from-emerald-500 to-green-600",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group hover:scale-105 transition-transform duration-300"
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-full">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Early Adopter Benefits - Split Layout */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge
                variant="outline"
                className="mb-6 border-white/30 text-white bg-white/10 backdrop-blur-sm"
              >
                🚀 Join the productivity revolution
              </Badge>
              <h2 className="text-4xl font-bold text-white mb-6">
                Be among the first to experience the future of productivity
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                As an early adopter, you'll help shape Trifocus while enjoying
                lifetime benefits and exclusive features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 px-8 shadow-lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Start Free Today
                  </Button>
                </Link>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm px-8"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl mb-4">🎁</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Early Access
                </h3>
                <p className="text-blue-100">
                  Get new features before anyone else and influence our roadmap
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Lifetime Benefits
                </h3>
                <p className="text-blue-100">
                  Lock in special pricing and exclusive features for life
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Direct Impact
                </h3>
                <p className="text-blue-100">
                  Your feedback directly shapes how Trifocus evolves
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Collapsible */}
      <section className="py-20 bg-slate-50" id="faq">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about getting started
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-4">
                    <p className="text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Ready to transform your daily routine?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join the productivity revolution. Start building better habits and
            achieving your goals with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12"
              >
                Start Your Journey
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 px-12"
            >
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            Join thousands building better habits • Free forever • No credit
            card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-sm">
                    <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg">
                      <div className="relative w-5 h-5">
                        {/* Animated focus rings */}
                        <div
                          className="absolute inset-0 border border-white/40 rounded-full animate-pulse"
                          style={{ animationDuration: "2s" }}
                        ></div>
                        <div
                          className="absolute inset-0.5 border border-white/60 rounded-full animate-pulse"
                          style={{
                            animationDuration: "1.5s",
                            animationDelay: "0.3s",
                          }}
                        ></div>
                        <div
                          className="absolute inset-1 border border-white/80 rounded-full animate-pulse"
                          style={{
                            animationDuration: "1s",
                            animationDelay: "0.6s",
                          }}
                        ></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                        <div
                          className="absolute inset-0 animate-spin"
                          style={{ animationDuration: "8s" }}
                        >
                          <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-xl">Trifocus</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The productivity platform that understands your daily rhythm and
                helps you build better habits.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center hover:bg-slate-600">
                    <span className="text-xs">𝕏</span>
                  </div>
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center hover:bg-slate-600">
                    <span className="text-xs">in</span>
                  </div>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <a
                  href="#features"
                  className="block hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="block hover:text-white transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="#why-choose"
                  className="block hover:text-white transition-colors"
                >
                  Why Choose
                </a>
                <a
                  href="#faq"
                  className="block hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Account</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <Link
                  to="/signin"
                  className="block hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  to="/forgot-password"
                  className="block hover:text-white transition-colors"
                >
                  Reset Password
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <a
                  href="#faq"
                  className="block hover:text-white transition-colors"
                >
                  Help Center
                </a>
                <a
                  href="mailto:support@trifocus.com"
                  className="block hover:text-white transition-colors"
                >
                  Contact
                </a>
                <a
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Status
                </a>
                <a
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Feedback
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2025 Trifocus. Built with ❤️ for productive minds.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
