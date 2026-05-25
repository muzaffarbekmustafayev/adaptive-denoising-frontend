'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FiCheck, FiCopy, FiArrowRight, FiShield } from 'react-icons/fi';

export default function ApiDocsPage() {
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const API_URL = 'http://localhost:5000/api/v1';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kod namunalarini generatsiya qilish funksiyasi
  const getCodeExample = (lang: string, step: string) => {
    switch (step) {
      case 'auth':
        if (lang === 'curl') {
          return `curl -X POST "${API_URL}/auth/login" \\\n  -H "Content-Type: application/json" \\\n  -d '{"apiKey": "YOUR_API_KEY"}'`;
        }
        if (lang === 'python') {
          return `import requests\n\nurl = "${API_URL}/auth/login"\nresponse = requests.post(url, json={"apiKey": "YOUR_API_KEY"})\nprint(response.json())`;
        }
        return `const axios = require('axios');\n\naxios.post('${API_URL}/auth/login', {\n  apiKey: 'YOUR_API_KEY'\n}).then(res => console.log(res.data));`;

      case 'upload':
        if (lang === 'curl') {
          return `curl -X POST "${API_URL}/audio/denoise" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -F "file=@/path/to/audio.mp3"`;
        }
        if (lang === 'python') {
          return `import requests\n\nurl = "${API_URL}/audio/denoise"\nfiles = {'file': open('audio.mp3', 'rb')}\nheaders = {"x-api-key": "YOUR_API_KEY"}\n\nresponse = requests.post(url, headers=headers, files=files)\nprint(response.json())`;
        }
        return `const axios = require('axios');\nconst FormData = require('form-data');\nconst fs = require('fs');\n\nconst form = new FormData();\nform.append('file', fs.createReadStream('audio.mp3'));\n\naxios.post('${API_URL}/audio/denoise', form, {\n  headers: { ...form.getHeaders(), 'x-api-key': 'YOUR_API_KEY' }\n}).then(res => console.log(res.data));`;

      case 'status':
        return lang === 'curl' 
          ? `curl -H "x-api-key: YOUR_API_KEY" "${API_URL}/audio/jobs/JOB_ID"`
          : `// GET request to ${API_URL}/audio/jobs/JOB_ID`;

      case 'download':
        return lang === 'curl'
          ? `curl -L "${API_URL}/audio/jobs/JOB_ID/download" --output result.mp3`
          : `// Download file from ${API_URL}/audio/jobs/JOB_ID/download`;

      case 'stream':
        if (lang === 'curl') {
          return `curl -X POST "${API_URL}/audio/stream?mode=basic" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: audio/mpeg" \\\n  --data-binary "@/path/to/audio.mp3" \\\n  --output denoised_stream.mp3`;
        }
        if (lang === 'python') {
          return `import requests\n\nurl = "${API_URL}/audio/stream?mode=basic"\nheaders = {\n    "x-api-key": "YOUR_API_KEY",\n    "Content-Type": "audio/mpeg"\n}\n\nwith open("audio.mp3", "rb") as f:\n    response = requests.post(url, headers=headers, data=f, stream=True)\n    with open("denoised_stream.mp3", "wb") as out:\n        for chunk in response.iter_content(chunk_size=8192):\n            out.write(chunk)`;
        }
        return `const axios = require('axios');\nconst fs = require('fs');\n\nconst inputStream = fs.createReadStream('audio.mp3');\nconst outputStream = fs.createWriteStream('denoised_stream.mp3');\n\naxios({\n  method: 'post',\n  url: '${API_URL}/audio/stream?mode=basic',\n  data: inputStream,\n  headers: { 'x-api-key': 'YOUR_API_KEY', 'Content-Type': 'audio/mpeg' },\n  responseType: 'stream'\n}).then(response => {\n  response.data.pipe(outputStream);\n});`;

      default:
        return '';
    }
  };

  // Response namunalarini generatsiya qilish funksiyasi
  const getResponseExample = (step: string) => {
    switch (step) {
      case 'auth':
        return `{\n  "success": true,\n  "token": "eyJhbGciOiJIUzI1NiIsInR..."\n}`;
      case 'upload':
        return `{\n  "success": true,\n  "jobId": "69f3512747eb4a747ebafde1",\n  "status": "QUEUED"\n}`;
      case 'status':
        return `{\n  "success": true,\n  "data": {\n    "_id": "69f3512747eb4a747ebafde1",\n    "status": "COMPLETED",\n    "durationSeconds": 45.2,\n    "createdAt": "2024-05-20T10:00:00.000Z"\n  }\n}`;
      case 'stream':
        return `Binary Audio Stream (Chunked Encoding)`;
      default:
        return `{\n  "success": true\n}`;
    }
  };

  const CodeBlock = ({ step, title, description, method, endpoint }: { step: string, title: string, description: string, method: string, endpoint: string }) => {
    const code = getCodeExample(activeLang, step);
    const response = getResponseExample(step);
    const [localCopied, setLocalCopied] = useState(false);

    const handleCopy = () => {
      copyToClipboard(code);
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2000);
    };
    
    return (
      <div className="mb-16 last:mb-0">
        <div className="flex flex-col mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
              method === 'POST' ? 'bg-blue-600' : 'bg-emerald-600'
            } text-white shadow-sm`}>
              {method}
            </span>
            <code className="text-sm font-mono font-bold text-primary">
              {endpoint}
            </code>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl pl-4">{description}</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card overflow-hidden border border-primary/20 shadow-md rounded-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-slate-50 dark:bg-slate-900/50">
              <div className="flex gap-6">
                {(['curl', 'python', 'node'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`text-[10px] font-bold uppercase tracking-[0.15em] pb-1 transition-all border-b-2 ${
                      activeLang === lang 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-primary/70'
                    }`}
                  >
                    {lang === 'node' ? 'Node.js' : lang}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors px-3 py-1 bg-primary/5 rounded-lg border border-primary/10"
              >
                {localCopied ? (
                  <><FiCheck className="w-3 h-3" /> Copied</>
                ) : (
                  <><FiCopy className="w-3 h-3" /> Copy Code</>
                )}
              </button>
            </div>
            <div className="p-6 overflow-x-auto bg-[#0a0f1d] h-[220px]">
              <pre className="text-xs font-mono leading-relaxed">
                <code className="text-slate-300">{code}</code>
              </pre>
            </div>
          </div>

          <div className="card overflow-hidden border border-primary/10 shadow-sm opacity-90 rounded-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-slate-100/50 dark:bg-slate-800/30">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Typical Response</span>
            </div>
            <div className="p-6 overflow-x-auto bg-[#0d1425] h-[220px]">
              <pre className="text-xs font-mono leading-relaxed">
                <code className="text-slate-400">{response}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl p-6">
        <header className="mb-12 border-b-2 border-primary/10 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-primary/20">
              API Version 1.0.0
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-4">Developer Hub</h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium">
              Integrate the world's most advanced adaptive denoising engine directly into your workflows via our REST and Streaming APIs.
            </p>
          </div>
          <div className="pb-1">
            <a 
              href="http://localhost:5000/api-docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all transform hover:-translate-y-1"
            >
              Open Swagger UI
              <FiArrowRight className="w-4 h-4" />
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <section className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">1. Authentication</h2>
                <div className="h-[2px] w-full bg-primary/10"></div>
              </div>
              <CodeBlock 
                step="auth" 
                method="POST"
                endpoint="/auth/login"
                title="Bearer Token Retrieval" 
                description="Secure your session by obtaining a JWT. Required for all private user-level operations."
              />
            </section>

            <section className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">2. Asynchronous Jobs</h2>
                <div className="h-[2px] w-full bg-primary/10"></div>
              </div>
              <CodeBlock 
                step="upload" 
                method="POST"
                endpoint="/audio/denoise"
                title="Start Denoising Task" 
                description="Upload an audio file to the processing queue. Supports multipart form data."
              />
              <CodeBlock 
                step="status" 
                method="GET"
                endpoint="/audio/jobs/{jobId}"
                title="Track Progress" 
                description="Monitor the state of your background job. Poll this until status is 'COMPLETED'."
              />
            </section>

            <section className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">3. Real-time Streaming</h2>
                <div className="h-[2px] w-full bg-primary/10"></div>
              </div>
              <CodeBlock 
                step="stream" 
                method="POST"
                endpoint="/audio/stream"
                title="Low-Latency Stream" 
                description="Pipe raw audio data and receive a denoised stream back in real-time. Zero-queue architecture."
              />
            </section>

            <section className="mb-20 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <FiShield className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-black mb-4">Open API & Limits</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Global Headers</h4>
                    <ul className="space-y-3 text-sm text-slate-400">
                      <li className="flex gap-3"><FiCheck className="text-emerald-500 shrink-0" /> <code>x-api-key</code>: Your persistent key</li>
                      <li className="flex gap-3"><FiCheck className="text-emerald-500 shrink-0" /> <code>Authorization</code>: Bearer &lt;JWT&gt;</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Rate Limiting</h4>
                    <ul className="space-y-3 text-sm text-slate-400">
                      <li className="flex gap-3"><FiCheck className="text-emerald-500 shrink-0" /> 1000 requests per hour</li>
                      <li className="flex gap-3"><FiCheck className="text-emerald-500 shrink-0" /> 50MB max file size</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Security
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Global authentication via API keys.
              </p>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg font-mono text-[10px] text-primary font-bold shadow-sm">
                x-api-key: &lt;YOUR_KEY&gt;
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Production URL
              </h2>
              <code className="text-[10px] font-mono p-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg block break-all text-foreground shadow-sm">
                {API_URL}
              </code>
            </div>

            <div className="pt-4">
              <button className="w-full py-3 bg-primary text-white text-xs uppercase tracking-widest font-black rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                Technical Support
              </button>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}