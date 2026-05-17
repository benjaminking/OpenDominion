export function convertToFileName(name: string): string {
  return name.replace(/'/g, '').replace(/\W+/g, '_').toLowerCase();
}

export function convertToClassName(name: string): string {
  return name.replace(/'/g, '').replace(/\W+/g, '');
}
