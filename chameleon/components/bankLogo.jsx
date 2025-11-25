import { Cinzel } from "next/font/google";
import { IndianRupee } from "lucide-react";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cinzel",
});

export default function BankLogo() {
  return (
    <div
      className={`${cinzel.className} flex items-center gap-2 text-3xl font-semibold `}
    >
      <IndianRupee size={36}></IndianRupee>
      <h1>National Bank of India</h1>
    </div>
  );
}
