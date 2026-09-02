import React from 'react'
import Button from '../../components/common/Button'
function Admin() {
    function handleClick() {
        console.log("Button clicked!");
    }
    return (
        <>
        <Button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        message = "admin"
        onClick={handleClick}  
        />
        </>
    )
}

export default Admin