'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, CheckCircle } from "lucide-react";

export default function TrapTransferModal({ open, onClose, availableBalance }) {
  const [formData, setFormData] = useState({
    recipientAccount: "",
    recipientName: "",
    amount: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Combine all inputs for classification - SEND ONLY THE TEXT VALUES
      const combinedInput = `${formData.recipientAccount} ${formData.recipientName} ${formData.amount} ${formData.description}`;

      // Classify the input
      const classifyResponse = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: combinedInput }),
      });

      const classifyData = await classifyResponse.json();
      console.log('Classification result:', classifyData);

      // Log the attack/activity with structured data
      const logResponse = await fetch('/api/log-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `Transfer: Account=${formData.recipientAccount}, Name=${formData.recipientName}, Amount=${formData.amount}, Desc=${formData.description}`,
          payload: combinedInput,
          classification: classifyData.classification,
          confidence: classifyData.confidence,
          deceptiveResponse: classifyData.deceptiveResponse,
          clientIp: classifyData.clientIp,
          detectedBy: classifyData.detectedBy,
          xaiExplanation: classifyData.xaiExplanation,
          endpoint: '/trap/transfer',
          httpMethod: 'POST'
        })
      });
      
      if (logResponse.ok) {
        const logResult = await logResponse.json();
        console.log('✅ Firebase log SUCCESS:', logResult);
      } else {
        const errorData = await logResponse.json();
        console.error('❌ Firebase log FAILED:', errorData);
      }

      // Check if it's a malicious attempt (anything that's not benign)
      const isMalicious = classifyData.classification && 
                         classifyData.classification.toLowerCase() !== 'benign' &&
                         classifyData.classification.toLowerCase() !== 'safe' &&
                         classifyData.classification !== 'Unknown';
      
      if (isMalicious) {
        // Extended tarpitting with realistic banking messages
        setLoadingMessage('Connecting to bank servers...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setLoadingMessage('Verifying account details...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setLoadingMessage('Processing transaction...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show GENERIC friendly error after the delay (no technical details)
        setLoadingMessage('');
        setError('Unable to process transfer at this time. Please verify the account details and try again.');
        setLoading(false); // Re-enable the form so they can try again
        
        // Auto-clear error after some time to encourage retry
        setTimeout(() => {
          setError('');
        }, 5000);
        
        return; // Don't close modal, let them try again
      } else {
        // Show fake success for benign or suspicious inputs
        setSuccess(true);
        
        // Auto close after showing success
        setTimeout(() => {
          setSuccess(false);
          setFormData({
            recipientAccount: "",
            recipientName: "",
            amount: "",
            description: "",
          });
          onClose();
        }, 3000);
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      recipientAccount: "",
      recipientName: "",
      amount: "",
      description: "",
    });
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 bg-card border-border shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transfer Money</CardTitle>
              <CardDescription>
                Available Balance: ₹{availableBalance.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Transfer Successful!
              </h3>
              <p className="text-muted-foreground">
                Your transfer of ₹{formData.amount} has been initiated.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Processing may take 24-48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="recipientAccount">Recipient Account Number</Label>
                <Input
                  id="recipientAccount"
                  name="recipientAccount"
                  type="text"
                  value={formData.recipientAccount}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  required
                  disabled={loading}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  type="text"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="Enter recipient name"
                  required
                  disabled={loading}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                  min="1"
                  max={availableBalance}
                  disabled={loading}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Payment note"
                  disabled={loading}
                  className="bg-background border-border"
                />
              </div>

              {error && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded text-blue-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {loadingMessage || "Processing..."}
                    </div>
                  ) : (
                    "Transfer"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
