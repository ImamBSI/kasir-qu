const OBJECT_STORAGE_PREFIX = "neon-s3:";
const PRODUCT_IMAGE_KEY_PATTERN =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

export function getObjectStorageImageKey(image: string | null | undefined) {
  if (!image?.startsWith(OBJECT_STORAGE_PREFIX)) return null;

  const key = image.slice(OBJECT_STORAGE_PREFIX.length);
  return PRODUCT_IMAGE_KEY_PATTERN.test(key) ? key : null;
}

export function createObjectStorageImageReference(key: string) {
  if (!PRODUCT_IMAGE_KEY_PATTERN.test(key)) {
    throw new Error("Kunci foto produk tidak valid.");
  }

  return `${OBJECT_STORAGE_PREFIX}${key}`;
}

export function getProductImageUrl(image: string | null | undefined) {
  if (!image) return "/images/placeholder.svg";

  const key = getObjectStorageImageKey(image);
  if (key) return `/api/images?key=${encodeURIComponent(key)}`;

  return image;
}
