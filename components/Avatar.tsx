"use client";
import Image from "next/image";
import { Character } from "@/lib/types";

interface AvatarProps {
  character: Character;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizePx = {
  sm: 28,
  md: 36,
  lg: 56,
  xl: 80,
};

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-2xl",
};

export function Avatar({ character, size = "md" }: AvatarProps) {
  if (character.imageUrl) {
    return (
      <Image
        src={character.imageUrl}
        alt={character.name}
        width={sizePx[size]}
        height={sizePx[size]}
        className="flex-shrink-0 object-contain drop-shadow-md"
        title={character.name}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white shadow-md`}
      style={{ backgroundColor: character.color }}
      title={character.name}
    >
      {character.abbreviation}
    </div>
  );
}
