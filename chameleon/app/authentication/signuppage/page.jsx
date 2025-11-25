"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Use this for redirection
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Import your initialized instances
import { auth, db } from "@/app/firebase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import BankLogo from "@/components/bankLogo";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";


export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. State to hold form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user types
    if (error) setError("");
  };

  // 3. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { firstName, lastName, email, password, confirmPassword } = formData;

    // Basic Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // STEP 0: Classify the input BEFORE creating account
      const combinedInput = `${firstName} ${lastName} ${email} ${password}`;
      
      const classifyResponse = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: combinedInput }),
      });

      const classifyData = await classifyResponse.json();
      console.log('Signup Classification:', classifyData);

      // Log the signup attempt (both benign and malicious)
      await fetch('/api/log-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `Signup: Name=${firstName} ${lastName}, Email=${email}`,
          payload: combinedInput,
          classification: classifyData.classification,
          confidence: classifyData.confidence,
          deceptiveResponse: classifyData.deceptiveResponse,
          clientIp: classifyData.clientIp,
          detectedBy: classifyData.detectedBy,
          xaiExplanation: classifyData.xaiExplanation,
          endpoint: '/authentication/signuppage',
          httpMethod: 'POST'
        })
      });

      // Check if it's malicious
      const isMalicious = classifyData.classification && 
                         classifyData.classification.toLowerCase() !== 'benign' &&
                         classifyData.classification.toLowerCase() !== 'safe' &&
                         classifyData.classification !== 'Unknown';

      if (isMalicious) {
        // Redirect attacker to trap immediately
        console.log('🚨 Malicious signup detected, redirecting to trap...');
        setError("Creating your account...");
        setLoading(false); // Stop loading immediately
        setTimeout(() => {
          router.push('/trap');
        }, 1500);
        return; // Exit early, don't create account
      }

      // A. Create User in Authentication (ONLY if benign)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // B. Update "Display Name" in Auth (optional but good for UI)
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // C. Store Detailed User Data in Firestore
      // We use setDoc with user.uid so the Auth ID matches the Database ID
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        accBalance: 50000,
        transactions: [
          {
            id: 1,
            type: "credit",
            description: "Salary Credit",
            amount: 85000,
            date: "2025-11-20",
          },
          {
            id: 2,
            type: "debit",
            description: "Online Purchase - Amazon",
            amount: -2450.5,
            date: "2025-11-19",
          },
          {
            id: 3,
            type: "credit",
            description: "Refund - Flipkart",
            amount: 899,
            date: "2025-11-18",
          },
          {
            id: 4,
            type: "debit",
            description: "Electricity Bill",
            amount: -1200,
            date: "2025-11-17",
          },
          {
            id: 5,
            type: "debit",
            description: "Restaurant - Zomato",
            amount: -850,
            date: "2025-11-16",
          },
        ],
        fixedDeposits: [
          {
            id: 1,
            amount: 500000,
            rate: 7.5,
            maturityDate: "2026-06-15",
            tenure: "1 Year",
          },
          {
            id: 2,
            amount: 1000000,
            rate: 8.0,
            maturityDate: "2027-03-20",
            tenure: "2 Years",
          },
        ],
        documents: [
          {
            id: 1,
            name: "Account Statement - October 2025",
            type: "PDF",
            size: "2.4 MB",
          },
          {
            id: 2,
            name: "Tax Certificate FY 2024-25",
            type: "PDF",
            size: "1.1 MB",
          },
          { id: 3, name: "Fixed Deposit Receipt", type: "PDF", size: "856 KB" },
          { id: 4, name: "Passbook Copy", type: "PDF", size: "3.2 MB" },
        ],
        createdAt: serverTimestamp(),
        role: "customer", // Example field
      });

      // D. Redirect to Dashboard or Login
      router.push("../../dashboard");
    } catch (err) {
      console.error("Signup Error:", err);
      // Simplify Firebase error messages
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 🧱 Main Section */}
      <header className="flex justify-center p-4 md:p-8">
        <BankLogo />
      </header>
      <section className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center text-center">
          <div className="mb-8 mt-8 md:mt-0">
            <span className="flex  text-2xl font-semibold gap-4 justify-center items-baseline">
              <h1>Sign Up to continue</h1>
              <UserRoundPlus size={24} />
            </span>

            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Complete your registration to get started
            </p>

            {/* Error Message Display */}
            {error && (
              <p className="text-red-500 font-medium mt-2 text-sm bg-red-50 p-2 rounded border border-red-200">
                {error}
              </p>
            )}
          </div>

          <Card className="w-full md:p-6 shadow-md border-border bg-card backdrop-blur-sm">
            {/* Add onSubmit handler here */}
            <form onSubmit={handleSubmit} className="flex flex-col items-start">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>
                    <h2 className="text-md md:text-xl">Profile Details</h2>
                  </FieldLegend>
                  <FieldDescription className="text-base md:text-lg">
                    All your data is stored securely
                  </FieldDescription>
                  <FieldGroup>
                    {/* FIRST NAME & LAST NAME */}
                    <div className="flex gap-2 w-full">
                      <Field className="w-1/2">
                        <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                        <Input
                          id="firstName"
                          name="firstName" // Name attribute is crucial for handleChange
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Enter first name"
                          required
                          className="bg-card border-primary/50"
                        />
                      </Field>
                      <Field className="w-1/2">
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Enter last name"
                          required
                          className="bg-card border-primary/50"
                        />
                      </Field>
                    </div>

                    {/* EMAIL */}
                    <div className="flex gap-2 w-full">
                      <Field className="w-full">
                        <FieldLabel htmlFor="email">Email Id</FieldLabel>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email id"
                          required
                          className="bg-card border-primary/50"
                        />
                      </Field>
                    </div>

                    {/* PASSWORD & CONFIRM */}
                    <div className="flex gap-2 w-full">
                      <Field className="w-1/2">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter password"
                          required
                          className="bg-card border-primary/50"
                        />
                      </Field>
                      <Field className="w-1/2">
                        <FieldLabel htmlFor="confirmPassword">
                          Confirm Password
                        </FieldLabel>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password" // Fixed type
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                          required
                          className="bg-card border-primary/50"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </FieldSet>

                <Field
                  className="flex items-center flex-col md:flex-row justify-between"
                  orientation="horizontal"
                >
                  <Button
                    className="w-2/5 bg-primary  text-sm md:text-base"
                    type="submit"
                    disabled={loading} // Disable while loading
                  >
                    {loading ? "Signing Up..." : "Submit"}
                  </Button>

                  <p className="text-sm md:text-base flex gap-2 text-muted-foreground mt-2">
                    Already have an account?{" "}
                    <Link
                      href="/authentication/signinpage"
                      className="text-primary hover:underline underline-offset-4"
                    >
                      Sign In
                    </Link>
                  </p>
                </Field>
              </FieldGroup>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}
