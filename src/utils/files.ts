const IMAGE_EXTENSIONS = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP']

/** 'JPG' → true — usado para decidir se um anexo mostra preview de imagem ou ícone genérico. */
export function isImageFile(type: string) {
  return IMAGE_EXTENSIONS.includes(type.toUpperCase())
}
