// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  loadRndWorkspace: vi.fn(),
  saveRndMockup: vi.fn(),
}));

const repositoryMocks = vi.hoisted(() => ({
  loadRndRepositoryWorkspace: vi.fn(),
  saveRndMockupToRepository: vi.fn(),
}));

vi.mock("./rnd-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./rnd-storage")>();
  return {
    ...actual,
    loadRndWorkspace: storageMocks.loadRndWorkspace,
    saveRndMockup: storageMocks.saveRndMockup,
  };
});

vi.mock("./rnd-repository-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./rnd-repository-client")>();
  return {
    ...actual,
    loadRndRepositoryWorkspace: repositoryMocks.loadRndRepositoryWorkspace,
    saveRndMockupToRepository: repositoryMocks.saveRndMockupToRepository,
  };
});

import { ResearchDevelopmentTool } from "./ResearchDevelopmentTool";
import { createBlankRndMockup } from "./rnd-storage";

async function createBlankMockupFromHeaderRegistration(onRegisterAddMockup: ReturnType<typeof vi.fn>) {
  await waitFor(() =>
    expect(
      onRegisterAddMockup.mock.calls.some(([handler]) => typeof handler === "function"),
    ).toBe(true),
  );
  const addMockup = [...onRegisterAddMockup.mock.calls]
    .reverse()
    .map(([handler]) => handler)
    .find((handler) => typeof handler === "function") as () => Promise<void>;
  await act(addMockup);
}

