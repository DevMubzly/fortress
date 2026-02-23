import Image from "next/image";
import * as motion from "motion/react-client"
import OpenContactModalButton from "./open-contact-modal-button";

export default function HeroHome() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-screen-2xl px-8 sm:px-12 lg:px-20">
        {/* Hero content */}
        <div className="pb-16 pt-40 md:pb-28 md:pt-52">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Left column: Text content */}
            <div className="text-center lg:text-left">
              <h1
                className="mb-6 text-5xl font-bold [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] lg:[border-image:linear-gradient(to_right,--theme(--color-slate-300/.8),transparent)1] md:text-6xl"
                data-aos="zoom-y-out"
                data-aos-delay={150}
              >
                Take back control of your AI
                
              </h1>
              <div className="mx-auto max-w-3xl lg:mx-0">
                <p
                  className="mb-8 text-lg text-gray-700"
                  data-aos="zoom-y-out"
                  data-aos-delay={300}
                >
                  Secure, on-premise AI infrastructure for institutions that require
                  full control over sensitive data. Deploy and manage AI systems
                  within your own data centers.
                </p>
                <div className="relative before:absolute before:inset-0 before:[border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] lg:before:[border-image:linear-gradient(to_right,--theme(--color-slate-300/.8),transparent)1]">
                  <div
                    className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center lg:justify-start"
                    data-aos="zoom-y-out"
                    data-aos-delay={450}
                  >
                    <OpenContactModalButton
                      className="btn group mb-4 w-full bg-linear-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    >
                      <span className="relative inline-flex items-center">
                        Contact Sales{" "}
                        <span className="ml-1 tracking-normal text-blue-300 transition-transform group-hover:translate-x-0.5">
                          -&gt;
                        </span>
                      </span>
                    </OpenContactModalButton>
                    <a
                      className="btn w-full bg-white text-gray-800 shadow-sm hover:bg-gray-50 sm:ml-4 sm:w-auto"
                      href="/docs"
                    >
                      Read Documentation
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column: Image */}
            <div
              className="relative mx-auto w-full max-w-3xl lg:mx-0"
              data-aos="zoom-y-out"
              data-aos-delay={600}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="w-full h-auto"
              >
                <Image
                  src="/images/Visual22.webp"
                  alt="Visual22"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
