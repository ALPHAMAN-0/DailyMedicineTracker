Set up project docs. Exact order, no deviation.

VAULT = the root of the currently open repository. Do not ask for a path.
Every generated file is written inside it:
- ARCHITECTURE.md  -> <repo-root>/ARCHITECTURE.md
- CLAUDE.md        -> <repo-root>/CLAUDE.md
- component notes  -> <repo-root>/docs/components/<Name>.md
Create docs/components/ if missing. Overwrite files of the same name in place.
No -v2, -new, or dated variants. Never write outside the repo root.

## 1. READ — only these
- manifest: package.json | go.mod | pyproject.toml | Cargo.toml
- tree -L 3 -I 'node_modules|vendor|dist|build|.git'
  if tree is missing:
  find . -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*'
- entry points declared in the manifest, max 3 files
- the import/require block at the top of those entry files only —
  stop reading at the first non-import statement
- README, if present
No implementation bodies. No grep. No file-by-file exploration.

## 2. ARCHITECTURE.md — repo root, <=120 lines
Frontmatter: tags: [architecture, <repo-name>]
1. Stack — languages, frameworks, key libs. <=5 lines.
2. Directory map — table `path | what lives there`. 2 levels.
3. Diagram — Mermaid flowchart TD, <=12 nodes, component boundaries only.
   Node label = component note filename without the .md. Exact match.
4. Component index — one [[Wikilink]] per diagram node.
5. Entry points — dev and prod, with paths.
6. Conventions — naming, file placement, error handling. Observed only.
7. Where things go — "to add a new X, touch these files." 3-5 tasks.

## 3. Component notes — one per diagram node, docs/components/, <=6 lines each
Filename = diagram node label + .md
Frontmatter: tags: [component, <repo-name>]
- Path: <dir or file>
- Role: <one line>
- Talks to: [[A]], [[B]]   # mirror the diagram edges exactly; edges come from
                           # the import blocks read in step 1, nothing else
- Back: [[ARCHITECTURE]]
Obsidian resolves [[links]] by filename across folders, so the graph renders
from docs/components/. The Mermaid block is not graphed.

## 4. CLAUDE.md — repo root, <=40 lines
- build, test, lint commands as exact strings
- rules you'd otherwise break (e.g. "pnpm not npm", "never edit /generated")
- 3 files worth reading first, with paths
- the line: Architecture: see ARCHITECTURE.md — read before structural changes
Exclude: what the project does, linter-enforced style, task workflows,
anything inferred rather than observed.

## Rules
- Every claim cites a real path relative to repo root.
  Unsure -> "TODO: verify". Never guess.
- Bullets, tables, diagram, frontmatter only. No prose.
- Mermaid only, never .canvas.
- Write the files, then stop. No summary.

---

## My Eye — how to use (no AI needed)

### 1. Where your data is
Everything is on the removable drive **SIAM**. Nothing is on the Mac.

| What | Where |
|---|---|
| Voter database (all people + search index, 42 GB) | `/Volumes/SIAM/My_Eye/data/warehouse.duckdb` |
| Family links and your saved parent choices | `/Volumes/SIAM/My_Eye/data/cache.sqlite` |
| Temporary space used while rebuilding (up to ~41 GB) | `/Volumes/SIAM/My_Eye/data/duckdb-tmp/` |
| Original CSV files | `/Volumes/SIAM/My_Eye/<Division>_CSV/` (e.g. `Dhaka_CSV/`) |
| Logs of every data import | `/Volumes/SIAM/My_Eye/data/logs/` |

- Never copy the database to the Mac.
- Never copy `cache.sqlite` with Finder or `cp` while its `-wal` file exists.

### 2. Start and stop the app (Mac)
1. Open **Terminal** and run:
   ```bash
   cd /Volumes/SIAM/My_Eye
   .venv/bin/uvicorn voterdb.api:app --host 127.0.0.1 --port 8000
   ```
2. Open **http://127.0.0.1:8000** in the browser.
3. To stop: click the Terminal window and press **Ctrl + C**.

### 3. Search by name — English or Bangla
- Type the name in the search box and press **Search**.
  - English: `Mohammad Rahim`, `Md Rafiqul Islam`, `Kamal Hossain`
  - Bangla: `মোহাম্মদ রহিম`
- **English is matched by sound**, so one English spelling finds all its Bangla spellings.
- Check the **Match** column, best to weakest: `exact`, `same spelling`, `sounds alike`, `partial`. `exact` only happens when you type in Bangla.
- **Md / Mohammad / Muhammad** and **Mst / Mosammat** are understood.
- **Too many results?** Also type the date of birth in the `DD/MM/YYYY` box.
- **Type each word separately:** `Abdur Rahman`, not `Abdurrahman`.
- **Click a row** to see that person's family tree.

