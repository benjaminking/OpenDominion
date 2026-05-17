export function convertToFileName(name: string): string {
  return name.toLowerCase().replaceAll("'", '').replaceAll(/\W+/g, '_');
}
