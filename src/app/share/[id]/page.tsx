'use client';

import { useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function SharedAudioPage({ params }: { params: { id: string } }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const shareId = useMemo(() => params.id, [params.id]);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/audio/share/${shareId}`);
      if (!response.ok) {
        throw new Error('Shared audio not found or no longer available');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `shared-audio-${shareId}.wav`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to download shared audio');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold">Shared Denoised Audio</h1>
          <p className="mt-2 text-sm text-slate-500">
            You received a public audio output link. Click below to download the processed file.
          </p>

          <div className="mt-6 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            Share ID: {shareId}
          </div>

          {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <button onClick={handleDownload} disabled={downloading} className="btn-primary mt-6 w-full">
            {downloading ? 'Downloading...' : 'Download Shared Audio'}
          </button>
        </div>
      </div>
    </main>
  );
}
