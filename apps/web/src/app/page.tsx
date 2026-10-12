import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { WalletStrip } from "@/components/landing/wallets";
import { Showcase } from "@/components/landing/showcase";
import { Steps, UniqueAddress, Privacy, Standards } from "@/components/landing/sections";
import { ProofSection } from "@/components/landing/proof";
import { Roadmap } from "@/components/landing/roadmap";
import { Faq } from "@/components/landing/faq";
import { ClosingCta, Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <WalletStrip />
        <Showcase />
        <Steps />
        <UniqueAddress />
        <ProofSection />
        <Privacy />
        <Standards />
        <Roadmap />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
