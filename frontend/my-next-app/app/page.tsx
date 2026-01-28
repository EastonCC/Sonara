export default async function Home() {
  // 1. Define the URL using the environment variable
  // We use a fallback string just in case the variable is missing
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  
  let data = null;
  let error = null;

  try {
    // 2. Fetch data from the backend
    // cache: 'no-store' ensures we always get fresh data (no caching)
    const res = await fetch(`${apiUrl}/api/health/`, { 
      cache: 'no-store' 
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    data = await res.json();

  } catch (err) {
    // 3. Capture any errors
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  // 4. Render the UI
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
      <div className="z-10 w-full max-w-sm items-center justify-between font-mono text-sm border border-gray-700 rounded-lg p-6 bg-gray-900">
        
        <h1 className="text-xl mb-4 font-bold text-blue-400">
          Backend Connection Test
        </h1>

        <div className="space-y-2">
          <p className="text-gray-400">Target URL:</p>
          <code className="bg-gray-800 px-2 py-1 rounded text-xs break-all">
            {apiUrl}/api/health/
          </code>
        </div>

        <div className="mt-6">
          <p className="text-gray-400 mb-2">Response:</p>
          
          {error ? (
             <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
               ❌ {error}
             </div>
          ) : (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded text-green-200">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}