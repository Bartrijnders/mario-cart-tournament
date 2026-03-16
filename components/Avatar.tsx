"use client";
import { Character } from "@/lib/types";

interface AvatarProps {
  character: Character;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-2xl",
};

export function Avatar({ character, size = "md" }: AvatarProps) {
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
