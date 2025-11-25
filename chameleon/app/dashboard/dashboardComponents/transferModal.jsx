"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  doc,
  runTransaction,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function TransferModal({ open, onClose, uid, availableBalance }) {
  const [formData, setFormData] = useState({
    accountNumber: "",
    beneficiaryName: "",
    amount: "",
  });
  const [errors, setErrors] = useState({
    accountNumber: "",
    beneficiaryName: "",
    amount: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const validateForm = () => {
    const newErrors = { accountNumber: "", beneficiaryName: "", amount: "" };
    let isValid = true;

    if (!formData.accountNumber) {
      newErrors.accountNumber = "Account number is required";
      isValid = false;
    } else if (!/^\d{10,16}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = "Account number must be 10–16 digits";
      isValid = false;
    }

    if (!formData.beneficiaryName.trim()) {
      newErrors.beneficiaryName = "Beneficiary name is required";
      isValid = false;
    } else if (formData.beneficiaryName.trim().length < 3) {
      newErrors.beneficiaryName = "Name must be at least 3 characters";
      isValid = false;
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
      isValid = false;
    } else {
      const amt = parseFloat(formData.amount);
      if (isNaN(amt) || amt <= 0) {
        newErrors.amount = "Amount must be > 0";
        isValid = false;
      } else if (availableBalance !== undefined && amt > availableBalance) {
        newErrors.amount = "Insufficient balance";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setFormData({ accountNumber: "", beneficiaryName: "", amount: "" });
    setErrors({ accountNumber: "", beneficiaryName: "", amount: "" });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();

    if (!uid) {
      toast.error("You must be signed in to transfer");
      return;
    }
    if (!validateForm()) return;

    const amountNum = parseFloat(formData.amount);
    const txId = `tx_${Date.now()}`;

    setSubmitting(true);
    try {
      const userDocRef = doc(db, "users", uid);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userDocRef);
        if (!userSnap.exists()) {
          throw new Error("User not found");
        }
        const userData = userSnap.data();
        const currentBalance = Number(userData.accBalance || 0);

        if (amountNum > currentBalance) {
          throw new Error("Insufficient balance");
        }

        const newBalance = currentBalance - amountNum;

        // Use client timestamp inside the array element (quick fix)
        const newTransaction = {
          id: txId,
          type: "debit",
          description: `Bank transfer to ${formData.beneficiaryName}`,
          amount: -Math.abs(amountNum),
          date: new Date().toISOString().slice(0, 10),
          meta: {
            accountNumber: formData.accountNumber,
            createdAt: new Date().toISOString(), // <-- client timestamp (no serverTimestamp)
          },
        };

        // Update balance and append transaction to array
        transaction.update(userDocRef, {
          accBalance: newBalance,
          transactions: arrayUnion(newTransaction),
          lastUpdated: serverTimestamp(), // allowed here
        });
      });

      toast.success(`₹${amountNum.toLocaleString("en-IN")} sent successfully`);
      resetForm();
      onClose?.();
      // onSnapshot on dashboard will pick up changes
    } catch (err) {
      console.error("Transfer error:", err);
      toast.error(err?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!submitting) {
            resetForm();
            onClose?.();
          }
        }}
      />

      <div className="relative w-full max-w-lg p-6">
        <Card className="border-border bg-card">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-2">Bank Transfer</h2>
            <p className="text-sm text-muted-foreground mb-4">Send money securely</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                  className={errors.accountNumber ? "border-destructive" : ""}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-destructive">{errors.accountNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                <Input
                  id="beneficiaryName"
                  type="text"
                  placeholder="Enter beneficiary name"
                  value={formData.beneficiaryName}
                  onChange={(e) => handleInputChange("beneficiaryName", e.target.value)}
                  className={errors.beneficiaryName ? "border-destructive" : ""}
                />
                {errors.beneficiaryName && (
                  <p className="text-sm text-destructive">{errors.beneficiaryName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  className={errors.amount ? "border-destructive" : ""}
                />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
              </div>

              <div className="flex gap-2">
                {[1000, 5000, 10000, 25000].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange("amount", amt.toString())}
                  >
                    ₹{amt.toLocaleString("en-IN")}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" onClick={() => { if(!submitting) { resetForm(); onClose?.(); } }}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={submitting}>
                  <Send className="h-4 w-4" />
                  {submitting ? "Processing..." : "Transfer Money"}
                </Button>
              </div>
            </form>

            <div className="mt-4 text-xs text-muted-foreground">
              🔒 Your transaction is secured (demo). Balance update is performed atomically.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
