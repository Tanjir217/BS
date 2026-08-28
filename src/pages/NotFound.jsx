import { Link } from "react-router-dom";

function NotFound() {
  return (
    <>
    <section className="mx-auto grid min-h-[50vh] max-w-xl place-items-center px-6 py-20 text-center">
      <div>
        <p className="text-sm tracking-[0.16em]">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-neutral-600">The page you requested is unavailable or has moved.</p>
        <Link className="mt-8 inline-block border border-black px-5 py-3 text-sm" to="/">Return home</Link>
      </div>
    </section>
    </>
    
  );
}

export default NotFound;
