"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/app/firebase";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import Logo from "@/components/Logo";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

export default function AdminSignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // FORM STATE
  const [formData, setFormData] = useState({
    Name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { Name, email, password, confirmPassword } = formData;

    // VALIDATIONS
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Create Admin User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user; // correct user object

      // 2️⃣ Update display name (optional but recommended)
      await updateProfile(user, {
        displayName: Name,
      });

      // 3️⃣ Save Admin Data in Firestore under "admin" collection
      await setDoc(doc(db, "admin", user.uid), {
        uid: user.uid,
        Name: Name,
        email: email,
        createdAt: serverTimestamp(),
        role: "admin",
      });

      // 4️⃣ Redirect admin
      router.push("../../Dashboard");
    } catch (err) {
      console.error("Admin Signup Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered.");
      } else {
        setError(err.message);
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

      {/* Main Section */}
      <section className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center text-center">
          <div className="mb-8 mt-8 md:mt-0">
            <span className="flex text-2xl font-semibold gap-4 justify-center items-baseline">
              <h1>Admin Sign Up</h1>
              <UserRoundPlus size={24} />
            </span>

            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Register as an admin to continue.
            </p>

            {error && (
              <p className="text-red-500 font-medium mt-2 text-sm bg-red-50 p-2 rounded border border-red-200">
                {error}
              </p>
            )}
          </div>

          <Card className="w-full px-6 pb-16 shadow-md border-border bg-card backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex flex-col items-start">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>
                    <h2 className="text-md md:text-xl">Admin Details</h2>
                  </FieldLegend>
                  <FieldDescription className="text-base md:text-lg">
                    Stored securely in admin collection
                  </FieldDescription>

                  {/* NAME & EMAIL */}
                  <FieldGroup>
                    <div className="flex gap-2 w-full">
                      <Field className="w-1/2">
                        <FieldLabel htmlFor="Name">Full Name</FieldLabel>
                        <Input
                          id="Name"
                          name="Name"
                          value={formData.Name}
                          onChange={handleChange}
                          placeholder="Enter full name"
                          required
                          className="bg-card border-primary/50"
                        />
                      </Field>

                      <Field className="w-1/2">
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email"
                          required
                          className="bg-card border-primary/50"
                        />
                      </Field>
                    </div>

                    {/* PASSWORD */}
                    <div className="flex gap-2 w-full mt-4">
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
                          type="password"
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

                {/* BUTTONS */}
                <Field
                  className="mt-4 flex items-center flex-col justify-between"
                >
                  <Button
                    className="w-3/5 bg-primary text-sm md:text-base"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Signing Up..." : "Submit"}
                  </Button>

                  <p className="text-sm md:text-base flex gap-2 text-muted-foreground mt-2">
                    Already have an admin account?
                    <Link
                      href="../signinpage"
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
