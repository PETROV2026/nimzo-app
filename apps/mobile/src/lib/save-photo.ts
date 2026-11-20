import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

const maxSide = 1600;
const maxBytes = 1024 * 1024;

export async function savePhoto({ uri, width, height }: ImagePickerAsset, folderName: string) {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > maxSide) {
    context.resize(
      width >= height ? { width: maxSide, height: null } : { width: null, height: maxSide },
    );
  }
  const image = await context.renderAsync().finally(() => context.release());
  const saved = await image
    .saveAsync({ format: SaveFormat.JPEG, compress: 0.7 })
    .finally(() => image.release());
  const file = new File(saved.uri);
  if (file.size > maxBytes) {
    file.delete();
    throw new Error('Photo is larger than 1 MB');
  }
  const folder = new Directory(Paths.document, folderName);
  folder.create({ idempotent: true });
  file.moveSync(folder);
  return file.uri;
}

export function deletePhoto(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    return;
  }
}
