export const preloadImages = (images) => {
  return Promise.all(images.map(imageUrl => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(imageUrl);
      img.onerror = () => reject(imageUrl);
      img.src = imageUrl;
    });
  }));
}; 