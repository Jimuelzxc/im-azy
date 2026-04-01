Goals: User asking about the video ai start summarizing.


- Allow user to use any llm provier that openai-compatible eg. openrouter etc.
- First in settings panel ui heres the ui `references/settings-panel-ui.html`, user should input an api key, model name and url and click save, once is done.
I'll examine the repository to understand how the app fetches transcripts.Let me search for the transcript fetching logic in the code:# How to get a transcript.

## Step 1: Check if transcript is already visible
The app looks at the webpage to see if the transcript is already open. It searches for transcript segment elements on the page.

## Step 2: Try to automatically open the transcript
If the transcript is not visible, the app tries to find and click the transcript button. It looks for a button that has "transcript" in its label.

## Step 3: Alternative method - Use the menu
If the transcript button isn't found, the app tries a different approach:
1. It clicks the "More actions" button (three-dot menu) below the video
2. It waits a moment for the menu to appear
3. It looks for the transcript option in the menu and clicks it

## Step 4: Extract the transcript text
Once the transcript is open, the app reads all the transcript text segments from the page and combines them into one long piece of text. It does this by finding all the segment elements and taking the text from each one.

## Step 5: Show result to user
- If the transcript loads successfully, the app shows a greeting message and is ready to answer questions about the video
- If the transcript cannot be opened automatically, the app shows the user instructions to manually open it by clicking the menu and selecting "Show transcript"# 
- user now can ask question about the video/transcript and ai will answer.

# how to get a transcript?
I'll examine the repository to understand how the app fetches transcripts.Let me search for the transcript fetching logic in the code:# How to get a transcript.

## Step 1: Check if transcript is already visible
The app looks at the webpage to see if the transcript is already open. It searches
userquestion/chat="Summarize this video"
messages=[
        {"role": "system", "content": "${transcript} user is asking question about this video/transcript just answer user also include timestamp."},
        {"role": "user",   "content": "${userquestion/chat} for transcript segment elements on the page.

## Step 2: Try to automatically open the transcript
If the transcript is not visible, the app tries to find and click the transcript button. It looks for a button that has "transcript" in its label.

## Step 3: Alternative method - Use the menu
If the transcript button isn't found, the app tries a different approach:
1. It clicks the "More actions" button (three-dot menu) below the video
2. It waits a moment for the menu to appear
3. It looks for the transcript option in the menu and clicks it

## Step 4: Extract the transcript text
Once the transcript is open, the app reads all the transcript text segments from the page and combines them into one long piece of text. It does this by finding all the segment elements and taking the text from each one.

## Step 5: Show result to user
- If the transcript loads successfully, the app shows a greeting message and is ready to answer questions about the video
- If the transcript cannot be opened automatically, the app shows the user instructions to manually open it by clicking the menu and selecting "Show transcript"




how to backend works.

```
transcript="this is transcript"
userquestion/chat="Summarize this video"
messages=[
        {"role": "system", "content": "${transcript} user is asking question about this video/transcript just answer user also include timestamp."},
        {"role": "user",   "content": "${userquestion/chat}"}
],
```



after getting a response. display it to chat panel.
