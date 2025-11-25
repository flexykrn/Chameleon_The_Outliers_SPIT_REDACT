import Image from "next/image";
import logo from "../public/honey.png";

export default function Logo() {
  return (
    <div className="flex gap-2">
      <Image
       src={logo}
        alt="Chameleon Logo"
        width={32}
        height={32}
      />
      <h1 className="text-2xl font-bold bg-linear-to-r from-yellow-200 to-orange-300 bg-clip-text text-transparent">
        Security Dashboard
      </h1>
    </div>
  );
}
