'use client';

import { useEffect, useState } from 'react';

interface ServerStatusProps {
  sseUrl: string;
  initialStatus: string;
}

export default function ServerStatus({ sseUrl, initialStatus }: ServerStatusProps) {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // If the sseUrl is the old staging/mock dev domains, we shouldn't attempt to ping them
    if (sseUrl.includes('agentready.dev')) {
      // Treat custom domain placeholders as mock/staging state since they don't host actual services yet
      setStatus(initialStatus === 'verified' ? 'online' : 'offline');
      return;
    }

    // Extract base URL from SSE URL (e.g. https://domain.com/sse -> https://domain.com)
    let baseUrl = sseUrl;
    if (sseUrl.endsWith('/sse')) {
      baseUrl = sseUrl.substring(0, sseUrl.length - 4);
    }

    const checkHealth = () => {
      fetch(`${baseUrl}/health`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Not ok');
        })
        .then((data) => {
          if (data.status === 'ok') {
            setStatus('online');
          } else {
            setStatus('offline');
          }
        })
        .catch(() => {
          setStatus('offline');
        });
    };

    checkHealth();
    
    // Poll health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [sseUrl, initialStatus]);

  return (
    <div className="flex items-center gap-2 text-[9px] mb-4">
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'online' ? 'bg-green-500 animate-pulse' :
        status === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
      }`}></span>
      <span className="opacity-60 uppercase font-mono">
        STATUS: {status === 'online' ? 'ONLINE' : status === 'offline' ? 'OFFLINE' : 'CHECKING...'}
      </span>
    </div>
  );
}
