import { Search } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

function SearchButton() {
    return (
        <Link>
        <Search/>
        </Link>
    )
}

export default SearchButton