import GlobeDemo from "@/components/globe-demo";

export default function FeaturesPlanet() {
  return (
    <section className="relative before:absolute before:inset-0 before:-z-20 before:bg-neutral-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-16 text-center md:pb-20">
            <h2 className="text-3xl font-bold text-gray-200 md:text-4xl">
              Data sovereignty, security, and compliance
            </h2>
          </div>
          {/* Planet */}
          <div className="pb-16 md:pb-20" data-aos="zoom-y-out">
            <div className="text-center">
              <div className="relative mx-auto w-full max-w-3xl">
                <GlobeDemo />
              </div>
            </div>
          </div>
          {/* Grid */}
          <div className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3 *:relative *:p-6 *:before:absolute *:before:bg-gray-800 *:before:[block-size:100vh] *:before:[inline-size:1px] *:before:[inset-block-start:0] *:before:[inset-inline-start:-1px] *:after:absolute *:after:bg-gray-800 *:after:[block-size:1px] *:after:[inline-size:100vw] *:after:[inset-block-start:-1px] *:after:[inset-inline-start:0] md:*:p-10">
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <svg
                  className="fill-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                >
                  <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm2-4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4Zm1 10a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H5Z" />
                </svg>
                <span>Full Data Sovereignty</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                Keep sensitive data within your borders. Fortress enables
                governments and institutions to maintain full control over their
                AI infrastructure.
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <svg
                  className="fill-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                >
                  <path d="M15 15a1 1 0 0 1-2 0A1 1 0 0 0 12 14a1 1 0 0 1 0-2A3 3 0 0 1 15 15Zm-6-5a4 4 0 0 0-4 4 1 1 0 0 1-2 0 6 6 0 0 1 6-6 1 1 0 0 1 0 2Z" />
                </svg>
                <span>Enterprise Security</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                Secure enterprise authentication (SSO), role-based access control,
                and encrypted storage to meet strict compliance requirements.
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <svg
                  className="fill-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                >
                  <path d="M13.586 7.586A2 2 0 1 1 15 9V0h-1v5a4 4 0 0 0-4 4h1a3 3 0 0 1 3-3 1 1 0 0 1 .586 1.586ZM10 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
                <span>Compliant Infrastructure</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                A foundational platform built for regulated environments—ideal for banks,
                governments, and healthcare organizations.
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <svg
                  className="fill-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                >
                  <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM2 14V2h12v12H2Z" />
                </svg>
                <span>Local Deployment</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                Eliminate reliance on external cloud providers. Deploy and manage
                artificial intelligence systems directly in your data center.
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <svg
                  className="fill-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                >
                  <path d="M0 8a8 8 0 1 0 16 0A8 8 0 0 0 0 8Zm8-6a6 6 0 1 1 0 12A6 6 0 0 1 8 2Z" />
                </svg>
                <span>Scalable AI</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                Host AI models locally for document intelligence, fraud detection,
                analytics, and research computing at scale.
              </p>
            </article>
            <article>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <svg
                  className="fill-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                >
                  <path d="M14 0H2c-.6 0-1 .4-1 1v14c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V1c0-.6-.4-1-1-1ZM3 2h10v2H3V2Zm0 4h10v2H3V6Zm0 4h10v2H3v-2Zm0 4h7v2H3v-2Z" />
                </svg>
                <span>Audit Logging</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                Complete transparency with detailed audit logs for every action,
                ensuring accountability and compliance.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
