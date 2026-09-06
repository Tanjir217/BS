import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import {
  deleteProductImage,
  getProductImages,
  reorderProductImage,
  setPrimaryProductImage,
  uploadProductImage,
} from "../../../services/productImageServices";

function ProductImageManager({
  productId,
  onImagesChange,
  onPendingFilesChange,
}) {
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function loadImages() {
    if (!productId) return;

    try {
      setIsLoading(true);

      const data = await getProductImages(productId);

      setImages(data);
      onImagesChange?.(data);
    } catch (error) {
      console.error("Failed to load product images:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, [productId]);

  function handleFileSelect(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    const newFiles = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPendingFiles((current) => {
      const updated = [...current, ...newFiles];

      onPendingFilesChange?.(updated);

      return updated;
    });

    event.target.value = "";
  }

  function removePendingFile(index) {
    setPendingFiles((current) => {
      const file = current[index];

      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }

      const updated = current.filter((_, fileIndex) => fileIndex !== index);

      onPendingFilesChange?.(updated);

      return updated;
    });
  }

  async function handleUploadPendingFiles() {
    if (!productId || pendingFiles.length === 0) return;

    try {
      setIsUploading(true);

      const currentImages = await getProductImages(productId);

      const startingSortOrder = currentImages.length;

      for (let index = 0; index < pendingFiles.length; index++) {
        const item = pendingFiles[index];

        await uploadProductImage({
          productId,
          file: item.file,
          alt: item.file.name,
          sortOrder: startingSortOrder + index,
          isPrimary: currentImages.length === 0 && index === 0,
        });
      }

      pendingFiles.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });

      setPendingFiles([]);
      onPendingFilesChange?.([]);

      await loadImages();
    } catch (error) {
      console.error("Failed to upload product images:", error);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(image) {
    const confirmed = window.confirm("Delete this product image?");

    if (!confirmed) return;

    try {
      await deleteProductImage(image.id, image.fileID);

      await loadImages();
    } catch (error) {
      console.error("Failed to delete product image:", error);
    }
  }

  async function handleSetPrimary(image) {
    try {
      const updatedImages = await setPrimaryProductImage(productId, image.id);

      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    } catch (error) {
      console.error("Failed to set primary image:", error);
    }
  }
  async function handleReorder(image, direction) {
    try {
      const updatedImages = await reorderProductImage(
        productId,
        image.id,
        direction,
      );

      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    } catch (error) {
      console.error("Failed to reorder product image:", error);
    }
  }
  if (!productId) {
    return (
      <section className="mt-8 border-t border-black/8 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Product Images</h3>

          <p className="mt-1 text-xs text-black/40">
            Save the product first, then you can upload images.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 border-t border-black/8 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Product Images</h3>

          <p className="mt-1 text-xs text-black/40">
            Add product photos and choose a primary image.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium transition hover:bg-black/5"
        >
          <ImagePlus size={16} />
          Add Images
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-black/8 p-8 text-center text-sm text-black/40">
          Loading images...
        </div>
      ) : (
        <>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group overflow-hidden rounded-2xl border border-black/8 bg-white"
                >
                  <div className="relative aspect-square overflow-hidden bg-black/5">
                    <img
                      src={image.url}
                      alt={image.alt || "Product image"}
                      className="h-full w-full object-cover"
                    />

                    {image.isPrimary && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium shadow-sm">
                        <Star size={12} fill="currentColor" />
                        Primary
                      </span>
                    )}

                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      {images.indexOf(image) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleReorder(image, "up")}
                          className="rounded-lg bg-white p-2 shadow-sm"
                          title="Move image up"
                        >
                          <ChevronUp size={15} />
                        </button>
                      )}

                      {images.indexOf(image) < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleReorder(image, "down")}
                          className="rounded-lg bg-white p-2 shadow-sm"
                          title="Move image down"
                        >
                          <ChevronDown size={15} />
                        </button>
                      )}

                      {!image.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(image)}
                          className="rounded-lg bg-white p-2 shadow-sm"
                          title="Set as primary"
                        >
                          <Star size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        className="rounded-lg bg-white p-2 text-red-600 shadow-sm"
                        title="Delete image"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="px-3 py-2">
                    <p className="truncate text-xs text-black/45">
                      {image.alt || "No alt text"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium">Ready to upload</h4>

                <button
                  type="button"
                  onClick={handleUploadPendingFiles}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={15} />

                  {isUploading ? "Uploading..." : "Upload Images"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {pendingFiles.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="relative overflow-hidden rounded-2xl border border-dashed border-black/15"
                  >
                    <div className="aspect-square">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removePendingFile(index)}
                      className="absolute right-2 top-2 rounded-lg bg-white p-2 text-red-600 shadow-sm"
                      title="Remove from upload queue"
                    >
                      <Trash2 size={15} />
                    </button>

                    <p className="truncate px-3 py-2 text-xs text-black/45">
                      {item.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length === 0 && pendingFiles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-black/10 px-6 py-12 text-center">
              <ImagePlus size={28} className="mx-auto text-black/25" />

              <p className="mt-3 text-sm font-medium">No product images</p>

              <p className="mt-1 text-xs text-black/40">
                Add one or more images for this product.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ProductImageManager;
