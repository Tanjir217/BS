import React from 'react'
import { Link } from 'react-router-dom'
function Logo() {
  return (
    <Link
    to={"/"}
    className={`text-sm sm:text-xl md:text-2xl tracking-widest font-semibold`}
    >
      BAYZID SHOES
    </Link>
  )
}

export default Logo