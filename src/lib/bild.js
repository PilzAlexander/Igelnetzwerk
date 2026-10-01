// Foto verkleinern, damit es in den Browser-Speicher passt (~100–200 KB statt mehrerer MB)
export function verkleinereFoto(datei, maxKante = 1000, qualitaet = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(datei);
    const img = new Image();
    img.onload = () => {
      const faktor = Math.min(1, maxKante / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * faktor);
      canvas.height = Math.round(img.height * faktor);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', qualitaet));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Foto konnte nicht gelesen werden'));
    };
    img.src = url;
  });
}
