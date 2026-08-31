import { useState } from "react";

function ProductGallery({ images, productName }) {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <section className="product-gallery" aria-label={`${productName} images`}>
      {images.map((image, index) => (
        <button
          className={`product-gallery__image ${activeImage === index ? "is-active" : ""}`}
          key={image}
          type="button"
          onClick={() => setActiveImage(index)}
          aria-label={`View ${productName}, image ${index + 1}`}
        >
          <img src={image} alt={`${productName}, view ${index + 1}`} />
        </button>
      ))}
    </section>
  );
}

export default ProductGallery;
