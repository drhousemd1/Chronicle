// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  FetchGalleryParams,
  PublishedScenario,
  SortOption,
} from "@/services/gallery-data";
import type { CategoryFilters } from "./GalleryCategorySidebar";
import { GalleryHub } from "./GalleryHub";

const galleryMocks = vi.hoisted(() => ({
  fetchGalleryScenarios: vi.fn(),
  getUserInteractions: vi.fn(),
  incrementPlayCount: vi.fn(),
  recordView: vi.fn(),
  saveScenarioToCollection: vi.fn(),
  toggleLike: vi.fn(),
  unpublishScenario: vi.fn(),
  unsaveScenario: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/services/gallery-data", () => ({
  fetchGalleryScenarios: galleryMocks.fetchGalleryScenarios,
  getUserInteractions: galleryMocks.getUserInteractions,
  incrementPlayCount: galleryMocks.incrementPlayCount,
  recordView: galleryMocks.recordView,
  saveScenarioToCollection: galleryMocks.saveScenarioToCollection,
  toggleLike: galleryMocks.toggleLike,
  unpublishScenario: galleryMocks.unpublishScenario,
  unsaveScenario: galleryMocks.unsaveScenario,
}));

vi.mock("./GalleryStoryCard", () => ({
  GalleryScenarioCard: ({ published }: { published: PublishedScenario }) => (
    <article data-testid="gallery-scenario" data-scenario-id={published.id}>
      {published.scenario?.title ?? published.id}
    </article>
  ),
}));

vi.mock("./StoryDetailModal", () => ({
  ScenarioDetailModal: () => null,
}));

vi.mock("./GalleryCategorySidebar", () => ({
  GalleryCategorySidebar: ({
    isOpen,
    onFilterChange,
    selectedFilters,
  }: {
    isOpen: boolean;
    onFilterChange: (filters: CategoryFilters) => void;
    selectedFilters: CategoryFilters;
  }) =>
    isOpen ? (
      <button
        type="button"
        aria-pressed={selectedFilters.genres.includes("Romance")}
        onClick={() =>
          onFilterChange({
            ...selectedFilters,
            genres: ["Romance"],
          })
        }
      >
        Select Romance genre
      </button>
    ) : null,
}));

class ControlledIntersectionObserver implements IntersectionObserver {
  static instances: ControlledIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds = [0];
  private readonly callback: IntersectionObserverCallback;
  private readonly observed = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "0px";
    ControlledIntersectionObserver.instances.push(this);
  }

  disconnect() {
    this.observed.clear();
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  get isActive() {
    return this.observed.size > 0;
  }

  trigger(isIntersecting = true) {
    const target = this.observed.values().next().value as Element | undefined;
    if (!target) return;
    this.callback(
      [
        {
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: target.getBoundingClientRect(),
          isIntersecting,
          rootBounds: null,
          target,
          time: performance.now(),
        },
      ],
      this,
    );
  }
}

function makeScenario(index: number): PublishedScenario {
  return {
    id: `published-${index}`,
    scenario_id: `scenario-${index}`,
    scenario: {
      title: `Story ${index}`,
    },
    contentThemes: {
      storyType: "SFW",
    },
  } as PublishedScenario;
}

function renderGallery(sortBy: SortOption = "all") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const rendered = render(
    <GalleryHub
      onPlay={() => undefined}
      sortBy={sortBy}
      onSortChange={() => undefined}
    />,
    { wrapper: Wrapper },
  );

  return { ...rendered, queryClient };
}

function activeIntersectionObserver() {
  return [...ControlledIntersectionObserver.instances]
    .reverse()
    .find((observer) => observer.isActive);
}

