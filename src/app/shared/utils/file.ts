export const videoExtensions: string[] = ['mp4', 'mkv', 'mov', 'avi'];

export function requiredFileTypes({ name }: File, types: string[]) {
  const regexResult = /\.(?<extension>[a-zA-Z\d]+)$/.exec(name);

  if (regexResult) {
    const extension = regexResult[1].toLowerCase();
    return types.some(type => type.toLowerCase() === extension);
  }

  return false;
}
