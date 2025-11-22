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
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 🧱 Main Section */}
      <header className="flex justify-center p-4 md:p-8">
        <BankLogo></BankLogo>
      </header>
      <section className="flex flex-1 items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-2xl flex flex-col items-center text-center">
          <div className="mb-8 mt-8 md:mt-0">
            <span className="flex items-center text-2xl font-semibold gap-4 justify-center items-baseline">
              <h1>Sign In to continue</h1>
              <UserCheck size={24}></UserCheck>
            </span>

            <p className="text-muted-foreground mt-2 text-base  md:text-lg">
              Please sign in to access your account
            </p>
          </div>
          <Card className="w-full md:p-6 shadow-md border-border bg-card backdrop-blur-sm">
            <form className="flex flex-col items-start ">
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
                        htmlFor="checkout-7j9-card-name-43j"
                      >
                        Username
                      </FieldLabel>
                      <Input
                        id="checkout-7j9-card-name-43j"
                        placeholder="Enter your username"
                        required
                        className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
                      />
                    </Field>
                    <Field>
                      <FieldLabel
                        className="text-sm md:text-base"
                        htmlFor="checkout-7j9-card-name-43j"
                      >
                        Password
                      </FieldLabel>
                      <Input
                        id="checkout-7j9-card-name-43j"
                        type="password"
                        placeholder="Enter your password"
                        required
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
                  >
                    Submit
                  </Button>
                  <p className="text-sm md:text-base flex gap-2 text-muted-foreground mt-2">
                    Don't have an account ?
                    <Link
                      href="./authentication/signuppage"
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
