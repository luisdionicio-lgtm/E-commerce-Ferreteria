import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, type ComponentProps } from 'react';

/** Compatibility helpers backed by Next.js, not a second client router. */
type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { to: string };
export function Link({ to, ...props }: LinkProps) {
  return <NextLink href={to} {...props} />;
}
export function NavLink({
  to,
  end = false,
  className = '',
  ...props
}: LinkProps & { end?: boolean }) {
  const router = useRouter();
  const pathname = router.asPath.split('?')[0];
  const active = end ? pathname === to : pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`${className} ${active ? 'active' : ''}`.trim()}
      aria-current={active ? 'page' : undefined}
      {...props}
    />
  );
}
export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    void (replace ? router.replace(to) : router.push(to));
  }, [router, to, replace]);
  return null;
}
export function useNavigate() {
  const router = useRouter();
  return useCallback((to: string) => router.push(to), [router]);
}
export function useParams() {
  return useRouter().query;
}
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const router = useRouter();
  const params = useMemo(
    () => new URLSearchParams(router.asPath.split('?')[1]?.split('#')[0] || ''),
    [router.asPath],
  );
  const setParams = useCallback(
    (next: URLSearchParams) => {
      void router.replace(
        { pathname: router.pathname, query: Object.fromEntries(next) },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );
  return [params, setParams];
}
