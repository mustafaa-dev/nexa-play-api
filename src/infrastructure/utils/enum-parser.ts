export function getAllEnumValues<T>(enumType: T) {
  return Object.values(enumType).join(', ');
}
