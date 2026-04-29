"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { ResumeTemplate } from "./components/ResumeTemplate";
import Script from "next/script";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "./context/AuthContext";
const PDFPreview = dynamic(() => import("./components/PDFPreview"), { ssr: false });
const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then(mod => mod.PDFDownloadLink), { ssr: false });

// --- SVG Icon Components ---
function CloudUploadIcon({ className = "" }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 34C9.58 34 6 30.42 6 26C6 22.14 8.72 18.94 12.34 18.18C12.12 17.48 12 16.76 12 16C12 11.58 15.58 8 20 8C23.26 8 26.08 9.94 27.42 12.72C28.22 12.26 29.08 12 30 12C33.32 12 36 14.68 36 18C36 18.36 35.96 18.72 35.9 19.06C39.38 19.64 42 22.58 42 26.16C42 30.14 38.7 33.4 34.72 33.98" stroke="#0077FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 24V40" stroke="#0077FF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 30L24 24L30 30" stroke="#0077FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon({ className = "" }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H20L26 10V28C26 28.5304 25.7893 25.4142 29.4142C25.0391 29.7893 24.5304 30 24 30H8C7.46957 30 6.96086 29.7893 6.58579 29.4142C6.21071 29.0391 6 28.5304 6 28V6C6 5.46957 6.21071 4.96086 6.58579 4.58579C6.96086 4.21071 7.46957 4 8 4Z" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4V10H26" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 17H21" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 21H21" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 25H17" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// --- Score Ring Component ---
function ScoreRing({ score, size = 160 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    let frame;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(eased * score));
      if (t < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const getScoreColor = (s) => {
    if (s >= 80) return "#00CC66";
    if (s >= 60) return "#0077FF";
    if (s >= 40) return "#FFaa00";
    return "#FF4444";
  };

  const getScoreLabel = (s) => {
    if (s >= 90) return "Exceptional";
    if (s >= 80) return "Excellent";
    if (s >= 70) return "Good";
    if (s >= 60) return "Decent";
    if (s >= 50) return "Average";
    if (s >= 40) return "Below Avg";
    return "Needs Work";
  };

  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#222" strokeWidth="10" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.1s ease-out",
              filter: `drop-shadow(0 0 8px ${color}50)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tabular-nums">{animatedScore}</span>
          <span className="text-xs text-[#888] mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold tracking-wide" style={{ color }}>
        {getScoreLabel(score)}
      </span>
    </div>
  );
}

function KeywordChip({ keyword, index, onAdd }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium
                 bg-[#0077FF]/10 text-[#5599FF] border border-[#0077FF]/20
                 hover:bg-[#0077FF]/20 hover:border-[#0077FF]/40 transition-all duration-300
                 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
    >
      <button onClick={() => onAdd(keyword)} className="hover:text-white transition-colors" title="Add to Skills">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {keyword}
    </span>
  );
}

// --- Main Page Component ---
export default function Home() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");
  const [showText, setShowText] = useState(false);
  const fileInputRef = useRef(null);

  // PRO Features State
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [activeRewriteId, setActiveRewriteId] = useState(null);
  const [rewrittenTexts, setRewrittenTexts] = useState({});
  const [isRescoring, setIsRescoring] = useState(false);

  // Auth & Vault State
  const { session, isPremium, setIsPremium, checkProStatus, isCheckingPro } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const supabase = createClient();

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    let error;
    let authData;
    
    if (isSignUp) {
      const res = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      error = res.error;
      authData = res.data;
    } else {
      const res = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      error = res.error;
      authData = res.data;
    }
    
    if (error) {
      alert(error.message);
    } else {
      setIsAuthModalOpen(false);
      setAuthPassword("");
      if (authData?.user) {
        await checkProStatus(authData.user);
      }
      if (isSignUp) alert("Account created and signed in!");
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };



  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const processFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setExtractedText("");
    setAnalysis(null);
    setIsLoading(true);
    setShowText(false);
    setLoadingStage("Extracting text from PDF...");

    try {
      let attempt = 0;
      const maxAttempts = 5;
      let success = false;
      let data = null;

      while (attempt < maxAttempts && !success) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const stageTimer = setTimeout(() => {
          setLoadingStage((prev) => 
            prev.includes("retrying") ? prev : "Analyzing resume with Hired..."
          );
        }, 2000);

        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });

        clearTimeout(stageTimer);

        if (response.status === 429) {
          attempt++;
          if (attempt < maxAttempts) {
            setLoadingStage(`Server busy, retrying... (Attempt ${attempt + 1}/${maxAttempts})`);
            await new Promise(r => setTimeout(r, 4000 * Math.pow(2, attempt - 1)));
            continue;
          } else {
            throw new Error("Server is too busy after multiple attempts. Please try again later.");
          }
        }

        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to parse PDF");
        }

        success = true;
      }

      if (data) {
        setExtractedText(data.text);
        setPageCount(data.pages || 0);

        if (data.analysis) {
          // Convert the summary block into distinct sentences/suggestions for the UI
          setAnalysis(data.analysis);
          setResumeData(data.analysis.resume_data || null);
          setMissingKeywords(data.analysis.missing_keywords || []);
          if (data.analysis.job_title && !data.analysis.error) {
            fetchJobs(data.analysis.job_title);
          }
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  }, []);

  const fetchJobs = async (title) => {
    setIsLoadingJobs(true);
    try {
      const res = await fetch(`/api/jobs?title=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (res.ok && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files?.[0];
      processFile(droppedFile);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const selectedFile = e.target.files?.[0];
      processFile(selectedFile);
    },
    [processFile]
  );

  const handleReset = () => {
    setFile(null);
    setExtractedText("");
    setPageCount(0);
    setAnalysis(null);
    setResumeData(null);
    setMissingKeywords([]);
    setJobs([]);
    setIsLoadingJobs(false);
    setError("");
    setShowText(false);
    setRewrittenTexts({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleApplyKeyword = (keyword) => {
    setResumeData(prev => ({
      ...prev,
      skills: [...(prev?.skills || []), keyword]
    }));
    setMissingKeywords(prev => prev.filter(k => k !== keyword));
    setAnalysis(prev => ({ ...prev, score: Math.min(100, prev.score + 2) }));
  };

  const handleApplyRewriteToResume = (idx, suggestion, rewrittenText) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const newData = { ...prev };
      if (suggestion.type === 'summary' && newData.summary) {
        newData.summary = newData.summary.replace(suggestion.original_text, rewrittenText);
      } else if (suggestion.type === 'experience' && newData.experience) {
        newData.experience = newData.experience.map(exp => ({
          ...exp,
          description: Array.isArray(exp.description) 
            ? exp.description.map(d => d.replace(suggestion.original_text, rewrittenText))
            : exp.description.replace(suggestion.original_text, rewrittenText)
        }));
      }
      return newData;
    });

    setAnalysis(prev => ({
      ...prev,
      score: Math.min(100, prev.score + 5),
      suggestions: prev.suggestions.filter((_, i) => i !== idx)
    }));
  };

  const handleRewrite = async (index, suggestionString) => {
    if (!isPremium) {
      setIsPricingModalOpen(true);
      return;
    }

    setActiveRewriteId(index);
    let attempt = 0;
    const maxAttempts = 5;
    let success = false;

    while (attempt < maxAttempts && !success) {
      try {
        const res = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suggestion: suggestionString, resumeContext: extractedText }),
        });
        const data = await res.json();
        
        if (res.status === 429) {
          attempt++;
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, 4000 * Math.pow(2, attempt - 1)));
            continue;
          } else {
            throw new Error("Server busy. Please try again.");
          }
        }

        if (!res.ok) throw new Error(data.error);

        setRewrittenTexts(prev => ({ ...prev, [index]: data.rewrittenText }));
        success = true;
      } catch (err) {
        if (attempt >= maxAttempts - 1) {
          alert("Rewrite failed: " + err.message);
          break;
        }
        attempt++;
        await new Promise(r => setTimeout(r, 4000 * Math.pow(2, attempt - 1)));
      }
    }
    setActiveRewriteId(null);
  };

  const handleRescore = async () => {
    setIsRescoring(true);
    try {
      const res = await fetch("/api/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAnalysis(prev => ({ ...prev, score: data.score }));
    } catch (err) {
      alert("Failed to update score: " + err.message);
    } finally {
      setIsRescoring(false);
    }
  };

  const handleUpgradeToPro = async () => {
    if (!session) {
      alert("Please sign in first to upgrade to Pro.");
      setIsPricingModalOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const order = await res.json();

      if (order.error) throw new Error(order.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "hired. Pro",
        description: "Lifetime access to Pro features",
        order_id: order.id,
        callback_url: `${window.location.origin}/api/verify`,
        handler: async function (response) {
          const verifyRes = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, userId: session?.user?.id }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setIsPremium(true);
            setIsPricingModalOpen(false);
            alert("Welcome to Pro! Your resume is now fully unlocked.");
          } else {
            alert("Payment verification failed.");
          }
        },
        theme: { color: "#A855F7" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      alert("Failed to initialize payment: " + err.message);
    }
  };

  const handleAutoApply = () => {
    if (!isPremium) {
      alert("Tired of manual forms? hired. Pro can apply to 10+ jobs for you instantly. Upgrade to unlock.");
      setIsPricingModalOpen(true);
    } else {
      alert("Auto-Applying to this job... (Demo Mode)");
    }
  };

  // Mock Job Data Removed


  return (
    <div className="flex flex-col flex-1 items-center bg-[#111111] bg-grid min-h-screen font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* ===== HEADER / BRANDING ===== */}
      <header className="w-full py-6 px-8 animate-fade-in-up border-b border-[#222]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#0077FF] to-[#A855F7] bg-clip-text text-transparent">
              hired.
            </span>
            {isPremium && (
              <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#A855F7] to-[#F59E0B] px-2 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                Pro
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {!session ? (
              <button onClick={() => setIsAuthModalOpen(true)} className="px-4 py-2 text-[#888] hover:text-white font-medium text-sm transition-colors">Sign In</button>
            ) : (
              <button onClick={handleSignOut} className="px-4 py-2 text-[#888] hover:text-white font-medium text-sm transition-colors">Sign Out</button>
            )}
            {isCheckingPro ? (
              <span className="px-5 py-2 rounded-full font-bold text-sm text-[#888] bg-white/5 border border-white/10 animate-pulse">
                Verifying...
              </span>
            ) : !isPremium ? (
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="px-5 py-2 rounded-full font-bold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all pro-glow shadow-lg"
              >
                Upgrade to Pro
              </button>
            ) : (
              <span className="px-5 py-2 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#A855F7] to-[#F59E0B] shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2">
                ✨ Pro Member
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ===== AUTH MODAL ===== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-[#111] border border-[#333] rounded-3xl p-8 max-w-md w-full relative">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 text-[#666] hover:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to hired.</h2>
            <p className="text-[#888] mb-6">Sign in to save your resume and unlock Pro features.</p>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" required className="w-full bg-[#222] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#A855F7]" />
              <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" required minLength="6" className="w-full bg-[#222] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#A855F7]" />
              <button type="submit" disabled={authLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0077FF] to-[#A855F7] text-white font-bold hover:opacity-90 disabled:opacity-50">
                {authLoading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[#888] hover:text-white text-sm transition-colors">
                  {isSignUp ? "Already have an account? Sign In" : "Need an account? Create one"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== PRICING MODAL ===== */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-[#111] border border-[#333] rounded-3xl p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <button onClick={() => setIsPricingModalOpen(false)} className="absolute top-6 right-6 text-[#666] hover:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            
            <div className="col-span-1 md:col-span-2 text-center mb-4">
              <h2 className="text-3xl font-bold text-white mb-2">Engineered for the Offer</h2>
              <p className="text-[#888]">Choose the plan that fits your career goals.</p>
            </div>

            {/* Free Tier */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] flex flex-col">
              <h3 className="text-xl font-bold text-white mb-1">Free</h3>
              <div className="text-3xl font-bold text-white mb-6">₹0<span className="text-lg text-[#666] font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-[#ccc]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00CC66" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> AI Resume Scoring</li>
                <li className="flex items-center gap-3 text-[#ccc]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00CC66" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Missing Keyword Analysis</li>
                <li className="flex items-center gap-3 text-[#ccc]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00CC66" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Basic Improvement Summary</li>
              </ul>
              <button onClick={() => setIsPricingModalOpen(false)} className="w-full py-3 rounded-xl border border-[#444] text-white font-semibold hover:bg-[#222]">Current Plan</button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-b from-[#A855F7]/10 to-[#1a1a1a] rounded-2xl p-8 border border-[#A855F7]/50 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#A855F7] to-[#F59E0B] text-white text-[10px] font-bold uppercase tracking-wider py-1 px-4 rounded-bl-lg">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-1">hired. Pro</h3>
              <div className="text-3xl font-bold text-white mb-6">₹149<span className="text-lg text-[#A855F7] font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-white font-medium"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> ✨ Unlimited AI Rewrites</li>
                <li className="flex items-center gap-3 text-white font-medium"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> 🚀 Auto-Apply to Jobs</li>
                <li className="flex items-center gap-3 text-white font-medium"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Direct Company Links</li>
                <li className="flex items-center gap-3 text-white font-medium"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> Personalized Cover Letters</li>
              </ul>
              <button 
                onClick={handleUpgradeToPro}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#F59E0B] text-white font-bold hover:opacity-90 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                Unlock Pro Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex flex-1 flex-col items-center w-full max-w-4xl px-6 pb-20 pt-12">
        {!analysis && (
          <div className="text-center mb-10 animate-fade-in-up-delay w-full max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Get the offer you deserve.
              <br />
              <span className="bg-gradient-to-r from-[#0077FF] to-[#A855F7] bg-clip-text text-transparent">Instantly.</span>
            </h1>
            <p className="text-[#999] text-lg max-w-md mx-auto leading-relaxed">
              Upload your resume in PDF format. Our AI will analyze your profile and match you with jobs.
            </p>
          </div>
        )}

        {/* ===== DRAG & DROP ZONE (HIDE IF ANALYZED) ===== */}
        {!analysis && (
          <div className="w-full max-w-3xl animate-fade-in-up-delay-2">
            <div
              id="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`
                relative w-full rounded-2xl border-2 border-dashed
                transition-all duration-300 ease-out
                flex flex-col items-center justify-center py-16 px-8
                ${isLoading ? "cursor-wait" : "cursor-pointer"}
                ${
                  isDragOver
                    ? "drop-zone-hover border-[#0077FF] bg-[#0077FF]/5"
                    : "border-[#333] bg-[#1a1a1a]/50 hover:border-[#0077FF]/50 hover:bg-[#1a1a1a]"
                }
              `}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-[#222] border-t-[#0077FF] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium text-base">{loadingStage}</p>
                    <p className="text-[#555] text-sm mt-1">This may take a few seconds</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={isDragOver ? "icon-float" : ""}>
                      <CloudUploadIcon />
                    </div>
                    <DocumentIcon />
                  </div>
                  {file && !error ? (
                    <div className="text-center">
                      <p className="text-white font-medium text-lg">{file.name}</p>
                      <p className="text-[#666] text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-white font-medium text-lg mb-1">Drag & drop your resume here</p>
                      <p className="text-[#666] text-sm">or click to browse — PDF files only</p>
                    </div>
                  )}
                </>
              )}

              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="
                  btn-shimmer px-8 py-3.5 rounded-full font-bold text-white text-sm
                  bg-gradient-to-r from-[#0055CC] to-[#0077FF]
                  hover:from-[#0066DD] hover:to-[#339FFF]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-300 shadow-lg
                "
              >
                {isLoading ? "Processing..." : "Upload Resume"}
              </button>
            </div>
          </div>
        )}

        {/* ===== AI ANALYSIS DASHBOARD ===== */}
        {analysis && (
          <div className="w-full space-y-8 animate-fade-in-up">
            
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00CC66] animate-pulse shadow-[0_0_10px_#00CC66]" />
                Analysis Complete
              </h2>
              <button onClick={handleReset} className="text-sm font-medium text-[#888] hover:text-white transition-colors">
                Upload New Resume
              </button>
            </div>

            {/* Error State */}
            {analysis.error && (
              <div className="w-full p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                {analysis.error}
              </div>
            )}

            {!analysis.error && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT PANE: AI Analysis & Action Panel */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Score Card */}
                  <div className="rounded-3xl bg-[#161616] border border-[#2a2a2a] p-8 flex flex-col items-center justify-center glow-blue">
                    <p className="text-[#888] text-xs uppercase tracking-widest mb-6 font-bold">Resume Score</p>
                    <ScoreRing score={analysis.score} />
                  </div>

                  {/* Keywords Card */}
                  {missingKeywords.length > 0 && (
                    <div className="rounded-3xl bg-[#161616] border border-[#2a2a2a] p-8 glow-blue">
                      <p className="text-[#888] text-xs uppercase tracking-widest font-bold mb-4">Missing Keywords</p>
                      <p className="text-[#777] text-sm mb-6">
                        Click the + to instantly add these missing ATS keywords to your skills section.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {missingKeywords.map((keyword, i) => (
                          <KeywordChip key={i} keyword={keyword} index={i} onAdd={handleApplyKeyword} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements / AI Rewrite Brain */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="rounded-3xl bg-[#161616] border border-[#2a2a2a] p-8 glow-orange">
                      <div className="flex items-center justify-between mb-6">
                        <p className="text-[#888] text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 1.5V3M9 15V16.5M3 9H1.5M16.5 9H15M14.25 3.75L13.2 4.8M4.8 13.2L3.75 14.25M14.25 14.25L13.2 13.2M4.8 4.8L3.75 3.75" stroke="#FFaa00" strokeWidth="1.5" strokeLinecap="round" /><circle cx="9" cy="9" r="3.5" stroke="#FFaa00" strokeWidth="1.5" /></svg>
                          Recommended Improvements
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-[#111] border border-[#333] flex flex-col gap-4">
                            <p className="text-[#ccc] text-sm leading-relaxed">{suggestion.suggestion || suggestion.original_text}</p>
                            
                            <div className="border-t border-[#222] pt-4">
                              {!rewrittenTexts[idx] && (
                                <button 
                                  onClick={() => handleRewrite(idx, suggestion.suggestion || suggestion.original_text)}
                                  disabled={activeRewriteId === idx}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#A855F7] to-[#F59E0B] hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  {activeRewriteId === idx ? "✨ Rewriting..." : "✨ AI Rewrite"}
                                </button>
                              )}
                              
                              {/* Rewritten Text Result */}
                              {rewrittenTexts[idx] && (
                                <div className="relative mt-2">
                                  <p className="text-xs text-[#A855F7] font-bold uppercase mb-2">✨ AI Generated Bullet Point</p>
                                  <div className={`p-4 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 ${!isPremium ? "text-blur-md" : ""}`}>
                                    <p className="text-white text-sm leading-relaxed">
                                      {rewrittenTexts[idx]}
                                    </p>
                                  </div>

                                  {isCheckingPro ? (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl premium-overlay">
                                      <button disabled className="px-6 py-2 rounded-full bg-white/50 text-black font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse">
                                        Checking Status...
                                      </button>
                                    </div>
                                  ) : isPremium ? (
                                    <button 
                                      onClick={() => handleApplyRewriteToResume(idx, suggestion, rewrittenTexts[idx])}
                                      className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#00CC66] to-[#00aa55] hover:opacity-90 transition-opacity"
                                    >
                                      ✓ Apply to Resume
                                    </button>
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl premium-overlay">
                                      <button onClick={() => setIsPricingModalOpen(true)} className="px-6 py-2 rounded-full bg-white text-black font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform">
                                        Unlock Pro for ₹149
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}



                </div>

                {/* RIGHT PANE: Live PDF Preview */}
                <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Live Preview</h3>
                    <div className="flex items-center gap-3">
                      {isCheckingPro ? (
                        <button disabled className="px-4 py-2 rounded-lg bg-[#222] text-[#888] font-bold text-sm border border-[#444] animate-pulse">
                          Checking...
                        </button>
                      ) : isPremium ? (
                        <PDFDownloadLink key={JSON.stringify(resumeData)} document={<ResumeTemplate data={resumeData} />} fileName="Optimized_Resume.pdf">
                          {({ loading }) => (
                            <button disabled={loading} className="px-4 py-2 rounded-lg bg-white text-black font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 transition-all">
                              {loading ? "Preparing..." : "⬇ Download PDF"}
                            </button>
                          )}
                        </PDFDownloadLink>
                      ) : (
                        <button onClick={() => setIsPricingModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#222] text-[#888] font-bold text-sm hover:text-white border border-[#444] hover:border-[#666] transition-all relative overflow-hidden group">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          Download PDF
                          <div className="absolute inset-0 bg-gradient-to-r from-[#A855F7]/20 to-[#F59E0B]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                      )}
                    </div>
                  </div>
                  {resumeData && <PDFPreview data={resumeData} />}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ===== JOB MATCHER SECTION ===== */}
        {analysis && !analysis.error && (
          <div className="w-full mt-16 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">
              Your Job Matches {isLoadingJobs && <span className="text-sm font-normal text-[#888] ml-2 animate-pulse">Fetching real jobs...</span>}
            </h2>
            {jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job, index) => (
                  <div key={job.id || index} className="bg-[#161616] border border-[#2a2a2a] rounded-3xl p-6 relative flex flex-col hover:border-[#444] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white" dangerouslySetInnerHTML={{ __html: job.title }}></h3>
                        <p className="text-[#00CC66] font-medium text-sm mt-1">{job.salary}</p>
                        {/* BLUR COMPANY IF NOT PRO */}
                        <p className={`text-[#888] font-medium mt-1 ${!isPremium ? "text-blur-sm select-none" : ""}`}>
                          {job.company} • {job.location}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 flex items-center gap-3">
                      {isPremium ? (
                        <a 
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0055CC] to-[#0077FF] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                          Apply Now
                        </a>
                      ) : (
                        <button 
                          onClick={() => setIsPricingModalOpen(true)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#F59E0B] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                          🚀 Apply Now (Pro)
                        </button>
                      )}
                    </div>

                    {!isPremium && (
                      <div className="absolute top-12 left-6 right-6 bottom-6 flex items-center justify-center pointer-events-none">
                         {/* Overlay effect to make the blur look intentional */}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : !isLoadingJobs && (
              <p className="text-[#888]">No jobs found for the analyzed profile.</p>
            )}
          </div>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="w-full py-6 text-center border-t border-[#1a1a1a] mt-auto">
        <p className="text-[#444] text-xs tracking-wide">© 2026 hired. — Elevating careers with AI</p>
      </footer>
    </div>
  );
}
