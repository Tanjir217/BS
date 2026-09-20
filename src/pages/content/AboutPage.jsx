const sections = [
  {
    id: "our-story",
    eyebrow: "Our Story",
    title: "A considered approach to footwear.",
    body: [
      "Bayzid Shoes is built around a simple idea: a good pair of shoes should feel considered from the first look to the last step. The storefront is designed to make discovering, choosing, and caring for a pair feel clear and enjoyable.",
      "Our collections, product presentation, and customer experience are being shaped around that same principle: thoughtful products, useful information, and a shopping journey that stays focused on what matters.",
    ],
  },
  {
    id: "commitment",
    eyebrow: "Our Commitment",
    title: "Quality, clarity, and a better customer experience.",
    body: [
      "We aim to make product information easy to understand, checkout straightforward, and after-purchase support dependable. That means clear product details, practical delivery guidance, and an account experience that keeps important information close at hand.",
      "We also treat the details behind the storefront seriously. Stock, pricing, orders, customer addresses, and order status are handled through the project's server-authoritative commerce flows rather than relying on the browser for business-critical decisions.",
    ],
  },
  {
    id: "careers",
    eyebrow: "Careers",
    title: "Build the next chapter with us.",
    body: [
      "We are interested in people who care about product, design, technology, operations, and customer experience. As the business grows, opportunities can span creative, retail, operations, engineering, and customer support.",
      "When roles are available, this section will be the place to share them. If there is no open position listed, there is no current role published here.",
    ],
  },
  {
    id: "contact",
    eyebrow: "Contact",
    title: "Start a conversation.",
    body: [
      "For customer questions, order support, product guidance, or delivery concerns, use the Customer Services page for the relevant guidance before reaching out.",
      "When contacting the team about an order, include the order number and product details whenever possible. That helps the support team understand the request without unnecessary back-and-forth.",
    ],
  },
];

function AboutPage() {
  return (
    <main className="bg-[#f6f6f4] px-4 py-10 sm:px-6 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-4xl border-b border-black/10 pb-10">
          <p className="text-xs uppercase tracking-[0.18em] text-black/40">
            About Bayzid Shoes
          </p>
          <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight sm:text-6xl">
            Made to feel considered.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">
            Learn about the thinking behind the brand, our commitment to the
            customer experience, future opportunities, and how to find the
            right support.
          </p>
        </header>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="About sections">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-black/65 no-underline transition hover:border-black/25 hover:text-black"
            >
              {section.eyebrow}
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-4">
          {sections.map((section) => (
            <section
              id={section.id}
              key={section.id}
              className="scroll-mt-24 rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.045)] sm:p-10"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a1020]">
                {section.eyebrow}
              </p>
              <h2 className="mt-3 max-w-3xl font-serif text-3xl font-normal tracking-tight sm:text-4xl">
                {section.title}
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-7 text-black/58"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export default AboutPage;
