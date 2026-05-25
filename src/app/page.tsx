'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiActivity, FiZap, FiShield, FiCode, FiArrowRight, FiCheckCircle, FiPlay, FiServer, FiLock } from 'react-icons/fi';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
    setWaveHeights([...Array(40)].map(() => 20 + Math.random() * 80));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FiActivity className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight font-outfit bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Denoise.AI
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-semibold hover:text-blue-600 transition-colors">Features</a>
            <a href="#technology" className="text-sm font-semibold hover:text-blue-600 transition-colors">Technology</a>
            <a href="/api-docs" className="text-sm font-semibold hover:text-blue-600 transition-colors">API</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2.5 text-sm font-bold hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary px-6 py-2.5">
              Get Started Free
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">New: Neural Adaptive Engine v2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold font-outfit tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-500">
            Professional Audio Cleaning <br className="hidden md:block" /> Powered by <span className="text-blue-600">Adaptive AI</span>
          </h1>
          
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            State-of-the-art spectral noise reduction for your voice recordings, podcasts, and IoT devices. 
            Integrated via high-performance REST API.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/register" className="btn-primary px-10 py-4 text-lg shadow-2xl shadow-blue-500/30">
              Start Processing Now
              <FiZap className="w-5 h-5" />
            </Link>
            <button className="px-10 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-lg">
              <FiPlay className="text-blue-600" />
              Watch Demo
            </button>
          </div>

          {/* Abstract Audio Wave Visualization */}
          <div className="mt-20 relative h-32 flex items-center justify-center gap-1">
            {mounted ? waveHeights.map((height, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-full animate-wave"
                style={{ 
                  height: `${height}%`,
                  animationDelay: `${i * 0.05}s`
                }}
              ></div>
            )) : [...Array(40)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-full opacity-20"
                style={{ 
                  height: `40%`,
                  animationDelay: `${i * 0.05}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-[0.3em] mb-4">Core Capabilities</h2>
            <p className="text-3xl md:text-4xl font-bold font-outfit text-slate-900 dark:text-white">Built for High-Fidelity Output</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card card-hover p-10 flex flex-col items-start gap-6 group">
              <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <FiZap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Adaptive Denoising</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Advanced spectral subtraction filters that adapt to your audio's unique noise profile in real-time.
                </p>
              </div>
            </div>

            <div className="card card-hover p-10 flex flex-col items-start gap-6 group">
              <div className="p-4 bg-indigo-500/10 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <FiCode className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Developer First API</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Seamlessly integrate noise removal into your apps, hardware, or robots with our robust REST architecture.
                </p>
              </div>
            </div>

            <div className="card card-hover p-10 flex flex-col items-start gap-6 group">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <FiShield className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Scientific Precision</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Detailed SNR (Signal-to-Noise Ratio) metrics for every processed job, backed by experimental data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 font-outfit tracking-tighter">98.5%</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Success Rate</p>
            </div>
            <div>
              <div className="text-5xl font-black text-blue-600 mb-2 font-outfit tracking-tighter">42ms</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Latency</p>
            </div>
            <div>
              <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 font-outfit tracking-tighter">50MB</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Max File Size</p>
            </div>
            <div>
              <div className="text-5xl font-black text-blue-600 mb-2 font-outfit tracking-tighter">24/7</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-24 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.3em]">Our Infrastructure</h2>
            <h3 className="text-4xl md:text-5xl font-bold font-outfit leading-tight">Scale-Ready Architecture for Global Audio Services</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              Our backend leverages Node.js, Redis, and high-performance FFmpeg workers to process audio chunks with extreme efficiency. Whether it's a 1-second voice command or a 1-hour podcast, we handle it all.
            </p>
            
            <ul className="space-y-4">
              {[
                { icon: <FiServer />, text: 'High-performance Worker Clusters' },
                { icon: <FiLock />, text: 'End-to-end Encryption' },
                { icon: <FiCheckCircle />, text: 'Multi-format Support (MP3, WAV, WEBM)' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-300 font-semibold">
                  <div className="text-blue-400">{item.icon}</div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="aspect-square bg-blue-600/10 rounded-full border border-blue-500/20 absolute -inset-10 animate-pulse"></div>
            <div className="relative card bg-slate-800/50 border-slate-700/50 p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs font-mono text-slate-500">denoise_request.json</span>
              </div>
              <pre className="text-blue-400 font-mono text-sm leading-relaxed">
{`{
  "api_version": "v1",
  "engine": "neural-adaptive",
  "mode": "aggressive",
  "options": {
    "snr_threshold": 12.5,
    "normalization": true,
    "highpass": 80
  },
  "status": "processing",
  "progress": "74%"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiActivity className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold font-outfit">Denoise.AI</span>
          </div>
          
          <div className="flex gap-10 text-sm font-bold text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-blue-600 transition-colors">GitHub</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Discord</a>
          </div>

          <p className="text-sm font-medium text-slate-500">
            © 2024 Denoise AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
