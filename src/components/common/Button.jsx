import React from 'react'

function Button({className, message, ...props}) {
    return (
        <>
        <button
        className={className}
        {...props}
        >
            {message}
        </button>
        </>
    )
}

export default Button