import { Link } from "react-router-dom";
import { footerLegalLinks, socialLinks } from "../../../data/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function FooterBottomBar() {
  return (
    <div className="border-t border-gray-300">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-10 py-4 md:flex-row md:items-center md:justify-between">

        {/* Legal */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLegalLinks.map((link) => (
            <Link
              key={link.id}
              to={link.href}
              className="text-md tracking-wide text-gray-600 no-underline transition-opacity hover:opacity-50"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Social */}
        <div className="flex gap-3">
          {socialLinks.map((social) => (
            <Link
            to={social.href}
              key={social.id}
              // href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
            >
              <FontAwesomeIcon
              icon={social.icon}
              className="text-lg text-gray-700 no-underline transition-opacity hover:opacity-50"
              />
              
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

export default FooterBottomBar;