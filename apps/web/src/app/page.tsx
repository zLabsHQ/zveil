import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { WalletStrip } from "@/components/landing/wallets";
import { Steps, UniqueAddress, Privacy, Standards } from "@/components/landing/sections";
import { Pricing } from "@/components/landing/pricing";
import { ClosingCta, Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <WalletStrip />
        <Steps />
        <UniqueAddress />
        <Privacy />
        <Standards />
        <Pricing />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
