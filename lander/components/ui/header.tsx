import Link from "next/link";
import Logo from "./logo";

export default function Header() {
  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative flex h-20 items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 shadow-lg shadow-black/[0.03] backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--color-gray-100),var(--color-gray-200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
          {/* Site branding */}
          <div className="flex flex-1 items-center z-10">
            <Logo />
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:grow z-10">
            <ul className="flex grow justify-end flex-wrap items-center gap-4">
              {/* <li>
                <Link
                  href="/pricing"
                  className="font-medium text-gray-600 hover:text-gray-900 flex items-center transition duration-150 ease-in-out"
                >
                  Pricing
                </Link>
              </li> */}
              <li>
                <Link
                  href="/docs"
                  className="font-medium text-gray-600 hover:text-gray-900 flex items-center transition duration-150 ease-in-out"
                >
                  Docs
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact Sales */}
          <div className="hidden md:flex items-center justify-end gap-3 z-10 pl-4">
            <Link
              href="/contact"
              className="btn-sm bg-gray-800 text-gray-200 shadow-sm hover:bg-gray-900 group"
            >
              Contact Sales
              <span className="ml-2 tracking-normal text-blue-300 transition-transform group-hover:translate-x-0.5">
                -&gt;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
