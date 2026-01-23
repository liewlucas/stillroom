import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, ShoppingBag, CheckCircle2 } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 p-6 border-b border-white/10 md:border-transparent">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Camera className="w-6 h-6" />
            <span>Stillroom</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#" className="hover:text-primary transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <SignedIn>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" className="font-medium">Login</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background - kept subtle logic but light compatible if needed, or stick to clean white */}
        <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-muted/50 to-background" />

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-background mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Now available in public beta
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground drop-shadow-sm">
            Photo delivery made easy.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform to deliver, proof, and sell your photos.
            Built for photographers, by photographers.
          </p>

          <div className="max-w-md mx-auto relative mb-4 flex gap-4 justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="rounded-full h-12 px-8 text-base">
                  Start for Free
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full h-12 px-8 text-base">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>

          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4">No credit card required</p>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="relative z-10 -mt-12 md:-mt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="relative rounded-xl overflow-hidden border shadow-2xl bg-card aspect-[16/10] md:aspect-[21/9] group">
            <Image
              src="/dashboard-preview.png"
              alt="Dashboard Preview"
              fill
              className="object-cover"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-background border shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Beautiful Galleries</h3>
              <p className="text-muted-foreground leading-relaxed">
                Deliver stunning, branded photo galleries with ease.
                Make a lasting impression on your clients.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-background border shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Client Proofing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Let clients favorite and download their selects seamlessly.
                Streamline your selection workflow.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-background border shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Easy Sales</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sell digital downloads and prints without any hassle.
                Integrated payments (Coming Soon).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 max-w-2xl mx-auto">
            Join hundreds of photographers who trust Stillroom.
          </h2>

          <div className="flex flex-col items-center gap-4">
            <SignUpButton mode="modal">
              <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full text-lg font-semibold">
                Get Started Free
              </Button>
            </SignUpButton>
            <p className="text-sm opacity-60">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 bg-background border-t text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Stillroom. All rights reserved.</p>
      </footer>

    </div>
  );
}
