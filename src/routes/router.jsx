import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/home/Home'
const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout/>,
        children: [{
            index: true,
            element: <Home/>
        }]
    }
])
    


export default router