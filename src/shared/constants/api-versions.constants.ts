export const APIVersions = {
  Admin: (route: string, version: string = '1') => ({
    path: `admin/${route}`,
    version,
  }),
  User: (route: string, version: string = '1') => ({
    path: `user/${route}`,
    version,
  }),
  General: (route: string, version: string = '1') => ({
    path: route,
    version,
  }),
};
