import Link from "next/link";

export default function Header() {
  return (
    <header className="py-10 md:py-16 w-full flex justify-center">
      <Link href="/" className="flex items-center gap-3 group">
        <span className="text-4xl md:text-5xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-300">
          KisanSahayak
        </span>
      </Link>
    </header>
  );
}
