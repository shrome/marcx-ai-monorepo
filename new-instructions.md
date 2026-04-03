Great, thanks for ui changes and integrations, now I need to discuss with you on the flows and latest changes.

Let's not do the integration for the chat and documents page first. May be can do for the documents page listing but not the upload (or you can hide it first.)

What I wanna focus now is the ledger flow, if you study at the latest UI, you will notice that there's a new '+' button at the sidebar, user can just click that to create new ledger, as below the `ledger` title in sidebar would have bunch of ledgers created.

The flow of gl/ledger creation:
1. User click '+' button
2. A modal/dialog/pop up appear
3. Asking user to fill ledger title, description(if we have it, kinda forgotten on that), fiscal year, and upload files(last year gl, bank statements and related docs.)
4. After fill up all those fields, and user click the 'Create' button
5. Once button clicked, it will call an api to create ledger and call ai-apis. For the ai-apis first, it will call /api/gl/initialise api, then it will call /api/gl/upload to upload all related files.
6. Once all success, means gls successfully created and will redirect user to the latest gls created.

The flow of gl/ledger interaction or updates:
1. User will chat with the chat sidebar or top chat interface when interacting with the ui.
2. When user start chatting, if no existing chatting session, it will start to create one (this also need to refer to the ai-doc and mine, for session let's use ai one for now). (NOTE: for the session, let's make it to have a window session basis or current browser session, if they close current or all tabs and re-open then the session will gone.)
3. Next, when user is chatting, to post message will be using POST /api/chat/sessions/{session_id}/messages (ai-api, for text only).
4. If user have file uploads then will be /api/ocr/presign
5. If have both chatting and file upload then will be both together, the message api don't have file upload. Which is why front end wouldn't directly interaqct with ai-api, and have a backend proxy instead.

