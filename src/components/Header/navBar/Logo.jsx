import React from 'react'
import { Link } from 'react-router-dom'

function Logo() {
    return (
        <Link
        to="/"
        className="text-4xl font-bold text-gray-400 no-underline"
        >
        BAYZID SHOES
        </Link>
    )
}

export default Logo