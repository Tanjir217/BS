import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/home/Home'
import NotFound from '../pages/NotFound'
import ProductDetail from '../pages/product/ProductDetail'
const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout/>,
        errorElement: <NotFound/>,
        children: [
            {
            index: true,
            element: <Home/>
        },
        {
            path: "*",
            element: <NotFound/>
        },
        {
            path: "products/:slug",
            element: <ProductDetail/>
        }
    ]

    }
])
    


export default router
