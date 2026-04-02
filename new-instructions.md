Hey I think there are some things still need to be done correctly, sorry for not providing context correctly. Things need to add or change or clarify for better context:
1. Add invitation feature in term of schema, backend apis and integrate it to frontend. (Might need to break it into several phases)
2. For the context, in our schema session is = to the ai general-ledger, so all the interaction like chat or docs in one session is actually = interaction in gl, can think of it like gl session (might need to update in the instruction and potential implementation  files, since this is quite important).
3. For 2nd context, if you inspect the ledger page, you will see there’s a task tab, that tab is for user to the status and result that was processed by the ai
    1. When just click into the task it will just list out all the documents uploaded in that session, and displaying all the status
    2. If user clicked one of it, a pop up will appear and show the file uploaded, and the processed fields
    3. Then user can review the file and the extracted and processed fields, once all done reviewed and corrected, they will click a Verified/Approved button then it will save it to db, else all the changes made would also be save but only as a draft, not yet the final approval til the button clicked
4. So as you understand the context now, when user click the Ledger page, it will queries existing session first, if no sessions, just show session/gl not found. And ask them to create one in the chat page.
5. Might need to modify the backend to cater to this new info, make sure write test and make sure the test pass too for the backend.
6. FYI, the documents page, is the place that show all the documents regardless of the sessions
7. Lastly, make sure that the ledger/[id] page is use and not just ledger/page.tsx, the id of the ledger is the session id.
