export const managerRoutes = {
  dashboard: '/app/manager',
  parcels: '/app/manager/parcels',
  parcel: (id: string) => `/app/manager/parcels/${id}`,
  assign: '/app/manager/assign',
  personnel: '/app/manager/personnel',
  complaints: '/app/manager/complaints',
  reports: '/app/manager/reports',
}
