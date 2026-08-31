import { Search } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

function SearchButton() {
    return (
        <Link>
        <Search
        className=''
        color='#5A1020'
        />
        </Link>
    )
}

export default SearchButton