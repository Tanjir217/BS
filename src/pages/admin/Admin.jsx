import { useEffect } from "react";
import { getProducts } from "../../services/productServices";
function Admin() {
    useEffect(() => {
        async function testAppwrite() {
          try {
            const products = await getProducts();
    
            console.log("APPWRITE PRODUCTS:", products);
          } catch (error) {
            console.error("APPWRITE ERROR:", error);
          }
        }
    
        testAppwrite();
      }, []);
    function handleClick() {
        console.log("Button clicked!");
    }
    return (
        <>
        testing products
        </>
    )
}

export default Admin