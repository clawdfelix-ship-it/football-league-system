import { usePathname } from 'next/navigation';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MobileTabBar, { isTabActive, subscribeToHashChanges } from './MobileTabBar';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));
vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }));

afterEach(() => vi.clearAllMocks());

describe('MobileTabBar', () => {
  it('marks only Table active for the standings hash', () => {
    expect(isTabActive('/', '/', '#standings')).toBe(false);
    expect(isTabActive('/#standings', '/', '#standings')).toBe(true);
    expect(isTabActive('/#standings', '/fixtures', '#standings')).toBe(false);
  });

  it('renders only Home as the current page before client hash synchronization', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    const html = renderToStaticMarkup(<MobileTabBar />);

    expect(html).toMatch(/<a[^>]*href="\/"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/<a[^>]*href="\/#standings"[^>]*aria-current="page"/);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it('listens for hashchange and removes its listener on cleanup', () => {
    vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const listeners = new Set<() => void>();
    const add = vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      if (type === 'hashchange') listeners.add(listener as () => void);
    });
    const remove = vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener) => {
      if (type === 'hashchange') listeners.delete(listener as () => void);
    });

    const sync = vi.fn();
    const cleanup = subscribeToHashChanges(sync);
    expect(add).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(listeners.size).toBe(1);
    for (const listener of listeners) listener();
    expect(sync).toHaveBeenCalledTimes(2);
    cleanup();
    expect(remove).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(listeners.size).toBe(0);
  });
});