### 4. Search in one division
- Next to the search box is the **division list**: All divisions, Barishal, Chattogram, Dhaka, Khulna, Mymensingh, Rajshahi, Rangpur, Sylhet. The number in brackets is how many people each division has.
- Pick a division, and the search runs again showing people from that division only.
- The note under the box ends with "— searched Dhaka division only".
- The **Division** column shows where each person is from.
- To search the whole country again, pick **All divisions**.

### 5. Add new data (new district, or new CSV files)
1. **Put the CSV files on the SIAM drive** inside the right division folder, one folder per district, for example:
   `/Volumes/SIAM/My_Eye/Dhaka_CSV/Narsingdi/...`
   - Sub-folders inside it (constituency, upazila, union, area code) are fine.
   - Extra CSV files for a district that is already loaded can go into that district's existing folder.
   - If they are in a `.zip`, double-click it in Finder to unzip first.
   - For the split archives in a division's `archives/` folder, open Terminal in the division folder and run `./archives/extract.sh --keep-zip`. Without `--keep-zip` the zip files are deleted.
2. **Close My Eye** (Ctrl + C in its Terminal window).
3. In Finder, open `/Volumes/SIAM/My_Eye` and **double-click `Add New Data.command`**.
4. **Type `1`** (Check for new data). This is safe: it changes nothing in the database and takes a few minutes. It lists:
   - `NEW DISTRICT` — a folder that is not in the database yet
   - `NEW FILES` — CSV files added to a district that is already loaded
   - `WARNING ... looks like a second copy` — do not load it
   - `ERROR: these CSVs cannot be read` — wrong columns; fix or remove that folder
   - **If it asks "Which district is it?"**, type the number of the district. Your answer is remembered.
     - Type `0` if you are not sure; it will ask again next time.
     - Type `N` only if that folder is a copy of another folder.
5. If the list looks right, **double-click `Add New Data.command` again, type `2`, then type `YES`**.
   - It imports the data, then rebuilds the search index. **This takes about 3 hours.**
   - Keep the SIAM drive plugged in, the Mac on power and the lid open. The Mac will not go to sleep by itself.
6. Wait for **`PASS: everything is imported and searchable.`** It then shows the number of people per division, before and after.
7. **Start My Eye again** (section 2). The new people are now searchable, also by division.

**Rules:**
- Only **add** CSV files. Do not edit, rename or move files or folders that are already loaded: a renamed folder would load the same people a second time.
- Do not put a second copy of a district into another folder. If the tool says "looks like a copy", press Enter to skip it.
- CSV files must have one of these two header lines:
  - `Serial,Name,VoterNumber,Father,Mother,Occupation,DateOfBirth,Address`
  - `district,upazila_thana,...,serial_no,status,name,voter_no,father,mother,occupation,dob,address,...`
- **Changing a district answer:** the answers are in `/Volumes/SIAM/My_Eye/config/data_folders.json`. Only change a folder that has **not** been imported yet: its people are stored under the district that was chosen.

### 6. Update the Windows copy after adding data
The Windows app has its own copy of the database, so it does not see new data until you refresh it. On the Mac, with the Windows drive plugged in:
1. On the Windows drive, delete only `My Eye/data/warehouse.duckdb`.
   - Keep `cache.sqlite` if parent choices were made on Windows; it is kept as it is.
2. In Terminal:
   ```bash
   cd /Volumes/SIAM/My_Eye
   .venv/bin/python scripts/prepare_windows_drive.py /Volumes/<WindowsDrive>
   ```
   Replace `<WindowsDrive>` with the drive's name as shown in Finder. It copies the app and exports the data (about 17 GB, tens of minutes).

### 7. If something goes wrong
| Message or problem | What to do |
|---|---|
| `STOP: close My Eye (and any other data script) first` | The app is still running. Press Ctrl + C in its Terminal window, then try again |
| `STOP: the database is open in another program` | Same as above |
| `STOP: no database at ...` / `Cannot find .venv/bin/python` | The SIAM drive is not plugged in |
| `STOP: all data must stay on the removable drive` | You started a copy that is on the Mac. Use the one in `/Volumes/SIAM/My_Eye` |
| `STOP: the index rebuild needs about 50 GB free` | Free up space on the SIAM drive |
| `ERROR: these CSVs cannot be read` | That folder's columns are wrong. Nothing was imported. Fix or remove the folder |
| `FAILED while loading ...` | Fix what the message says, then run option 2 again. Parts already imported are not imported twice |
| `FAIL: the import finished but the check afterwards found problems` | Run option 2 again. If it fails again, keep the log file from `data/logs/` |
| New people are not found in search | Did the run end with `PASS`? Did you restart My Eye? Run option 1: if it says the search index is `OUT OF DATE`, run option 2 |
| Division list is missing in the Windows app | That copy is old. Refresh it (section 6) |
