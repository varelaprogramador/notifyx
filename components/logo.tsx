import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 167, height = 35 }: LogoProps) {
  return (
    <Link href="/dashboard" className={className}>
      <Image
        src="/logo.svg"
        alt="NotifyX Logo"
        width={width}
        height={height}
        priority
        className="dark:invert-0"
      />
    </Link>
  );
}
