// Mock Next.js router before any imports
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

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => mockRouter
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}))
