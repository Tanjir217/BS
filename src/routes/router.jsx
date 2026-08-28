import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/home/Home'
import NotFound from '../pages/home/NotFound'
const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout/>,
        errorElement: <NotFound/>,
        children: [{
            index: true,
            element: <Home/>
        }]

    }
])
    


export default router