const TRANSCRIPT_POLL_INTERVAL = 300;
const TRANSCRIPT_TIMEOUT = 5000;

function getVideoId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('v');
}

async function getTranscript() {
  const showBtn = document.querySelector('button[aria-label="Show transcript"]');
  if (!showBtn) return null;

  showBtn.click();

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const segments = document.querySelectorAll('transcript-segment-view-model');
      if (segments.length > 0) {
        clearInterval(interval);

        const transcript = Array.from(segments).map(seg => ({
          time: seg.querySelector('.ytwTranscriptSegmentViewModelTimestamp')?.innerText.trim(),
          text: seg.querySelector('.yt-core-attributed-string')?.innerText.trim(),
        }));

        const closeBtn = document.querySelector('button[aria-label="Close transcript"]');
        if (closeBtn) closeBtn.click();

        const formatted = transcript.map(s => `[${s.time}] ${s.text}`).join('\n');
        resolve(formatted);
      }
    }, TRANSCRIPT_POLL_INTERVAL);

    setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, TRANSCRIPT_TIMEOUT);
  });
}

async function getTranscriptForVideo() {
  const videoId = getVideoId();
  if (!videoId) return null;

  try {
    const cached = await browser.storage.local.get('azy_transcript_cache');
    const cache = cached.azy_transcript_cache || {};
    if (cache[videoId]) return cache[videoId];
  } catch (e) {
    console.error('Azy: failed to read transcript cache', e);
  }

  const transcript = await getTranscript();
  if (!transcript) return null;

  try {
    const cached = await browser.storage.local.get('azy_transcript_cache');
    const cache = cached.azy_transcript_cache || {};
    cache[videoId] = transcript;
    await browser.storage.local.set({ azy_transcript_cache: cache });
  } catch (e) {
    console.error('Azy: failed to write transcript cache', e);
  }

  return transcript;
}

async function clearTranscriptCache() {
  try {
    await browser.storage.local.set({ azy_transcript_cache: {} });
  } catch (e) {
    console.error('Azy: failed to clear transcript cache', e);
  }
}
