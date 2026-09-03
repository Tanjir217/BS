import { useState } from "react";

function ProductGallery({ images = [], productName }) {
  const [activeImage, setActiveImage] = useState(0);

  if (!images.length) {
    return <p>No images available.</p>;
  }

  const currentImage = images[activeImage];

  return (
    <section className="product-gallery">

      {/* Main image */}
      <div className="product-gallery__main">
        <img
          src={currentImage.url}
          alt={
            currentImage.alt ||
            `${productName}, view ${activeImage + 1}`
          }
        />
      </div>

      {/* Thumbnails */}
      <div className="product-gallery__thumbnails">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={
              activeImage === index ? "is-active" : ""
            }
            onClick={() => setActiveImage(index)}
          >
            <img
              src={image.url}
              alt={image.alt || `${productName}, view ${index + 1}`}
            />
          </button>
        ))}
      </div>

    </section>
  );
}

export default ProductGallery;
