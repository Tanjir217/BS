import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ProductGallery({
  images = [],
  productName,
}) {
  const galleryRef =
    useRef(null);

  const [activeImage, setActiveImage] =
    useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [images]);

  if (!images.length) {
    return (
      <section className="product-gallery product-gallery--empty">
        <div>
          <span>No images available</span>
        </div>
      </section>
    );
  }

  function scrollToImage(index) {
    const gallery =
      galleryRef.current;

    if (!gallery) {
      return;
    }

    const target =
      gallery.children[index];

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveImage(index);
  }

  function handleGalleryScroll() {
    const gallery =
      galleryRef.current;

    if (!gallery) {
      return;
    }

    const children =
      Array.from(
        gallery.children,
      );

    const galleryCenter =
      gallery.scrollLeft +
      gallery.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance =
      Infinity;

    children.forEach(
      (child, index) => {
        const childCenter =
          child.offsetLeft +
          child.offsetWidth / 2;

        const distance =
          Math.abs(
            childCenter -
              galleryCenter,
          );

        if (
          distance <
          closestDistance
        ) {
          closestDistance =
            distance;
          closestIndex = index;
        }
      },
    );

    setActiveImage(
      closestIndex,
    );
  }

  function previousImage() {
    scrollToImage(
      Math.max(
        0,
        activeImage - 1,
      ),
    );
  }

  function nextImage() {
    scrollToImage(
      Math.min(
        images.length - 1,
        activeImage + 1,
      ),
    );
  }

  return (
    <section
      className="product-gallery"
      aria-label="Product images"
    >
      <div
        ref={galleryRef}
        className="product-gallery__track"
        onScroll={
          handleGalleryScroll
        }
      >
        {images.map(
          (image, index) => (
            <figure
              className="product-gallery__image"
              key={image.id}
            >
              <img
                src={image.url}
                alt={
                  image.alt ||
                  `${productName}, view ${
                    index + 1
                  }`
                }
                loading={
                  index === 0
                    ? "eager"
                    : "lazy"
                }
                decoding="async"
                draggable="false"
              />

              <span className="product-gallery__index">
                {String(
                  index + 1,
                ).padStart(2, "0")}
              </span>
            </figure>
          ),
        )}
      </div>

      {images.length > 1 && (
        <>
          <div className="product-gallery__desktop-controls">
            <button
              type="button"
              onClick={
                previousImage
              }
              disabled={
                activeImage === 0
              }
              aria-label="Previous image"
            >
              <ChevronLeft
                size={18}
                strokeWidth={1.4}
              />
            </button>

            <span>
              {String(
                activeImage + 1,
              ).padStart(2, "0")}
              {" / "}
              {String(
                images.length,
              ).padStart(2, "0")}
            </span>

            <button
              type="button"
              onClick={
                nextImage
              }
              disabled={
                activeImage ===
                images.length - 1
              }
              aria-label="Next image"
            >
              <ChevronRight
                size={18}
                strokeWidth={1.4}
              />
            </button>
          </div>

          <div className="product-gallery__mobile-progress">
            {images.map(
              (image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={
                    activeImage ===
                    index
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    scrollToImage(
                      index,
                    )
                  }
                  aria-label={`Go to image ${
                    index + 1
                  }`}
                  aria-current={
                    activeImage ===
                    index
                  }
                />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default ProductGallery;