describe("ResearchDevelopmentTool", () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageMocks.loadRndWorkspace.mockReset();
    storageMocks.saveRndMockup.mockReset();
    repositoryMocks.loadRndRepositoryWorkspace.mockReset();
    repositoryMocks.saveRndMockupToRepository.mockReset();
    storageMocks.loadRndWorkspace.mockResolvedValue({ mockups: [], assets: [] });
    storageMocks.saveRndMockup.mockResolvedValue(undefined);
    const registeredRecord = createBlankRndMockup("2026-08-10T06:23:28.258Z");
    registeredRecord.id = "7765bb8f-ef75-4b70-afd1-489a9c5bae6d";
    registeredRecord.displayTitle = "Sound Effects & Visual Overlays";
    registeredRecord.purpose = "Test the source-backed R&D preview.";
    const storyOpeningRecord = createBlankRndMockup("2026-08-22T08:19:25.255Z");
    storyOpeningRecord.id = "65007876-4e40-4713-92fd-fb017068fae1";
    storyOpeningRecord.displayTitle = "Story Opening Screen";
    storyOpeningRecord.purpose =
      "Prototype an optional story-opening scene before Chronicle chat begins.";
    const graphifyRecord = createBlankRndMockup("2026-08-29T19:58:36.000Z");
    graphifyRecord.id = "6f290eb9-a458-4dbf-bd2d-b12da34b2ac7";
    graphifyRecord.displayTitle = "Chronicle Repository & Database Map";
    repositoryMocks.loadRndRepositoryWorkspace.mockResolvedValue({
      mockups: [registeredRecord, storyOpeningRecord, graphifyRecord],
      assets: [],
    });
    repositoryMocks.saveRndMockupToRepository.mockResolvedValue({
      savedAt: "2026-08-10T09:00:00.000Z",
      repositoryPath: "docs/research-development/mockups/mockup-1/mockup.json",
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:rnd-reference"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("creates an editable notes workspace while keeping the coded area protected", async () => {
    const onRegisterAddMockup = vi.fn();
    const onRegisterRepositorySave = vi.fn();
    render(
      <ResearchDevelopmentTool
        onOpenStyleGuide={() => {}}
        onRegisterAddMockup={onRegisterAddMockup}
        onRegisterRepositorySave={onRegisterRepositorySave}
      />,
    );

    await screen.findByLabelText("Title");
    expect(screen.queryByRole("button", { name: /add new mock-up/i })).not.toBeInTheDocument();
    await createBlankMockupFromHeaderRegistration(onRegisterAddMockup);

    const title = await screen.findByLabelText("Title");
    expect(title).toHaveValue("Untitled Mock-up");
    expect(screen.queryByText("No coded mock-up attached yet")).not.toBeInTheDocument();
    const protectedPreview = screen.getByRole("region", { name: "Protected mock-up preview" });
    const componentDetails = screen.getByRole("button", { name: "Component Details" });
    expect(protectedPreview).toHaveClass("bg-[#1a1a1e]");
    expect(componentDetails).toHaveAttribute("aria-expanded", "false");
    const backgroundGroup = screen.getByRole("group", { name: "Preview background" });
    expect(backgroundGroup.querySelectorAll("button")).toHaveLength(4);
    const lightBackground = screen.getByRole("button", {
      name: "Use light gray preview background",
    });
    fireEvent.click(lightBackground);
    expect(lightBackground).toHaveAttribute("aria-pressed", "true");
    expect(protectedPreview).toHaveClass("bg-[#d4d4d8]");
    expect(screen.queryByRole("button", { name: "Copy stable mock-up ID" })).not.toBeInTheDocument();
    const documentText = screen.getByLabelText("Document text");
    expect(protectedPreview.compareDocumentPosition(documentText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(documentText).toHaveClass("bg-transparent");
    expect(screen.queryByRole("button", { name: /add image/i })).not.toBeInTheDocument();

    fireEvent.click(componentDetails);
    expect(componentDetails).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Mock-up ID")).toBeInTheDocument();
    expect(screen.getByText("No component details have been added yet.")).toBeInTheDocument();

    fireEvent.change(title, { target: { value: "Character Header Study" } });
    const purpose = screen.getByLabelText("Brief purpose");
    Object.defineProperty(purpose, "scrollHeight", { configurable: true, value: 96 });
    fireEvent.change(purpose, { target: { value: "Compare header hierarchy." } });
    fireEvent.input(purpose);
    expect(purpose).toHaveClass("overflow-hidden", "whitespace-pre-wrap", "break-words");
    expect(purpose).toHaveStyle({ height: "96px" });
    fireEvent.change(documentText, { target: { value: "Try a quieter secondary label." } });
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();

    await waitFor(() => expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(2));
    expect(storageMocks.saveRndMockup.mock.calls[1][0]).toMatchObject({
      displayTitle: "Character Header Study",
      purpose: "Compare header hierarchy.",
      notes: "Try a quieter secondary label.",
      previewBackground: "light",
      documentBlocks: [expect.objectContaining({ type: "text", text: "Try a quieter secondary label." })],
    });
    expect(screen.queryByText(/local recovery/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Temporary recovery copy")).not.toBeInTheDocument();
    expect(screen.getByText("Date created:")).toHaveClass("text-black");
    expect(screen.getByText("Last edited:")).toHaveClass("text-black");
    expect(screen.getByText("Purpose:")).toHaveClass("text-black");

    expect(screen.queryByRole("button", { name: "Save mock-up to repository" })).not.toBeInTheDocument();
    const repositorySave = [...onRegisterRepositorySave.mock.calls]
      .reverse()
      .map(([handler]) => handler)
      .find((handler) => typeof handler === "function") as () => Promise<void>;
    await act(repositorySave);
    await waitFor(() => expect(repositoryMocks.saveRndMockupToRepository).toHaveBeenCalledTimes(1));
    expect(repositoryMocks.saveRndMockupToRepository.mock.calls[0][0]).toMatchObject({
      displayTitle: "Character Header Study",
      purpose: "Compare header hierarchy.",
      notes: "Try a quieter secondary label.",
    });
    expect(screen.queryByText(/Saved to docs\/research-development\/mockups/)).not.toBeInTheDocument();
  });

  it("opens the existing canonical App Style Guide destination", async () => {
    const onOpenStyleGuide = vi.fn();
    render(<ResearchDevelopmentTool onOpenStyleGuide={onOpenStyleGuide} />);

    fireEvent.click(await screen.findByRole("button", { name: /app style guide/i }));
    await waitFor(() => expect(onOpenStyleGuide).toHaveBeenCalledTimes(1));
  });

  it("renders later experiments as separate protected sections on the same saved page", async () => {
    const { container } = render(<ResearchDevelopmentTool onOpenStyleGuide={() => {}} />);

    const primaryHeading = await screen.findByRole("heading", {
      name: "Sound Effects & Visual Overlays",
    });
    const secondaryHeading = screen.getByRole("heading", {
      name: "Chronicle Chat Effects Layer Test",
    });
    const secondaryPreview = screen.getByRole("region", {
      name: "Chronicle Chat Effects Layer Test protected mock-up preview",
    });
    expect(secondaryPreview).toContainElement(screen.getByTestId("coded-chat-shell"));
    expect(screen.getAllByRole("button", { name: "Component Details" })).toHaveLength(2);
    expect(
      primaryHeading.compareDocumentPosition(secondaryHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const shells = container.querySelectorAll("[data-rnd-mockup-id]");
    expect(shells).toHaveLength(2);
    expect([...shells].map((shell) => shell.getAttribute("data-rnd-mockup-id"))).toEqual([
      "7765bb8f-ef75-4b70-afd1-489a9c5bae6d",
      "7765bb8f-ef75-4b70-afd1-489a9c5bae6d",
    ]);
    const notes = screen.getByLabelText("Document text");
    expect(secondaryPreview.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the Story Opening prototype on its own saved R&D page", async () => {
    const { container } = render(<ResearchDevelopmentTool onOpenStyleGuide={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "Story Opening Screen" }));

    expect(await screen.findByTestId("story-opening-screen-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("coded-chat-shell")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sound Effects & Visual Overlays" }))
      .not.toBeInTheDocument();

    const shells = container.querySelectorAll("[data-rnd-mockup-id]");
    expect(shells).toHaveLength(1);
    expect(shells[0]).toHaveAttribute(
      "data-rnd-mockup-id",
      "65007876-4e40-4713-92fd-fb017068fae1",
    );
  });

  it("restores a repository-backed mock-up when browser-local storage is empty", async () => {
    const repositoryRecord = createBlankRndMockup("2026-08-10T08:00:00.000Z");
    repositoryRecord.displayTitle = "Recovered Repository Mock-up";
    repositoryRecord.documentBlocks[0] = {
      ...repositoryRecord.documentBlocks[0],
      type: "text",
      text: "Recovered after browser storage was cleared.",
    };
    repositoryRecord.notes = "Recovered after browser storage was cleared.";
    repositoryMocks.loadRndRepositoryWorkspace.mockResolvedValue({
      mockups: [repositoryRecord],
      assets: [],
    });

    render(<ResearchDevelopmentTool onOpenStyleGuide={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "Recovered Repository Mock-up" }));
    expect(await screen.findByLabelText("Title")).toHaveValue("Recovered Repository Mock-up");
    expect(screen.getByLabelText("Document text")).toHaveValue(
      "Recovered after browser storage was cleared.",
    );
  });

  it("preserves a trailing title space while recovery autosave runs", async () => {
    const onRegisterAddMockup = vi.fn();
    render(
      <ResearchDevelopmentTool
        onOpenStyleGuide={() => {}}
        onRegisterAddMockup={onRegisterAddMockup}
      />,
    );

    await createBlankMockupFromHeaderRegistration(onRegisterAddMockup);
    const title = await screen.findByLabelText("Title");
    storageMocks.saveRndMockup.mockClear();

    fireEvent.change(title, { target: { value: "Sound " } });

    await waitFor(() => expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(1));
    expect(storageMocks.saveRndMockup.mock.calls[0][0].displayTitle).toBe("Sound ");
    expect(title).toHaveValue("Sound ");
  });

  it("shows an inline retry state when repository saving fails and saves on the next click", async () => {
    repositoryMocks.saveRndMockupToRepository.mockRejectedValueOnce(
      new Error("The repository write failed."),
    );
    const onRegisterRepositorySave = vi.fn();
    const onRepositorySaveStateChange = vi.fn();
    const onRegisterAddMockup = vi.fn();
    render(
      <ResearchDevelopmentTool
        onOpenStyleGuide={() => {}}
        onRegisterAddMockup={onRegisterAddMockup}
        onRegisterRepositorySave={onRegisterRepositorySave}
        onRepositorySaveStateChange={onRepositorySaveStateChange}
      />,
    );

    await createBlankMockupFromHeaderRegistration(onRegisterAddMockup);
    await waitFor(() =>
      expect(
        onRegisterRepositorySave.mock.calls.some(([handler]) => typeof handler === "function"),
      ).toBe(true),
    );
    const repositorySave = [...onRegisterRepositorySave.mock.calls]
      .reverse()
      .map(([handler]) => handler)
      .find((handler) => typeof handler === "function") as () => Promise<void>;

    await act(repositorySave);
    expect(await screen.findByRole("alert")).toHaveTextContent("The repository write failed.");
    expect(onRepositorySaveStateChange).toHaveBeenCalledWith("error");

    await act(repositorySave);
    await waitFor(() => expect(repositoryMocks.saveRndMockupToRepository).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/Saved to docs\/research-development\/mockups/)).not.toBeInTheDocument();
  });

  it("registers a before-leave save guard for dirty workspace edits", async () => {
    const onRegisterBeforeLeave = vi.fn();
    const onRegisterAddMockup = vi.fn();
    render(
      <ResearchDevelopmentTool
        onOpenStyleGuide={() => {}}
        onRegisterAddMockup={onRegisterAddMockup}
        onRegisterBeforeLeave={onRegisterBeforeLeave}
      />,
    );

    await createBlankMockupFromHeaderRegistration(onRegisterAddMockup);
    const notes = await screen.findByLabelText("Document text");
    fireEvent.change(notes, { target: { value: "Save this before leaving." } });

    const beforeLeave = [...onRegisterBeforeLeave.mock.calls]
      .reverse()
      .map(([handler]) => handler)
      .find((handler) => typeof handler === "function") as () => Promise<boolean>;

    let canLeave = false;
    await act(async () => {
      canLeave = await beforeLeave();
    });
    expect(canLeave).toBe(true);
    await waitFor(() => expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(2));
    expect(storageMocks.saveRndMockup.mock.calls[1][0]).toMatchObject({
      notes: "Save this before leaving.",
    });
  });

  it("keeps text editable during autosave and preserves changes made while a save is in flight", async () => {
    let finishSave: (() => void) | undefined;
    storageMocks.saveRndMockup
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishSave = resolve; }));

    const onRegisterAddMockup = vi.fn();
    render(
      <ResearchDevelopmentTool
        onOpenStyleGuide={() => {}}
        onRegisterAddMockup={onRegisterAddMockup}
      />,
    );
    await createBlankMockupFromHeaderRegistration(onRegisterAddMockup);

    const title = await screen.findByLabelText("Title");
    fireEvent.change(title, { target: { value: "Saving study" } });

    expect(screen.queryByText(/local recovery/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Temporary recovery copy")).not.toBeInTheDocument();
    expect(title).toBeEnabled();
    expect(screen.getByLabelText("Document text")).toBeEnabled();
    expect(screen.queryByRole("button", { name: /add image/i })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Editable mock-up document" })).toHaveAttribute("aria-busy", "true"),
    );
    expect(screen.getByRole("button", { name: /app style guide/i })).toBeDisabled();
    fireEvent.change(title, { target: { value: "Saving study, revised" } });

    await act(async () => {
      finishSave?.();
    });
    await waitFor(() => expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(3));
    expect(storageMocks.saveRndMockup.mock.calls[2][0]).toMatchObject({
      displayTitle: "Saving study, revised",
    });
    expect(title).toHaveValue("Saving study, revised");
    expect(screen.queryByText(/local recovery/i)).not.toBeInTheDocument();
  });

  it("drains newest edits before allowing before-leave during autosave", async () => {
    const onRegisterBeforeLeave = vi.fn();
    render(<ResearchDevelopmentTool onOpenStyleGuide={() => {}} onRegisterBeforeLeave={onRegisterBeforeLeave} />);
    const title = await screen.findByLabelText("Title");
    let finishFirstSave: (() => void) | undefined;
    let finishLatestSave: (() => void) | undefined;
    storageMocks.saveRndMockup.mockClear();
    storageMocks.saveRndMockup
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishFirstSave = resolve; }))
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishLatestSave = resolve; }));

    fireEvent.change(title, { target: { value: "First snapshot" } });
    await waitFor(() => expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(1));
    fireEvent.change(title, { target: { value: "Newest snapshot" } });
    expect(title).toBeEnabled();
    const beforeLeave = onRegisterBeforeLeave.mock.calls.at(-1)?.[0] as () => Promise<boolean>;
    let leaveResult: boolean | undefined;
    const leaving = beforeLeave().then((result) => { leaveResult = result; });

    await act(async () => { finishFirstSave?.(); });
    expect(leaveResult).toBeUndefined();
    expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(2);
    expect(storageMocks.saveRndMockup.mock.calls[1][0]).toMatchObject({ displayTitle: "Newest snapshot" });
    await act(async () => { finishLatestSave?.(); await leaving; });
    expect(leaveResult).toBe(true);
  });

  it("blocks before-leave when the newest pending edit cannot be saved", async () => {
    const onRegisterBeforeLeave = vi.fn();
    render(<ResearchDevelopmentTool onOpenStyleGuide={() => {}} onRegisterBeforeLeave={onRegisterBeforeLeave} />);
    const title = await screen.findByLabelText("Title");
    let finishFirstSave: (() => void) | undefined;
    storageMocks.saveRndMockup.mockClear();
    storageMocks.saveRndMockup
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishFirstSave = resolve; }))
      .mockRejectedValueOnce(new Error("Latest write failed"));

    fireEvent.change(title, { target: { value: "First snapshot" } });
    await waitFor(() => expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(1));
    fireEvent.change(title, { target: { value: "Keep this unsaved edit" } });
    const beforeLeave = onRegisterBeforeLeave.mock.calls.at(-1)?.[0] as () => Promise<boolean>;
    let leaveResult: boolean | undefined;
    const leaving = beforeLeave().then((result) => { leaveResult = result; });

    await act(async () => { finishFirstSave?.(); await leaving; });
    expect(leaveResult).toBe(false);
    expect(title).toHaveValue("Keep this unsaved edit");
    expect(screen.getByRole("alert")).toHaveTextContent("Latest write failed");
  });

  it("drains newest edits before switching mockups", async () => {
    render(<ResearchDevelopmentTool onOpenStyleGuide={() => {}} />);
    const title = await screen.findByLabelText("Title");
    let finishFirstSave: (() => void) | undefined;
    let finishLatestSave: (() => void) | undefined;
    storageMocks.saveRndMockup.mockClear();
    storageMocks.saveRndMockup
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishFirstSave = resolve; }))
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishLatestSave = resolve; }));

    fireEvent.change(title, { target: { value: "First snapshot" } });
    fireEvent.click(screen.getByRole("button", { name: "Story Opening Screen" }));
    expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(1);
    fireEvent.change(title, { target: { value: "Newest snapshot" } });
    await act(async () => { finishFirstSave?.(); });
    expect(title).toHaveValue("Newest snapshot");
    expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(2);
    expect(storageMocks.saveRndMockup.mock.calls[1][0]).toMatchObject({ displayTitle: "Newest snapshot" });
    await act(async () => { finishLatestSave?.(); });
    expect(title).toHaveValue("Story Opening Screen");
  });

  it("inserts a desktop image beneath targeted text and lets the image move in the document flow", async () => {
    const onRegisterRepositorySave = vi.fn();
    const onRegisterAddMockup = vi.fn();
    render(
      <ResearchDevelopmentTool
        onOpenStyleGuide={() => {}}
        onRegisterAddMockup={onRegisterAddMockup}
        onRegisterRepositorySave={onRegisterRepositorySave}
      />,
    );

    await createBlankMockupFromHeaderRegistration(onRegisterAddMockup);
    const firstTextBlock = (await screen.findByLabelText("Document text")) as HTMLTextAreaElement;
    fireEvent.change(firstTextBlock, { target: { value: "Text above the image." } });
    firstTextBlock.setSelectionRange(firstTextBlock.value.length, firstTextBlock.value.length);
    fireEvent.keyDown(firstTextBlock, { key: "Enter" });
    expect(screen.getAllByLabelText("Document text")).toHaveLength(2);

    const image = new File(["reference"], "layout-reference.png", { type: "image/png" });
    fireEvent.drop(firstTextBlock, {
      dataTransfer: { files: [image] },
    });
    const renderedImage = await screen.findByAltText("layout-reference.png");
    const imageBlock = renderedImage.closest("figure");
    expect(imageBlock).not.toBeNull();

    const dragValues = new Map<string, string>();
    const dataTransfer = {
      files: [],
      types: ["application/x-chronicle-rnd-block-id"],
      effectAllowed: "none",
      dropEffect: "none",
      setData: (type: string, value: string) => dragValues.set(type, value),
      getData: (type: string) => dragValues.get(type) ?? "",
    };
    fireEvent.dragStart(imageBlock!, { dataTransfer });
    fireEvent.drop(screen.getAllByLabelText("Document text")[1], { dataTransfer });

    await waitFor(() => expect(storageMocks.saveRndMockup).toHaveBeenCalledTimes(2));
    expect(storageMocks.saveRndMockup.mock.calls[1][1]).toHaveLength(1);
    expect(
      storageMocks.saveRndMockup.mock.calls[1][0].documentBlocks.map(
        (block: { type: string }) => block.type,
      ),
    ).toEqual(["text", "text", "image", "text"]);

    const repositorySave = [...onRegisterRepositorySave.mock.calls]
      .reverse()
      .map(([handler]) => handler)
      .find((handler) => typeof handler === "function") as () => Promise<void>;
    await act(repositorySave);
    await waitFor(() => expect(repositoryMocks.saveRndMockupToRepository).toHaveBeenCalledTimes(1));
    expect(repositoryMocks.saveRndMockupToRepository.mock.calls[0][1]).toHaveLength(1);
  });

  it("rejects SVG files without changing the document", async () => {
    const onRegisterAddMockup = vi.fn();
    render(
      <ResearchDevelopmentTool
        onOpenStyleGuide={() => {}}
        onRegisterAddMockup={onRegisterAddMockup}
      />,
    );

    await createBlankMockupFromHeaderRegistration(onRegisterAddMockup);
    await screen.findByLabelText("Document text");

    fireEvent.drop(screen.getByRole("region", { name: "Editable mock-up document" }), {
      dataTransfer: { files: [new File(["<svg />"], "unsafe.svg", { type: "image/svg+xml" })] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/JPEG, PNG, or WebP/);
    expect(screen.getByLabelText("Document text")).toBeInTheDocument();
  });
});
