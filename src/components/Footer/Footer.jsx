import React, {useState} from 'react'
import { footerColumns } from '../../data/footer'
import FooterColumn from './desktop/FooterColumn'
import FooterMobileAccordion from './mobile/FooterMobileAccordion'
import FooterBottomBar from './shared/FooterBottomBar'
function Footer() {
  const [openSection , setOpenSection] = useState(null)
  const handleToggle = (sectionId) => {
    setOpenSection((current) =>
      current === sectionId ? null : sectionId
    );
  };
  return (
    <footer className="border-t border-gray-300 bg-white text-black flex flex-col">

    {/* Desktop Footer */}
    <div className="mx-auto hidden max-w-360 px-16 py-18 md:block">

      {/* Brand */}
      <div className="mb-14 text-center">
        <h2 className="text-[24px] font-normal tracking-[0.12em]">
          BAYZID SHOES
        </h2>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-4">
        {footerColumns.map((column) => (
          <FooterColumn
            key={column.id}
            column={column}
            
          />
        ))}
      </div>

    </div>

    {/* Mobile Footer */}
    <div className="px-5 md:hidden">

      {/* Brand */}
      <div className="py-10 text-center">
        <h2 className="text-[21px] font-normal tracking-[0.12em]">
          BAYZID SHOES
        </h2>
      </div>

      {/* Accordions */}
      <div>
        {footerColumns.map((column) => (
          <FooterMobileAccordion
            key={column.id}
            column={column}
            isOpen = {openSection === column.id}
            onToggle =  {() => handleToggle(column.id)}
          />
        ))}
      </div>

    </div>

    {/* Bottom */}
    <FooterBottomBar />

  </footer>
    
  )
}

export default Footer