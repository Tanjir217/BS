import { useState } from "react";

function ProductGallery({ images = [], productName }) {

    const [activeImage, setActiveImage] = useState(0);

    if (!images.length) {
        return (
            <section
                className="product-gallery"
                aria-label={`${productName} images`}
            >
                <p>No images available.</p>
            </section>
        );
    }

    return (
        <section
            className="product-gallery"
            aria-label={`${productName} images`}
        >

            {images.map((image, index) => (

                <button
                    className={`product-gallery__image ${
                        activeImage === index ? "is-active" : ""
                    }`}
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View ${productName}, image ${index + 1}`}
                >

                    <img
                        src={image.url}
                        alt={image.alt || `${productName}, view ${index + 1}`}
                    />

                </button>

            ))}

        </section>
    );
}

export default ProductGallery;
