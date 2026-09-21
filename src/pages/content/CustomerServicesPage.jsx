const sections = [
  {
    id: "contact",
    eyebrow: "Contact Us",
    title: "We are here to help.",
    body: [
      "For questions about an order, delivery, sizing, product care, or a return, keep your order number and the product name ready so our support team can help you quickly.",
      "For product or shopping questions, include the product name or SKU and tell us what you need to know. For an order issue, include the relevant order details and a short description of the problem.",
    ],
  },
  {
    id: "shipping-delivery",
    eyebrow: "Shipping & Delivery",
    title: "Delivery, from checkout to your door.",
    body: [
      "Once an order is placed, the order moves through confirmation and processing before it is handed to the delivery service. Delivery timing can vary by destination and operational conditions.",
      "Please make sure your saved delivery address, recipient name, and phone number are accurate before placing an order. If an address needs to be changed, contact support as soon as possible before the order is shipped.",
    ],
  },
  {
    id: "returns",
    eyebrow: "Returns",
    title: "A clear return process.",
    body: [
      "Return and exchange requests are handled against eligible delivered orders. When requesting a return, select the relevant items and provide the reason and any useful details.",
      "Keep the product in suitable condition and retain the original order information until the request has been reviewed. Final eligibility and resolution follow the store's order and return workflow.",
    ],
  },
  {
    id: "faq",
    eyebrow: "FAQ",
    title: "Frequently asked questions.",
    questions: [
      {
        question: "Can I save more than one delivery address?",
        answer: "Yes. Your account can keep multiple saved delivery addresses, and you can choose which one is your default.",
      },
      {
        question: "Can I cancel an order?",
        answer: "Customer cancellation is available while an order is in an eligible early status. Once the order has progressed further, cancellation may no longer be available from the customer account.",
      },
      {
        question: "How do I track a shipment?",
        answer: "When courier shipment information is available for an order, its tracking information can be shown with the order details.",
      },
      {
        question: "How do I request a return or exchange?",
        answer: "Open an eligible delivered order and start a return or exchange request from the order experience. Select the items and provide the requested reason and details.",
      },
      {
        question: "How should I choose the right shoe?",
        answer: "Use the product information and available colour details on the product page. If you need help with a specific product, include its name or SKU when contacting support.",
      },
    ],
  },
  {
    id: "product-care",
    eyebrow: "Product Care",
    title: "Care for the pair you love.",
    body: [
      "Give your shoes time to air after wear and keep them away from excessive moisture and direct heat. Store them in a clean, dry place and avoid compressing their shape.",
      "Clean according to the material of the shoe. Use a soft cloth or appropriate shoe-care product, test any cleaner on a less visible area first, and avoid soaking the shoe unless the product's care guidance specifically allows it.",
    ],
  },
];

function CustomerServicesPage() {
  return (
    <main className="bg-[#f6f6f4] px-4 py-10 sm:px-6 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl border-b border-black/10 pb-10">
          <p className="text-xs uppercase tracking-[0.18em] text-black/40">
            Customer Services
          </p>
          <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight sm:text-6xl">
            Everything you need, in one place.
          </h1>
          <p className="mt-5 text-sm leading-7 text-black/55 sm:text-base">
            Find guidance for orders, delivery, returns, frequently asked
            questions, and looking after your shoes.
          </p>
        </header>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Customer service sections">
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

              {section.body && (
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
              )}

              {section.questions && (
                <div className="mt-7 divide-y divide-black/10 border-y border-black/10">
                  {section.questions.map((item) => (
                    <details key={item.question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-medium">
                        {item.question}
                        <span className="text-lg font-light text-black/35 transition group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="max-w-3xl pt-3 text-sm leading-7 text-black/55">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export default CustomerServicesPage;
