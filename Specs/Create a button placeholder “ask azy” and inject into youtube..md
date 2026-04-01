**Feature:** Add an "Ask Azy" button on YouTube, placed next to the Share button.

---

**Button UI**

The button UI is already built. Use `references/button-ask-azy-ui.html` as the reference. Do not change the code.

---

**What happens when the user clicks "Ask Azy"**

The button triggers three things automatically, in order:

1. Click the "Expand bio" button
2. Click the "Show Transcript" button
3. Show the Chat panel

> Opening the transcript is important — it will be used to fetch the transcript content later.

---

**Code: Auto-open transcript**

```js
async function openTranscript() {
  const moreBtn = document.querySelector('#description-inline-expander #expand');

  if (moreBtn) {
    moreBtn.click();
    // Wait 500ms for YouTube to render the expanded content
    await new Promise(r => setTimeout(r, 500));
  }

  const transcriptBtn = document.querySelector('button[aria-label="Show transcript"]');
  if (transcriptBtn) {
    transcriptBtn.click();
    console.log("Transcript opened!");
  }
}

openTranscript();
```