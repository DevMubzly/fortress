import Hero from "@/components/hero-home";
import FeaturesPlanet from "@/components/features-planet";
import LargeTestimonial from "@/components/large-testimonial";
import Cta from "@/components/cta";

export const metadata = {
  title: "Fortress - Your AI, Your Data",
  description: "Deploy and manage sovereign AI infrastructure securely.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturesPlanet />
      <LargeTestimonial />
      <Cta />
    </>
  );
}
