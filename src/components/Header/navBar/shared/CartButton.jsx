import { ShoppingCart } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

function CartButton() {
    return (
        <Link>
        <ShoppingCart/>
        </Link>
    )
}

export default CartButton