function galleryCallsAtOffset(offset: number) {
  return galleryMocks.fetchGalleryScenarios.mock.calls
    .map(([params]) => params as FetchGalleryParams)
    .filter((params) => params.offset === offset);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("GalleryHub request failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ControlledIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", ControlledIntersectionObserver);
    galleryMocks.getUserInteractions.mockResolvedValue({
      likes: new Set<string>(),
      saves: new Set<string>(),
    });
  });

  afterEach(() => {
    cleanup();
    onlineManager.setOnline(true);
    vi.unstubAllGlobals();
  });

  it("keeps discovery controls available and distinguishes an initial failure from a legitimate empty Gallery", async () => {
    galleryMocks.fetchGalleryScenarios.mockRejectedValueOnce(
      new Error("initial Gallery request failed"),
    );
    const { queryClient } = renderGallery("recent");

    expect(
      screen.getByPlaceholderText("Search titles, descriptions, or #tags"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Browse Categories" }),
    ).toBeInTheDocument();

    const failure = await screen.findByRole("alert");
    expect(failure).toHaveTextContent(/couldn.t load the community gallery/i);
    expect(screen.queryByText("No stories found")).not.toBeInTheDocument();
    const failedRequest = structuredClone(galleryCallsAtOffset(0)[0]);
    expect(failedRequest).toEqual(
      expect.objectContaining({ offset: 0, sortBy: "recent" }),
    );

    galleryMocks.fetchGalleryScenarios.mockResolvedValueOnce([]);
    fireEvent.click(within(failure).getByRole("button", { name: /^retry$/i }));

    expect(await screen.findByText("No stories found")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(galleryCallsAtOffset(0)).toHaveLength(2);
    expect(galleryCallsAtOffset(0)[1]).toEqual(failedRequest);
    expect(screen.getByRole("status")).toHaveTextContent(
      /community gallery loaded/i,
    );
    queryClient.clear();
  });

  it("does not present an offline-paused initial request as an empty Gallery", async () => {
    onlineManager.setOnline(false);
    galleryMocks.fetchGalleryScenarios.mockResolvedValueOnce([]);
    const { queryClient } = renderGallery();

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /waiting for a connection/i,
      );
    });
    expect(screen.queryByText("No stories found")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search titles, descriptions, or #tags"),
    ).toBeInTheDocument();

    onlineManager.setOnline(true);
    expect(await screen.findByText("No stories found")).toBeInTheDocument();
    queryClient.clear();
  });

  it("keeps loaded cards visible while a later-page request is paused offline", async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) =>
      makeScenario(index + 1),
    );
    galleryMocks.fetchGalleryScenarios
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([makeScenario(21)]);

    const { queryClient } = renderGallery();
    expect(await screen.findAllByTestId("gallery-scenario")).toHaveLength(20);

    onlineManager.setOnline(false);
    act(() => activeIntersectionObserver()?.trigger());

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /waiting for a connection to load more stories/i,
      );
    });
    expect(screen.getAllByTestId("gallery-scenario")).toHaveLength(20);
    expect(screen.queryByText("No stories found")).not.toBeInTheDocument();
    expect(screen.queryByText("You've reached the end")).not.toBeInTheDocument();

    onlineManager.setOnline(true);
    await waitFor(() => {
      expect(screen.getAllByTestId("gallery-scenario")).toHaveLength(21);
    });
    queryClient.clear();
  });

  it("preserves cards and query state after a later-page failure, blocks observer retries, and explicitly retries the same page", async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => makeScenario(index + 1));
    const recoveredPage = [makeScenario(21)];
    let nextPageAttempts = 0;

    galleryMocks.fetchGalleryScenarios.mockImplementation(
      async (params: FetchGalleryParams) => {
        if ((params.offset ?? 0) === 0) return firstPage;
        nextPageAttempts += 1;
        if (nextPageAttempts === 1) {
          throw new Error("later Gallery page failed");
        }
        return recoveredPage;
      },
    );

    const { queryClient } = renderGallery();
    expect(await screen.findAllByTestId("gallery-scenario")).toHaveLength(20);

    fireEvent.click(
      screen.getByRole("button", { name: "Browse Categories" }),
    );
    const romanceFilter = screen.getByRole("button", {
      name: "Select Romance genre",
    });
    fireEvent.click(romanceFilter);
    expect(romanceFilter).toHaveAttribute("aria-pressed", "true");

    const search = screen.getByPlaceholderText(
      "Search titles, descriptions, or #tags",
    );
    fireEvent.change(search, { target: { value: "moonlight #romance" } });

    await waitFor(() => {
      expect(galleryMocks.fetchGalleryScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
          searchText: "moonlight",
          searchTags: ["romance"],
          genres: ["Romance"],
          sortBy: "all",
        }),
      );
    });
    expect(await screen.findAllByTestId("gallery-scenario")).toHaveLength(20);

    const observer = activeIntersectionObserver();
    expect(observer).toBeDefined();
    act(() => observer?.trigger());

    await waitFor(() => expect(galleryCallsAtOffset(20)).toHaveLength(1));
    const failedRequest = structuredClone(galleryCallsAtOffset(20)[0]);
    expect(failedRequest).toEqual(
      expect.objectContaining({
        offset: 20,
        searchText: "moonlight",
        searchTags: ["romance"],
        genres: ["Romance"],
        sortBy: "all",
      }),
    );
    const paginationFailure = await screen.findByRole("alert");

    expect(paginationFailure).toHaveTextContent(/couldn.t load more stories/i);
    expect(screen.getAllByTestId("gallery-scenario")).toHaveLength(20);
    expect(search).toHaveValue("moonlight #romance");
    expect(screen.queryByText("You've reached the end")).not.toBeInTheDocument();

    act(() => activeIntersectionObserver()?.trigger());
    await act(async () => {
      await Promise.resolve();
    });
    expect(galleryCallsAtOffset(20)).toHaveLength(1);

    await act(async () => {
      await queryClient.refetchQueries({
        queryKey: ["gallery-scenarios"],
      });
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /couldn.t load more stories/i,
    );
    act(() => activeIntersectionObserver()?.trigger());
    await act(async () => {
      await Promise.resolve();
    });
    expect(galleryCallsAtOffset(20)).toHaveLength(1);

    fireEvent.click(
      within(paginationFailure).getByRole("button", { name: /^retry$/i }),
    );

    await waitFor(() => expect(galleryCallsAtOffset(20)).toHaveLength(2));
    expect(galleryCallsAtOffset(20)[1]).toEqual(failedRequest);
    expect(await screen.findAllByTestId("gallery-scenario")).toHaveLength(21);
    expect(screen.getByText("Story 21")).toBeInTheDocument();
    expect(search).toHaveValue("moonlight #romance");
    expect(romanceFilter).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/couldn.t load more stories/i)).not.toBeInTheDocument();
    expect(screen.getByText("You've reached the end")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /additional stories loaded/i,
    );
    queryClient.clear();
  });

  it("does not let an older retry clear the failure latch for a newer query", async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) =>
      makeScenario(index + 1),
    );
    const oldRetry = deferred<PublishedScenario[]>();
    let oldNextPageAttempts = 0;
    let newNextPageAttempts = 0;

    galleryMocks.fetchGalleryScenarios.mockImplementation(
      async (params: FetchGalleryParams) => {
        if ((params.offset ?? 0) === 0) return firstPage;
        if (params.searchText === "older-query") {
          oldNextPageAttempts += 1;
          if (oldNextPageAttempts === 1) {
            throw new Error("older query page failed");
          }
          return oldRetry.promise;
        }
        if (params.searchText === "newer-query") {
          newNextPageAttempts += 1;
          throw new Error("newer query page failed");
        }
        return firstPage;
      },
    );

    const { queryClient } = renderGallery();
    expect(await screen.findAllByTestId("gallery-scenario")).toHaveLength(20);
    const initialObserver = activeIntersectionObserver();
    expect(initialObserver).toBeDefined();
    const search = screen.getByPlaceholderText(
      "Search titles, descriptions, or #tags",
    );

    fireEvent.change(search, { target: { value: "older-query" } });
    await waitFor(() => {
      expect(galleryMocks.fetchGalleryScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, searchText: "older-query" }),
      );
    });
    let olderQueryObserver: ControlledIntersectionObserver | undefined;
    await waitFor(() => {
      olderQueryObserver = activeIntersectionObserver();
      expect(olderQueryObserver).toBeDefined();
      expect(olderQueryObserver).not.toBe(initialObserver);
    });
    act(() => olderQueryObserver?.trigger());
    const olderFailure = await screen.findByRole("alert");
    fireEvent.click(
      within(olderFailure).getByRole("button", { name: /^retry$/i }),
    );
    await waitFor(() => expect(oldNextPageAttempts).toBe(2));

    fireEvent.change(search, { target: { value: "newer-query" } });
    await waitFor(() => {
      expect(galleryMocks.fetchGalleryScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, searchText: "newer-query" }),
      );
    });
    let newerQueryObserver: ControlledIntersectionObserver | undefined;
    await waitFor(() => {
      newerQueryObserver = activeIntersectionObserver();
      expect(newerQueryObserver).toBeDefined();
      expect(newerQueryObserver).not.toBe(olderQueryObserver);
    });
    act(() => newerQueryObserver?.trigger());
    await waitFor(() => expect(newNextPageAttempts).toBe(1));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn.t load more stories/i,
    );

    await act(async () => {
      await queryClient.refetchQueries({
        queryKey: ["gallery-scenarios"],
      });
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /couldn.t load more stories/i,
    );

    await act(async () => {
      oldRetry.resolve([makeScenario(21)]);
      await oldRetry.promise;
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /couldn.t load more stories/i,
    );
    act(() => activeIntersectionObserver()?.trigger());
    await act(async () => {
      await Promise.resolve();
    });
    expect(newNextPageAttempts).toBe(1);
    queryClient.clear();
  });
});
