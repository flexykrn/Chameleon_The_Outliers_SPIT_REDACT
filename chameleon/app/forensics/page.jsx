'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/app/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Activity, MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ForensicsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attacks, setAttacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sqli: 0,
    xss: 0,
    bruteForce: 0,
    benign: 0
  });
  const [user, setUser] = useState(null);
  const [showBlockchainPanel, setShowBlockchainPanel] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState({
    anchoring: false,
    verifying: false,
    result: null
  });

  // Anchor logs to blockchain
  const anchorToBlockchain = async () => {
    setBlockchainStatus({ ...blockchainStatus, anchoring: true, result: null });
    
    try {
      const response = await fetch('/api/anchor-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 10 })
      });

      const data = await response.json();
      
      if (data.success) {
        setBlockchainStatus({
          anchoring: false,
          verifying: false,
          result: {
            type: 'success',
            message: 'Logs successfully anchored to blockchain!',
            data: data
          }
        });
      } else {
        throw new Error(data.error || 'Anchoring failed');
      }
    } catch (error) {
      setBlockchainStatus({
        anchoring: false,
        verifying: false,
        result: {
          type: 'error',
          message: error.message
        }
      });
    }
  };

  // Verify batch on blockchain
  const verifyBatch = async (batchId) => {
    setBlockchainStatus({ ...blockchainStatus, verifying: true, result: null });
    
    try {
      const response = await fetch('/api/verify-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });

      const data = await response.json();
      
      if (data.success) {
        setBlockchainStatus({
          anchoring: false,
          verifying: false,
          result: {
            type: 'verified',
            message: 'Batch verified on blockchain - tamper-proof!',
            data: data
          }
        });
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      setBlockchainStatus({
        anchoring: false,
        verifying: false,
        result: {
          type: 'error',
          message: error.message
        }
      });
    }
  };

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/authentication/signinpage');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Real-time attack listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'attacks'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attacksData = [];
      let sqliCount = 0, xssCount = 0, bruteCount = 0, benignCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        attacksData.push({ id: doc.id, ...data });
        
        const classification = data.classification?.toLowerCase();
        if (classification === 'sqli' || classification === 'sql injection') sqliCount++;
        else if (classification === 'xss') xssCount++;
        else if (classification === 'brute force' || classification === 'bruteforce') bruteCount++;
        else if (classification === 'benign') benignCount++;
      });

      setAttacks(attacksData);
      setStats({
        total: attacksData.length,
        sqli: sqliCount,
        xss: xssCount,
        bruteForce: bruteCount,
        benign: benignCount
      });
    });

    return () => unsubscribe();
  }, [user]);

  const getClassificationColor = (classification) => {
    const cls = classification?.toLowerCase();
    if (cls === 'sqli' || cls === 'sql injection') return 'bg-red-500';
    if (cls === 'xss') return 'bg-orange-500';
    if (cls === 'brute force' || cls === 'bruteforce') return 'bg-yellow-500';
    if (cls === 'benign') return 'bg-green-500';
    return 'bg-gray-500';
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Classification', 'Confidence', 'Input', 'IP', 'Country', 'City', 'Deceptive Response'],
      ...attacks.map(a => [
        a.timestamp?.toDate().toISOString() || '',
        a.classification || '',
        a.confidence || '',
        a.input || '',
        a.ip || '',
        a.country || '',
        a.city || '',
        a.deceptiveResponse || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading forensic data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="h-12 w-12 text-green-400" />
          <div>
            <h1 className="text-4xl font-bold text-green-400">
              Forensic Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Real-time Attack Monitoring System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportLogs} className="bg-blue-600 hover:bg-blue-700">
            📥 Export Logs
          </Button>
          <Button 
            onClick={() => setShowBlockchainPanel(!showBlockchainPanel)} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            🔗 Blockchain
          </Button>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Logged in as</p>
            <p className="text-green-400 font-semibold">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Blockchain Panel */}
      {showBlockchainPanel && (
        <Card className="p-6 bg-gray-800 border-purple-500/30 mb-8">
          <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            🔗 Blockchain Log Anchoring
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Anchor Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300">Anchor Logs to Blockchain</h3>
              <p className="text-gray-400 text-sm">
                Create a tamper-proof record of recent attack logs using Merkle tree cryptography.
              </p>
              <Button 
                onClick={anchorToBlockchain}
                disabled={blockchainStatus.anchoring}
                className="bg-purple-600 hover:bg-purple-700 w-full"
              >
                {blockchainStatus.anchoring ? '⏳ Anchoring...' : '🔗 Anchor Recent Logs'}
              </Button>
            </div>

            {/* Verify Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300">Verify Batch</h3>
              <p className="text-gray-400 text-sm">
                Verify the integrity of anchored logs on the blockchain.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter batch ID"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  id="batchIdInput"
                />
                <Button 
                  onClick={() => {
                    const batchId = document.getElementById('batchIdInput').value;
                    if (batchId) verifyBatch(batchId);
                  }}
                  disabled={blockchainStatus.verifying}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {blockchainStatus.verifying ? '⏳' : '✓'} Verify
                </Button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {blockchainStatus.result && (
            <div className={`mt-6 p-4 rounded border ${
              blockchainStatus.result.type === 'success' ? 'bg-green-900/20 border-green-500/50' :
              blockchainStatus.result.type === 'verified' ? 'bg-blue-900/20 border-blue-500/50' :
              'bg-red-900/20 border-red-500/50'
            }`}>
              <p className={`font-semibold mb-2 ${
                blockchainStatus.result.type === 'success' ? 'text-green-400' :
                blockchainStatus.result.type === 'verified' ? 'text-blue-400' :
                'text-red-400'
              }`}>
                {blockchainStatus.result.message}
              </p>
              
              {blockchainStatus.result.data && (
                <div className="text-sm text-gray-300 space-y-1 mt-3">
                  {blockchainStatus.result.data.batch && (
                    <>
                      <p><strong>Batch ID:</strong> {blockchainStatus.result.data.batch.batchId}</p>
                      <p><strong>Merkle Root:</strong> <code className="text-xs bg-gray-700 px-2 py-1 rounded">{blockchainStatus.result.data.batch.merkleRoot}</code></p>
                      {blockchainStatus.result.data.batch.logCount && (
                        <p><strong>Logs Anchored:</strong> {blockchainStatus.result.data.batch.logCount}</p>
                      )}
                    </>
                  )}
                  {blockchainStatus.result.data.blockchain && (
                    <>
                      <p><strong>Transaction:</strong> <code className="text-xs bg-gray-700 px-2 py-1 rounded">{blockchainStatus.result.data.blockchain.transactionHash}</code></p>
                      <p><strong>Block Number:</strong> {blockchainStatus.result.data.blockchain.blockNumber}</p>
                      <a 
                        href={blockchainStatus.result.data.blockchain.explorerUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        🔍 View on Blockchain Explorer →
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-700/50 rounded text-xs text-gray-400">
            <p className="font-semibold mb-1">ℹ️ How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Recent logs are hashed using SHA-256</li>
              <li>Hashes are combined into a Merkle tree</li>
              <li>Merkle root is stored on blockchain (immutable)</li>
              <li>Any log tampering changes the Merkle root</li>
              <li>Blockchain timestamp proves when logs were created</li>
            </ol>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-6 bg-gray-800 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Attempts</div>
            </div>
            <Activity className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-400">{stats.sqli}</div>
              <div className="text-gray-400 text-sm">SQL Injections</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-orange-400">{stats.xss}</div>
              <div className="text-gray-400 text-sm">XSS Attacks</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-400">{stats.bruteForce}</div>
              <div className="text-gray-400 text-sm">Brute Force</div>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-400">{stats.benign}</div>
              <div className="text-gray-400 text-sm">Benign</div>
            </div>
            <Shield className="h-8 w-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Attack Log Table */}
      <Card className="p-6 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Live Attack Log
          </h2>
          <Badge className="bg-green-500 animate-pulse">
            {attacks.length} Records
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-green-400 border-b-2 border-gray-700">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Type</th>
                <th className="p-3">Input</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Attack Intention</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Location</th>
                <th className="p-3">Detected By</th>
                <th className="p-3">XAI</th>
              </tr>
            </thead>
            <tbody>
              {attacks.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">
                    No attacks detected yet. System is monitoring...
                  </td>
                </tr>
              ) : (
                attacks.map((attack) => (
                  <tr 
                    key={attack.id} 
                    className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-3 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="font-mono text-xs">
                          {attack.timestamp?.toDate().toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getClassificationColor(attack.classification)}>
                        {attack.classification || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-xs text-gray-400 max-w-xs truncate">
                        {attack.input || 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(attack.confidence || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-blue-400 font-semibold text-xs">
                          {((attack.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {attack.geminiAnalysis || attack.attackIntention ? (
                        <div className="max-w-sm">
                          <div 
                            className="text-xs text-amber-300 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: (attack.geminiAnalysis || attack.attackIntention)
                                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1 →</a>')
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">Analyzing...</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-xs text-gray-400">
                        {attack.ip || 'Unknown'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>{attack.city || 'Unknown'}, {attack.country || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-blue-400 text-xs">
                        {attack.detectedBy || 'Chameleon Model'}
                      </div>
                    </td>
                    <td className="p-3">
                      {attack.xaiExplanation ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30"
                          onClick={() => {
                            alert(JSON.stringify(attack.xaiExplanation, null, 2));
                          }}
                        >
                          View
                        </Button>
                      ) : (
                        <span className="text-gray-600 text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
