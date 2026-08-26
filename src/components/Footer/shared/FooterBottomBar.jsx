import { Link } from "react-router-dom";
import { footerLegalLinks, socialLinks } from "../../../data/footer";

function FooterBottomBar() {
  return (
    <div className="border-t border-gray-300">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-5 py-6 md:flex-row md:items-center md:justify-between">

        {/* Legal */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLegalLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-[10px] tracking-[0.08em] text-gray-600 no-underline transition-opacity hover:opacity-50"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Social */}
        <div className="flex gap-5">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.08em] text-gray-700 no-underline transition-opacity hover:opacity-50"
            >
              {social.label}
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}

export default FooterBottomBar;