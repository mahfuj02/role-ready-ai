import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center transition opacity-100 hover:opacity-85">
      <Image
        src="/roleready_logo.png"
        alt="RoleReady"
        width={140}
        height={36}
        className="h-9 w-auto object-contain"
        priority
      />
    </Link>
  );
}
