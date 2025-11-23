"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase";
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
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { UserCheck } from "lucide-react";
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

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { email, password } = formData;

    try {
      // STEP 1: Classify the login attempt BEFORE Firebase auth
      const combinedInput = `${email} ${password}`;
      
      const classifyResponse = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: combinedInput }),
      });

      const classifyData = await classifyResponse.json();
      console.log('Login Classification:', classifyData);

      // Log ALL login attempts (benign and malicious)
      await fetch('/api/log-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `Login: Email=${email}`,
          payload: combinedInput,
          classification: classifyData.classification,
          confidence: classifyData.confidence,
          deceptiveResponse: classifyData.deceptiveResponse,
          clientIp: classifyData.clientIp,
          detectedBy: classifyData.detectedBy,
          xaiExplanation: classifyData.xaiExplanation,
          endpoint: '/authentication/signinpage',
          httpMethod: 'POST'
        })
      });

      // Check if it's malicious
      const isMalicious = classifyData.classification && 
                         classifyData.classification.toLowerCase() !== 'benign' &&
                         classifyData.classification.toLowerCase() !== 'safe' &&
                         classifyData.classification !== 'Unknown';

      if (isMalicious) {
        // Redirect attacker to trap WITHOUT showing error
        console.log('🚨 Malicious login detected, redirecting to trap...');
        setError("Verifying credentials...");
        setLoading(false); // Stop loading immediately
        setTimeout(() => {
          router.push('/trap');
        }, 1500);
        return; // Exit early, don't try Firebase auth
      }

      // STEP 2: Proceed with Firebase authentication (ONLY if benign)
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        
        // Successful login - redirect to real dashboard
        console.log('✅ Successful login, redirecting to dashboard');
        router.push('/dashboard');
      } catch (authErr) {
        console.error("Firebase Auth Error:", authErr);
        
        // Handle Firebase auth errors for legitimate users
        if (authErr.code === "auth/user-not-found" || 
            authErr.code === "auth/wrong-password" || 
            authErr.code === "auth/invalid-credential") {
          setError("Invalid email or password. Please check your credentials.");
        } else if (authErr.code === "auth/too-many-requests") {
          setError("Too many failed attempts. Please try again later.");
        } else {
          setError("Login failed. Please try again.");
        }
      }

    } catch (err) {
      console.error("Classification Error:", err);
      setError("Unable to process login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 🧱 Main Section */}
      <header className="flex justify-center p-4 md:p-8">
        <BankLogo></BankLogo>
      </header>
      <section className="flex flex-1 items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-2xl flex flex-col items-center text-center">
          <div className="mb-8 mt-8 md:mt-0">
            <span className="flex text-2xl font-semibold gap-4 justify-center items-baseline">
              <h1>Sign In to continue</h1>
              <UserCheck size={24}></UserCheck>
            </span>

            <p className="text-muted-foreground mt-2 text-base  md:text-lg">
              Please sign in to access your account
            </p>
          </div>
          {/* Error Message Display */}
          {error && (
            <p className="text-blue-600 font-medium mt-4 mb-2 text-sm bg-blue-50 p-3 rounded border border-blue-200">
              {error}
            </p>
          )}

          <Card className="w-full md:p-6 shadow-md border-border bg-card backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex flex-col items-start ">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>
                    <h2 className="text-md md:text-xl">
                      Enter Your Credentials
                    </h2>
                  </FieldLegend>

                  <FieldGroup>
                    <div className="w-3/5"></div>
                    <Field>
                      <FieldLabel
                        className="text-sm md:text-base"
                        htmlFor="email-signin"
                      >
                        Email Id 
                      </FieldLabel>
                      <Input
                        id="email-signin"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email id"
                        required
                        disabled={loading}
                        className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
                      />
                    </Field>
                    <Field>
                      <FieldLabel
                        className="text-sm md:text-base"
                        htmlFor="password-signin"
                      >
                        Password
                      </FieldLabel>
                      <Input
                        id="password-signin"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                        className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <Field
                  className="flex items-center flex-col mt-4"
                  orientation="horizontal"
                >
                  <Button
                    className="w-2/5 bg-primary  text-sm md:text-base"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Submit"}
                  </Button>
                  <p className="text-sm md:text-base flex gap-2 text-muted-foreground mt-2">
                    Don't have an account ?
                    <Link
                      href="/authentication/signuppage"
                      className="text-primary hover:underline underline-offset-4"
                    >
                      Sign Up
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
