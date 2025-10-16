export function SetPropertyName(name: string): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata('i18n:field_name', name, target, propertyKey);
  };
}
