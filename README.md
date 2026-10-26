# Smart Attendance Management System

A static educational attendance-management demo for a first-year B.Tech IT project. It follows the structure and Git workflow used by the Smart Traffic Management project while implementing the requirements in [`prompt.txt`](./prompt.txt).

> **Demo and privacy notice:** the browser app uses fictional sample accounts and `localStorage`. Authentication, session codes, location checks, and face-verification labels are demonstrations only. Do not use real passwords, student data, or this project for consequential attendance decisions.

## Architecture and project files

```text
smart-attendance-management/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── attendance.js
│   ├── auth.js
│   ├── reports.js
│   └── storage.js
├── java-source/
│   └── src/main/java/edu/demo/attendance/
│       ├── app/
│       ├── model/
│       ├── service/
│       └── storage/
├── prompt.txt
└── README.md
```

The deployable application is the HTML/CSS/vanilla-JavaScript frontend. Its JavaScript modules handle UI/authentication, attendance validation, CSV export, and local browser persistence. The Java source is an independent console example for the course syllabus; it is not a backend and is not executed by Netlify.

| Option | What it provides | Hosting |
|---|---|---|
| Working college demo | Complete static frontend, sample login, simulated verification, and browser `localStorage` | Deploy this repository directly to Netlify |
| Future full Java system | A separately built Java web API, server-side authentication/authorization, and shared database connected to the frontend | Host the Java service and database separately; this backend is not included or claimed as implemented |

## Demo accounts

| Role | Login | Password |
|---|---|---|
| Admin | `admin@demo.edu` | `demo123` |
| Student | `STU001`, `STU002`, `STU003`, or `STU004` | `demo123` |

The credentials are intentionally visible sample data, not secure authentication. The initial roster includes Aarav Mehta, Diya Sharma, Kabir Patel, and Sara Khan. Sample class history is generated locally on first launch.

## Run locally

Open `index.html` in a modern browser. To use a local HTTP server instead, open PowerShell in this folder and run:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`. The server only serves static files; there is no build step, API, database, or Java runtime requirement for the website. Geolocation permission is typically available on `localhost` or HTTPS.

## Feature checklist

1. Sign in as admin or a student using the demo credentials.
2. Admin dashboard: inspect the roster totals, today's check-ins, attendance average, students below threshold, and any rejected attempts.
3. Student dashboard/profile: inspect overall and subject-wise attendance, low-attendance warnings, profile, and records.
4. Mark attendance as a student using the visible class code: `JAVA75`, `DATA82`, or `MATH90`. Codes can be changed by the admin in **Verification settings**. Each student can check in once per subject/session/date; invalid codes and duplicates are recorded for review.
5. Optional location: select the location option, choose **Check my location**, and grant permission. The check uses a configured sample campus point/radius; coordinates are not secure proof of identity or presence.
6. The face-verification checkbox only adds a clearly labeled simulation marker. It does not access a camera, detect a face, or identify a person.
7. Admin **Manage students**: search, add, and edit fictional student records.
8. Admin **Manage attendance**: filter records, correct a status with a required audit note, and review audit entries and rejected attempts.
9. Admin **Reports & export**: filter the records and download the current result set as CSV.
10. Admin **Verification settings**: configure attendance threshold, optional location enforcement, sample campus radius/coordinates, session codes, and expiry times.
11. **Reset demo data** restores the original sample accounts and records after confirmation.
12. **Java & OOP concepts** explains how the Java course units and object-oriented concepts are represented.
13. Student dashboard **Attendance by period** shows today's, rolling 7-day, and rolling 30-day attendance percentages.

## Java demonstration

The Java implementation uses packages for models, services, storage, and the console entry point:

- **Unit 1 — Java basics:** `AttendanceManager` demonstrates variables, methods, conditions, loops, and a runnable `main`.
- **Unit 2 — OOP, arrays, collections, lambdas:** abstract `User`, inherited `Student`/`Admin`, encapsulated `AttendanceRecord`, arrays, `ArrayList`, `HashMap`, stream filtering, and a generic helper.
- **Unit 3 — packages, strings, exceptions:** package organization, input checks, normalized session strings, and `AttendanceException`.
- **Unit 4 — concurrency and I/O:** `ConcurrentAttendanceProcessor` uses `ExecutorService`; `FileStorageService` reads/writes CSV through Java I/O.
- **Unit 5 — GUI concepts, generics and collections:** the interactive browser UI demonstrates GUI concepts; the Java example uses generic collections and a generic method. It does not implement a Java GUI.

Compile and run the console example with a JDK (Java 8 or newer), from the repository root:

```powershell
javac -d java-source\out (Get-ChildItem java-source\src\main\java -Recurse -Filter *.java | ForEach-Object { $_.FullName })
java -cp java-source\out edu.demo.attendance.app.AttendanceManager
```

The example writes `attendance-demo.csv` in the current working directory when it records attendance.

## Netlify deployment

1. Import the attendance repository from GitHub in Netlify.
2. Set the production branch to `main`.
3. Leave the build command blank and set the publish directory to `.` (the repository root).
4. Enable branch deploys and choose `uat` as the staging branch if the Netlify plan/site supports branch deploys.
5. Deploy. Pushes to `main` update production; pushes to `uat` update staging.

Alternatively, use Netlify Drop to publish the repository folder as a static site. No environment variables or secret keys are required.

## Git repository and branch workflow

The attendance repository has its own `origin` remote (`smart-attendance-management`); keep that remote and do not substitute the traffic repository URL. Use the same three-branch flow as the traffic project:

```powershell
git switch dev
# make changes and test
git add .
git commit -m "Describe the change"
git push origin dev

git switch uat
git merge dev
git push origin uat

git switch main
git merge uat
git push origin main
```

When a branch does not exist locally yet, create it from the intended base, then set its upstream on first push:

```powershell
git switch -c dev
git push -u origin dev
```

If GitHub requests authorization, finish it in the local browser sign-in flow or use a locally configured credential manager. Never paste credentials into project files or chat.

## Limitations and next steps

- `localStorage` is browser-local, user-editable, and not secure for passwords or sensitive information. Data does not synchronize across users or devices.
- Production authentication, authorization, shared database storage, trusted audit records, and reliable anti-proxy controls require a server-side application and database.
- Location is permission-gated and approximate. A browser location can be unavailable or spoofed.
- Face verification is not implemented. No camera is opened and no face is recognized.
- Session codes are displayed for easy testing and are not signed, encrypted, or equivalent to real QR scanning.
- The Java classes illustrate OOP/course concepts; they are not connected to the browser app.
- Future work could add a secured Java API, managed database, server-issued expiring QR tokens, reviewed camera-based identity verification with explicit consent, and server-side audit logging.
