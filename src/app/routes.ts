export const ROUTES = {
  home: '/',
  about: '/about',
  services: '/services',
  track: '/track',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
} as const

export const trackRoute = (trackingNumber: string) => `/track/${encodeURIComponent(trackingNumber)}`