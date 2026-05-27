"use client";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  online?: boolean;
}

export default function Avatar({ src, name, size = 40, online }: AvatarProps) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <Image
          src={src}
          alt={name ?? "User"}
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      ) : (
        <div
          className="rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full border-2 border-white ${online ? "bg-green-400" : "bg-gray-400"}`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
