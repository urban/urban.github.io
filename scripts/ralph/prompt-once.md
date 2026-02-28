1. Find the highest-priority task to work on and work only on that task.
   This should be the one YOU decide has the highest priority - not necessarily the first in the list.
2. Check that the types check via `bun run typecheck` and that the tests pass via `bun run test`.
3. Update the GitHub PRD issue with the work that was done.
4. Append your progress to the progress.txt file.
   Use this to leave a note for the next person working in the codebase.
5. Do not run git commit commands yourself. Instead, print a `USER ACTION REQUIRED` section with:
   - the exact `git add ...` command for only the files you changed
   - the exact `git commit -m "..."` command with a concise commit message
   - the exact `git push` command (or say `no push needed` if push is not part of this workflow)

ONLY WORK ON A SINGLE TASK.
If, while implementing the task, you notice the PRD is complete, output <promise>COMPLETE</promise>.
