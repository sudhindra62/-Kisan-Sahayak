import Link from "next/link";
import { Logo } from "@/app/components/icons";

export default function Header() {
  return (
    <header className="py-6 mb-4 md:mb-8 w-full flex justify-center">
      <Link href="/" className="flex items-center gap-3 group">
        <Logo className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
        <span className="text-2xl font-bold font-headline text-foreground group-hover:text-primary transition-colors">
          KisanSahayak
        </span>
      </Link>
    </header>
  );
}
