type Area = { width: number; height: number };

export function landscapeFrame({ width, height }: Area) {
  const rotated = height > width;
  if (!rotated) return { width, height, left: 0, top: 0, rotated };
  return {
    width: height,
    height: width,
    left: (width - height) / 2,
    top: (height - width) / 2,
    rotated,
  };
}
