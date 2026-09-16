import React from 'react'
import { User } from 'lucide-react'
import { Link } from 'react-router-dom'
function AccountButton() {
    return (
        <Link
        to={"/account"}
        >
        <User
        color='#5A1020'
        />
        </Link>
    )
}

export default AccountButton