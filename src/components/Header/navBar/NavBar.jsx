import React from 'react'
import Logo from './Logo'
import { NavLink } from 'react-router-dom'
function NavBar() {
    return (
        <NavLink>
            <Logo/>
        </NavLink>
        
    )
}

export default NavBar