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
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 🧱 Main Section */}
      <header className="flex justify-center p-4 md:p-8">
        <BankLogo></BankLogo>
      </header>
      <section className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center text-center">
          <div className="mb-8 mt-8 md:mt-0">
            <span className="flex items-center text-2xl font-semibold gap-4 justify-center items-baseline">
                <h1>Sign Up to continue</h1>
                <UserRoundPlus size={24}></UserRoundPlus>
            </span>

            <p className="text-muted-foreground mt-2 text-base  md:text-lg">
              Complete your registration to get started
            </p>
          </div>
          <Card className="w-full md:p-6 shadow-md border-border bg-card backdrop-blur-sm">
            <form className="flex flex-col items-start ">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>
                    <h2 className="text-md md:text-xl">Profile Details</h2>
                  </FieldLegend>
                  <FieldDescription className="text-base md:text-lg">
                    All your data is stored securely
                  </FieldDescription>
                  <FieldGroup>
                    <div className="flex gap-2 ">
                      <Field>
                        <FieldLabel
                          className="text-sm md:text-base"
                          htmlFor="checkout-7j9-card-name-43j"
                        >
                          First Name
                        </FieldLabel>
                        <Input
                          id="checkout-7j9-card-name-43j"
                          placeholder="Enter your first name"
                          required
                          className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
                        />
                      </Field>
                      <Field>
                        <FieldLabel
                          className="text-sm md:text-base"
                          htmlFor="checkout-7j9-card-name-43j"
                        >
                          Last Name
                        </FieldLabel>
                        <Input
                          id="checkout-7j9-card-name-43j"
                          placeholder="Enter your last name"
                          required
                          className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
                        />
                      </Field>
                    </div>
                    <div className="flex gap-2 ">
                      <Field>
                        <FieldLabel
                          className="text-sm md:text-base"
                          htmlFor="checkout-7j9-card-name-43j"
                        >
                          Username
                        </FieldLabel>
                        <Input
                          id="checkout-7j9-card-name-43j"
                          placeholder="Enter your first name"
                          required
                          className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
                        />
                      </Field>
                    </div>
                    <div className="flex gap-2 ">
                      <Field>
                        <FieldLabel
                          className="text-sm md:text-base"
                          htmlFor="checkout-7j9-card-name-43j"
                        >
                          Password
                        </FieldLabel>
                        <Input
                          id="checkout-7j9-card-name-43j"
                          placeholder="Enter your first name"
                          required
                          className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
                        />
                      </Field>
                      <Field>
                        <FieldLabel
                          className="text-sm md:text-base"
                          htmlFor="checkout-7j9-card-name-43j"
                        >
                          Confirm Password
                        </FieldLabel>
                        <Input
                          id="checkout-7j9-card-name-43j"
                          placeholder="Enter your first name"
                          required
                          className="bg-card border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10"
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
                  >
                    Submit
                  </Button>
                  <p className="text-sm md:text-base flex gap-2 text-muted-foreground mt-2">
                    Already have an account?{" "}
                    <Link
                      href="../"
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
