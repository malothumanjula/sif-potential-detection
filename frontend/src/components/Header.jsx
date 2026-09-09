import React from "react";

export default function Header({ title, subtitle }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-2xl md:text-[1.65rem] font-semibold text-mist-100 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-mist-400 text-sm mt-1.5 max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
}
