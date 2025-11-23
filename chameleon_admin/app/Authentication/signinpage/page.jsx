"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AdminSignUpPage from "../signuppage/page";
import { auth, db } from "@/app/firebase"; // adjust if your firebase path differs

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
import Logo from "@/components/Logo";
import {
  Field,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldLabel,
} from "@/components/ui/field";

export default function AdminSignInPage() {
  const router = useRouter();

  // form state
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { email, password } = form;
    if (!email || !password) {
      setError("Please provide both email and password.");
      setLoading(false);
      return;
    }

    try {
      // 1) sign in with Firebase Auth
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      if (!user) throw new Error("Authentication failed");

      // 2) check admin collection to confirm admin role
      const adminDocRef = doc(db, "admin", user.uid);
      const adminSnap = await getDoc(adminDocRef);

      if (!adminSnap.exists()) {
        // Not an admin — sign out and inform user (optional: sign out)
        // auth.signOut(); // optional: sign out to avoid leaving a normal user signed in
        setError("This account is not registered as an admin.");
        setLoading(false);
        return;
      }

      const adminData = adminSnap.data();
      if (!adminData || adminData.role !== "admin") {
        setError("This account does not have admin privileges.");
        setLoading(false);
        return;
      }

      // 3) success — redirect to admin dashboard
      router.push("../../Dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      // Provide friendly messages for common Firebase errors
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Invalid credentials. Please check your email and password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else {
        setError(err?.message || "Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex justify-center p-4 md:p-8">
        <Logo />
      </header>

      {/* Main */}
      <section className="flex flex-1 items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-2xl flex flex-col items-center text-center">
          <div className="mb-8 mt-8 md:mt-0">
            <span className="flex text-2xl font-semibold gap-4 justify-center items-baseline">
              <h1>Admin Sign In</h1>
              <UserCheck size={24} />
            </span>

            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Sign in with your admin credentials
            </p>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 font-medium mt-3 text-sm bg-red-50 p-2 rounded border border-red-200">
                {error}
              </p>
            )}
          </div>

          <Card className="w-full md:p-6 shadow-md border-border bg-card backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex flex-col items-start">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>
                    <h2 className="text-md md:text-xl">Enter Admin Credentials</h2>
                  </FieldLegend>

                  <div className="mt-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel className="text-sm md:text-base" htmlFor="email">
                          Email Id
                        </FieldLabel>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="admin@example.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                          className="bg-card border-primary/50 hover:bg-primary/10"
                        />
                      </Field>

                      <Field className="mt-4">
                        <FieldLabel className="text-sm md:text-base" htmlFor="password">
                          Password
                        </FieldLabel>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Enter your password"
                          value={form.password}
                          onChange={handleChange}
                          required
                          className="bg-card border-primary/50 hover:bg-primary/10"
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                </FieldSet>

                <Field className="flex items-center flex-col mt-6" orientation="horizontal">
                  <Button
                    className="w-2/5 bg-primary text-sm md:text-base"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>

                  <p className="text-sm md:text-base flex gap-2 text-muted-foreground mt-3">
                    Not an admin?
                    <Link href="./Authentication/signuppage" className="text-primary hover:underline underline-offset-4">
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
