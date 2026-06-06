import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => {
  const eqMock = vi.fn();
  const updateMock = vi.fn((payload: any) => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ update: updateMock }));
  return { eqMock, fromMock, updateMock };
});

vi.mock('./shared', () => ({
  supabase: {
    from: supabaseMocks.fromMock,
  },
  toTimestamp: vi.fn((value) => value),
}));

describe('media settings persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.eqMock.mockResolvedValue({ error: null });
  });

  it('sanitizes story UI settings before writing the JSON settings field', async () => {
    const { updateStoryUiSettings } = await import('./media-settings');

    await updateStoryUiSettings('story-1', {
      showBackgrounds: false,
      transparentBubbles: true,
      darkMode: true,
      offsetBubbles: true,
      chatCanvasColor: '#112233',
      chatBubbleColor: '#445566',
      dynamicText: false,
      narrativePov: 'first',
      nsfwIntensity: 'high',
      realismMode: true,
      responseVerbosity: 'detailed',
      apiUsageTestTracking: true,
      proactiveCharacterDiscovery: true,
      proactiveNarrative: true,
      unknownSetting: 'ignored',
    });

    expect(supabaseMocks.fromMock).toHaveBeenCalledWith('stories');
    expect(supabaseMocks.updateMock).toHaveBeenCalledWith({
      ui_settings: {
        showBackgrounds: false,
        transparentBubbles: true,
        darkMode: true,
        offsetBubbles: true,
        chatCanvasColor: '#112233',
        chatBubbleColor: '#445566',
        dynamicText: false,
        narrativePov: 'first',
        nsfwIntensity: 'high',
        realismMode: true,
        responseVerbosity: 'detailed',
        apiUsageTestTracking: true,
      },
    });
    expect(supabaseMocks.eqMock).toHaveBeenCalledWith('id', 'story-1');
    const writtenSettings = supabaseMocks.updateMock.mock.calls[0][0].ui_settings;
    expect(writtenSettings).not.toHaveProperty('proactiveCharacterDiscovery');
    expect(writtenSettings).not.toHaveProperty('proactiveNarrative');
    expect(writtenSettings).not.toHaveProperty('unknownSetting');
  });

  it('throws when the settings write fails so callers can catch the background-save error', async () => {
    const { updateStoryUiSettings } = await import('./media-settings');
    const error = new Error('database unavailable');
    supabaseMocks.eqMock.mockResolvedValueOnce({ error });

    await expect(updateStoryUiSettings('story-1', {})).rejects.toThrow('database unavailable');
  });
});
