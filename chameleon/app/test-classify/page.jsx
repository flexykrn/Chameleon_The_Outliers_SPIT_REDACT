'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function TestClassifyPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testExamples = [
    { label: 'Benign', value: 'hello world' },
    { label: 'SQL Injection', value: "admin' OR '1'='1" },
    { label: 'XSS Attack', value: '<script>alert("xss")</script>' },
    { label: 'SQL Union', value: "1' UNION SELECT * FROM users--" },
  ];

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setInput(example);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2 flex items-center gap-3">
            🧪 Classifier API Test Page
          </h1>
          <p className="text-gray-400">
            Test the ML classifier API endpoint: <code className="text-blue-400">https://chameleon-api-umen.onrender.com/analyze</code>
          </p>
        </div>

        <Card className="p-6 bg-gray-800 mb-6">
          <h2 className="text-xl font-bold text-green-400 mb-4">Quick Examples</h2>
          <div className="flex flex-wrap gap-2">
            {testExamples.map((example, idx) => (
              <Button
                key={idx}
                onClick={() => loadExample(example.value)}
                variant="outline"
                className="bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
              >
                {example.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 mb-6">
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 mb-2 block">Test Input</Label>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter test input (e.g., SQL injection payload, XSS script, etc.)"
                className="bg-gray-700 text-white border-gray-600"
                onKeyPress={(e) => e.key === 'Enter' && handleTest()}
              />
            </div>
            
            <Button 
              onClick={handleTest} 
              disabled={loading || !input}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Analyzing...
                </>
              ) : (
                'Test Classification'
              )}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6 bg-gray-800">
            <h2 className="text-xl font-bold text-green-400 mb-4">Result</h2>
            
            {result.error ? (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded">
                <p className="text-red-400 font-mono">❌ Error: {result.error}</p>
                {result.details && (
                  <p className="text-red-300 text-sm mt-2">{result.details}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-700 rounded">
                    <p className="text-gray-400 text-sm mb-1">Classification</p>
                    <Badge
                      className={`text-lg ${
                        result.classification === 'SQLi' ? 'bg-red-500' :
                        result.classification === 'XSS' ? 'bg-orange-500' :
                        result.classification === 'Benign' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                    >
                      {result.classification}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-gray-700 rounded">
                    <p className="text-gray-400 text-sm mb-1">Confidence</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-blue-400">
                        {(result.confidence * 100).toFixed(1)}%
                      </p>
                      <div className="flex-1 bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-700 rounded">
                  <p className="text-gray-400 text-sm mb-2">Deceptive Response</p>
                  <p className="text-yellow-400 font-mono text-sm">
                    {result.deceptiveResponse}
                  </p>
                </div>

                <div className="p-4 bg-gray-700 rounded">
                  <p className="text-gray-400 text-sm mb-2">Timestamp</p>
                  <p className="text-gray-300 font-mono text-sm">
                    {result.timestamp}
                  </p>
                </div>

                <div className="p-4 bg-gray-900 rounded">
                  <p className="text-gray-400 text-sm mb-2">Full Response (JSON)</p>
                  <pre className="text-green-400 text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
