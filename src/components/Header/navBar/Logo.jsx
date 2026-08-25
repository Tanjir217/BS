import React from 'react'
import { Link } from 'react-router-dom'

function Logo() {
    return (
        <Link
        to="/"
        className="text-4xl font-semibold font-mono tracking-wider no-underline text-black hover:text-black hover:no-underline"
        >
        BAYZID SHOES
        </Link>
    )
}

export default Logo