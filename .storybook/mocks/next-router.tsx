// Comprehensive mock for Next.js router
const mockRouter = {
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
  refresh: () => Promise.resolve(),
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  isReady: true,
  basePath: '',
  events: {
    on: () => {},
    off: () => {},
    emit: () => {}
  },
  isLocaleDomain: false,
  isPreview: false
}

// Export for next/router
export const useRouter = () => mockRouter

// Export for next/navigation
export const usePathname = () => '/'
export const useSearchParams = () => new URLSearchParams()
export const useParams = () => ({})

// Also export as default for compatibility
export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams
}
