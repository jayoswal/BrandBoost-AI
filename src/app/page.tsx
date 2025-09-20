import {Sparkles} from 'lucide-react';
import BrandBoostClient from './client';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4 md:px-6">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-primary">BrandBoost</h1>
        </div>
      </header>
      <main className="flex-1">
        <BrandBoostClient />
      </main>
      <footer className="container mx-auto py-6 text-center text-sm text-muted-foreground">
        <p>Powered by Gemini. Built with Next.js and Shadcn/ui.</p>
      </footer>
    </div>
  );
}
