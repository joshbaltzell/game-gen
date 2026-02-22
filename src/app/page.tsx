"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--accent)] tracking-tight">
            GameGenerator
          </h1>
          <p className="text-lg text-[var(--foreground)] opacity-70">
            AI-Powered Mad Libs Platformer
          </p>
        </div>

        {/* Pixel art decoration */}
        <div className="text-6xl">
          🎮
        </div>

        {/* Description */}
        <div className="space-y-3 text-sm text-[var(--foreground)] opacity-60">
          <p>Fill in the blanks with any words you like.</p>
          <p>AI creates a unique story and pixel art world.</p>
          <p>Play your one-of-a-kind platformer adventure!</p>
        </div>

        {/* CTA */}
        <Link
          href="/create"
          className="inline-block px-8 py-4 bg-[var(--accent)] text-[var(--background)] font-bold text-lg rounded-lg hover:opacity-90 transition-opacity active:scale-95 transform"
        >
          Create Your Game
        </Link>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 pt-8 text-xs text-[var(--foreground)] opacity-40">
          <div className="space-y-1">
            <div className="text-2xl">📝</div>
            <div>Fill in blanks</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">🤖</div>
            <div>AI generates</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">🕹️</div>
            <div>Play your game</div>
          </div>
        </div>
      </div>
    </main>
  );
}
