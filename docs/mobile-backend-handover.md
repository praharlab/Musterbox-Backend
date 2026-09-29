# MusterBox / Aptavetan — Mobile Backend Handover

> **Audience:** the engineer or AI agent building the new React Native app that will consume this backend.
> **Source of truth:** this repository's working tree as of 2026-09-23 (branch `local`, based on `f2f0eac`). Everything here was read from code, not from documentation. Several leave files (`controllers/userleave.controller.js`, `routes/userleave.router.js`, `controllers/leaveAuthorization.controller.js`) have large **uncommitted** changes; confirm the deployed build matches before relying on the leave routes marked *(working tree)*.
> **Nothing in this document changes backend behaviour.** Sections labelled **PROPOSED** describe APIs that do **not** exist yet.

Conventions used throughout:

| Abbreviation | Meaning |
|---|---|
| **VT** | `verifyToken` middleware (`middleware/tokenverify.js`) — requires a valid JWT |
| **PA** | `permissionAccess` middleware (`middleware/permissionAccess.js`) — tenant scope check on client-supplied IDs |
| **VCP** | `verifyChildParent` middleware (`middleware/verifyChildParent.js`) |
| **Client uid** | the target/acting user ID is read from the request, not from the token |
| **Token uid** | the user ID is taken from `req.userDetails.userMasterId` (safe) |
| READY / REVIEW / GAP | see the checklist at the end |

---

## 1. Backend overview

| Item | Value (with evidence) |
|---|---|
| Package | `samword-hrms-backend` (`package.json`). Product branding comes from env `PROJECT_NAME` (`utils/labelUtils.js`). |
| Runtime | Node.js **v16.19.0** (`.nvmrc`) |
| Framework | Express **4.21** (`app.js`), `body-parser` JSON/urlencoded limit **500 MB** |
| Database | PostgreSQL via **Sequelize 6.37** + `pg` 8 (`config/database.js`). Dialect comes from `DB_DIALECT`. Timezone forced to `+05:30`. PostgreSQL server version is **not pinned anywhere in the repo** — ask ops. |
| Other DBs | MSSQL (`mssql`) for biometric device DBs (`config/biometricIntegrationdb.js`) and ERP (`config/erpdatabase.js`) |
| Query layer | Mostly Sequelize models (`models/`, ~330 files). A significant number of raw `sequelize.query` / `executeQuery` calls, many built with string concatenation (see §13). |
| Structure | `router.js` mounts ~315 routers from `routes/` onto prefixes; each router calls `controllers/*.controller.js`. `utils/commonUtilFunctions.js` (34k lines) holds shared business logic. `middleware/` holds auth, scope, upload. `socket/` holds socket.io helpers. `cron.js` + controllers schedule jobs. |
| Ports | REST: **3000** (`app.listen(port)`, hard-coded). Socket.io: **3210** on a *separate* HTTP server (`server.listen(socketport)`). Both are hard-coded in `app.js`. |
| URL shape | `/<module>/v1/<action>` — e.g. `/auth/v1/mobilelogin`, `/attendanceTransaction/v1/attendanceApi`. There is **no `/api` prefix and no global version prefix**. A few routers omit `/v1` (e.g. `/gatepassauthorization/authorizationacceptreject`, `/resignation/resignationAuthorizationacceptreject`). Most actions are `POST` with a JSON body, even for reads. |
| Static files | `app.use('/uploads', express.static('uploads'))` — **every uploaded file is public, no auth** (`app.js`). |
| CORS | `cors()` + `Access-Control-Allow-Origin: *` (REST and socket). |
| Tests | None (`npm test` is a stub). |

### 1.1 Response envelope

There is **no single envelope**. The RN client must handle three styles:

| Style | Where | Shape | HTTP status |
|---|---|---|---|
| **Legacy (most modules)** | auth, attendance, leave, payroll, expense, visits, tasks… | `{ status: 200, message: "…", data: …, totalcount? }` | **HTTP 200 even for business errors**; the real outcome is `body.status` (200/400/401/500/501). Example: wrong password → HTTP 200, `{status:400, message:"Please enter valid loginid and password.", data:{}}` |
| **REST-style v1** | `/ticket`, `/policyDocument`, `/employeeGatepass`, PMS (`/goal`, `/employeeGoal`, `/employeePerformanceReview`…), `/sentimentPunchIn` | `{ message, data, totalcount, page, pageSize }` — **no `status` field** | Real HTTP codes (200/400/404) |
| **Middleware / infrastructure** | VT / PA denial | `{ msg: "Authorization Denied!" }` | **HTTP 403** (note: `msg`, not `message`) |
| | Joi validation (`middleware/validateSchema.js`) | `{ message }` | HTTP 400 |
| | Multer upload error (`middleware/multer.js` `handleMulterErrors`) | `{ message }` | HTTP 400 |
| | Global error handler (`app.js`) | `{ status, message }` | `error.statusCode` or 500 |

**Rule for the client:** success ⇔ `HTTP 2xx` **and** (`body.status` is absent **or** `body.status == 200`). Treat `HTTP 403` as "token invalid/expired or out of scope". Treat `body.status == 401` with message `"Please update app version."` as a forced-update signal (see §2.7).

Messages live in `response_message/message.js` (e.g. `userlogin`, `usernotfound`, `userdeactive`, `usersubscribeplan`, `versionnotmatch`).

### 1.2 Pagination

| Style | Request | Response |
|---|---|---|
| Legacy | body (or query) `page` + `limit`; offset = `(page-1)*limit`. **Both** must be set, otherwise most endpoints return everything. | `totalcount` |
| REST-style v1 | query `page` (default 1) + `pageSize` (default 10) | `totalcount`, `page`, `pageSize` |

There is no cursor pagination. `exportData`/`Export` flags on many list endpoints switch the response to an XLSX stream — the mobile app should never send them.

---

## 2. Authentication

### 2.1 Endpoints (`routes/auth.router.js`, mounted at `/auth` with **no** VT)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/auth/v1/mobilelogin` | POST | No | **Mobile login (use this)** |
| `/auth/v1/login` | POST | No | Web login (1-day token) |
| `/auth/v1/Facelogin` | POST | No | Face-kiosk app login (requires `FaceAppLogin` right) |
| `/auth/v1/dashboardcheck` | POST | VT | App bootstrap: version gate, subscription gate, FCM token save, attendance policy |
| `/auth/v1/resetpassword` | POST | **No** | Forced first-login password change (clears `resetpassword` flag) |
| `/auth/v1/changepassword` | POST | VT | Change password |
| `/auth/v1/forgot` | POST | No | Forgot password (email OTP) |
| `/auth/v1/forgotpasswordOtpMARS` | POST | No | Forgot password (SMS OTP via MARS gateway, tenant-specific) |
| `/auth/v1/checkPasswordTokenMARS` | POST | No | Verify the SMS OTP |
| `/auth/v1/reset` | POST | No | Set new password by mobile number |
| `/auth/v1/userLogout` | POST | VT | Clears the stored FCM token |
| `/auth/v1/finalcheckpermission` | POST | VT | Full role permission list |
| `/auth/v1/profile/:id`, `/auth/v1/getprofileWithCutomizeFields/:id` | GET | VT | Profile summary |
| `/auth/v1/editprofile` | POST (multipart `photo`) | **No** | Update profile photo |
| `/auth/v1/birthday`, `/auth/v1/anniversary` | GET | VT | Birthdays / work anniversaries (token-scoped) |

### 2.2 Mobile login — `POST /auth/v1/mobilelogin`

`controllers/auth.controller.js:311-463`

Request:
```json
{
  "phone": "9876500001",
  "password": "••••••••",
  "firebaseToken": "<FCM registration token>",
  "uniqueID": "<device id>",
  "tracking": { "Lattitude": "23.0225", "Longitude": "72.5714", "Address": "…", "Track_datetime": "2026-09-23T09:01:00+05:30" }
}
```
- `phone` is matched against `userMaster.userNumber` (active users only).
- `firebaseToken` and `uniqueID` are written to `userMaster`. `uniqueID` is **stored but never enforced** (no device binding).
- `tracking` (optional) is inserted into the `Tracking` table as-is.

Checks, in order: user exists → company `status` not 0/2 → `admin != 2` (super admin cannot log in on mobile) → an active `subscriptionPlan` for the **parent** company with `startDate <= today < endDate` → bcrypt password match.

Success response (HTTP 200):
```json
{
  "status": 200,
  "message": "User login successfully.",
  "data": {
    "token": "<JWT>",
    "companyid": 12,
    "userid": 345,
    "firstname": "Asha",
    "middlename": "",
    "lastname": "Patel",
    "userNumber": "9876500001",
    "email": "asha.patel@example.com",
    "resetpassword": 1
  },
  "Permission": [
    { "rolePermissionID": 901, "roleMasterID": 7, "formMasterID": 55, "operationID": 4, "status": 1,
      "formMaster": { "formName": "Chat" }, "operation": { "operationName": "View" } }
  ]
}
```
- `Permission` only covers four forms: `BirthdayList`, `WorkAnniversaryList`, `Chat`, `HrDashboard`. Use `/auth/v1/finalcheckpermission` for the full list.
- `resetpassword: 1` (the model default) means **the user must change the password before continuing** — call `/auth/v1/resetpassword`.

Failure responses (all HTTP 200): `{status:501,"message":"User not found."}`, `{status:401,"message":"Company deactivated or deleted!"}`, `{status:401,"message":"You dont have rights for mobile Login!!"}`, `{status:401,"message":"Please subscribe any plan.."}`, `{status:400,"message":"Please enter valid loginid and password."}`.

Field-name differences vs web login (`/auth/v1/login`): web returns `usermasterid`, `companyMasterID`, `admin`, `childcompany`, `userName`; mobile returns `userid`, `companyid` and **no** `admin`/`childcompany`. If the app needs `admin`/`childcompany`, it must call `/auth/v1/login` or read them elsewhere — mobile login does not return them.

### 2.3 JWT

| Property | mobilelogin / Facelogin | web login |
|---|---|---|
| Payload | `{ "token": { "usermasterid": 345 }, "iat": …, "exp": … }` | `{ "token": { "usermasterid": 345, "userType": 0 }, … }` |
| Algorithm | HS256 (jsonwebtoken default), secret `SECRETKEY` | same |
| Expiry | **365 days** | 1 day |

`verifyToken` (`middleware/tokenverify.js`) reads `Authorization: Bearer <jwt>`, loads the user (must be `status=1`) and company (must be `status=1`), and sets:

```js
req.userDetails = {
  userMasterId,            // from the JWT
  userIpAddress,           // from x-forwarded-for (client-controllable)
  companyMasterId,         // from the DB, not the client
  accessibleCompanies: [companyMasterId],
  accessibleBranches: [],
  parentCompanyMasterId,
  role: { roleType, companyAccessType }
}
```
It does **not** re-check the subscription on each request. Any failure → HTTP 403 `{msg:"Authorization Denied!"}`.

- **Employee ID vs user ID:** the primary key used everywhere is `userMasterID` (JWT `usermasterid`, login `userid`). The human "employee code" is `employeeJoiningDetails.employeeCode` (returned by `/auth/v1/profile/:id`). There is no separate employee table ID the app needs.
- **Refresh token: NOT SUPPORTED.** There is no refresh endpoint. When the token expires (365 days) or the user is deactivated, requests return 403 and the user must log in again.
- **Logout:** `POST /auth/v1/userLogout {userMasterID}` only nulls `userMaster.firebaseToken`. **The JWT is not revoked** and stays valid until it expires. The app must delete its stored token.
- **Session timeout:** none server-side apart from JWT expiry. Deactivating a user or company makes the next request fail with 403.

### 2.4 App bootstrap — `POST /auth/v1/dashboardcheck` (VT)

`controllers/auth.controller.js:1227-1606`. Call after login and on every app start.

Request:
```json
{ "userMasterID": 345, "deviceType": "android", "appVersion": "1.4.0", "FirebaseToken": "<FCM token>" }
```
(`userid` is accepted as an alias of `userMasterID`.)

Checks: user active → company active → subscription active → **`AppVersion` row for `deviceType` must equal `appVersion` exactly** (or be `''`) → saves `firebaseToken` + `deviceType` on the user.

Success:
```json
{
  "status": 200,
  "message": "…",
  "data": {
    "tracking": true,
    "trackingInterval": 300,
    "statusMonitoring": 1,
    "expensesubmittedindays": 7,
    "attendancepolicy": { "attendancePolicyID": 3, "selfieAttendance": 1, "selfieWithFaceDetection": 0,
                          "outsidePunchInPunchOut": 0, "singleMultiplePunchInPunchOut": "multiple",
                          "attendanceInMobile": 1, "missPunchMinutes": 960, "attBrType": "assigned", "attBranch": [] },
    "biometricSerialNo": null,
    "biometricCode": null,
    "attendanceFrom": "mobile",
    "customizeProfileFields": ["userNumber", "email", "designation"]
  }
}
```
Version mismatch → HTTP 200 `{status:401, message:"Please update app version.", data:{customizeProfileFields:[…]}}`. If no `AppVersion` row exists for the `deviceType`, the handler crashes (500). **Coordinate every release with the `appVersion` table** (`POST /appversion/v1/updatebyid`).

### 2.5 Forgot / reset password

There are two OTP flows. **Neither is safe as implemented** (see §13).

**Flow A — email (`/auth/v1/forgot` → `/auth/v1/reset`)**
1. `POST /auth/v1/forgot {"mobile":"9876500001"}` → generates a 4-digit `passwordToken`, emails it, **and returns it in the response**: `{status:200, message:"Password reset code sent to your email account.", data:{otp: 4821, mobile:"9876500001"}}`.
2. `POST /auth/v1/reset {"mobile":"9876500001","new_password":"…"}` → sets the password. **It does not check any OTP.**

**Flow B — SMS (MARS) (`forgotpasswordOtpMARS` → `checkPasswordTokenMARS` → `reset`)**
1. `POST /auth/v1/forgotpasswordOtpMARS {"mobile":"…"}` → sends a 4-digit OTP by SMS, valid 10 min. Response `{status:200, data:{mobile}}` (OTP not returned). The SMS template is tenant-specific (`'Forgot Password MiEye'`).
2. `POST /auth/v1/checkPasswordTokenMARS {"mobile":"…","passwordToken":"4821"}` → `{status:200, message:"OTP verified successfully", data:{verified:true}}` and clears the OTP.
3. `POST /auth/v1/reset` as above. The server does not link step 2 to step 3.

**Forced first-login change:** `POST /auth/v1/resetpassword {"userMasterID":345,"password":"old","newpassword":"new"}` (no VT). Sets `resetpassword=0` on success.

**Change password:** `POST /auth/v1/changepassword {"userMasterID":345,"password":"old","newpassword":"new"}` (VT, but uses the body `userMasterID`).

**Login OTP:** not supported. OTP exists only for password reset.

### 2.6 Permissions after login

`POST /auth/v1/finalcheckpermission {"userMasterID":345}` (VT) returns the caller's role rights:
```json
{ "status": 200, "master": ["Leave", "Attendance", "HrDashboard"], "data3": 3,
  "data": [ { "formName": "Leave", "formMasterID": 20, "operationName": ["View", "Create", "Show Menu"] } ],
  "resultlength": 1 }
```
These rights are **only for UI decisions**. The server does not enforce them on endpoints (§3.2).

### 2.7 Recommended mobile auth sequence

1. `mobilelogin` → store `token`, `userid`, `companyid`.
2. If `resetpassword == 1` → force the change-password screen (`/auth/v1/resetpassword`).
3. `dashboardcheck` (with FCM token, `deviceType`, app version) → on `status 401` + version message, show the force-update screen.
4. `finalcheckpermission` → build menus.
5. On logout: `userLogout`, then wipe secure storage.

---

## 3. User types

### 3.1 `userMaster.admin` values (verified)

| Value | Meaning | Evidence | Mobile login? | Support in the mobile app? |
|---|---|---|---|---|
| **0** | Every tenant user — **employees *and* company admins/HR**. Registration creates the company owner with `admin:0` and assigns the **"Admin" role** (`controllers/registration.controller.js:831,849-858`). | bulk import `companyContact.controller.js:5131,6658`; joining request `employeeJoiningRequest.controller.js:982` | Yes | **Yes — primary audience** |
| **1** | **Not used.** No code compares or assigns `admin == 1`. It can only appear if a client sends `admin:1` to `/companycontact/v1/add`. | — | Yes (treated like 0) | Treat as 0 |
| **2** | Platform super admin | `auth.controller.js:83,345`; `permissionAccess.js:58` | **No** (blocked) | No |
| **3** | Sub admin (platform staff) | `companyContact.controller.js:2302-2356` | Yes | No — web only |
| **4** | Dealer / reseller | `companyContact.controller.js:14610-14653` | Yes | No — web only |

Admins 2, 3 and 4 **bypass `permissionAccess` entirely** (all tenants).

### 3.2 How "HR", "Manager" and "Employee" actually differ

- **HR / company admin vs employee:** only the **role**. Tables: `roleMaster` (`roleType` = `companyWise`|`branchWise`, `companyAccessType` = `ownCompany`|`ownPlusChildCompany`), `userRole` (one role per user in practice; code reads `userRoles[0]`), `rolePermission` (role × `formMaster` × `operation`), `roleMasterBranchWise`.
- **Default roles at registration** (`registration.controller.js:715-795`): "Admin" and "Employee" are **both** `companyWise` + `ownPlusChildCompany`, so they have **the same data scope**.
- **Server-side RBAC does not exist for actions.** No middleware reads `rolePermission`. The only server gate is `Facelogin` (form `FaceAppLogin`, operation 4). Rights are used for menus, the inbox filter (`userInbox.controller.js:72-181`) and notification recipients.
- **Manager** is not a user type. A manager is:
  - someone other employees **report to** (`employeeReportTo.reportToID`), used for team views; and/or
  - someone listed as an **approver** in `authorizationDetails.AuthorizedByUserMasterId[]`, which drives approvals. **Approvals do not use the report-to hierarchy.**

| Persona | Company scope (PA) | Employee scope (PA) | Approvals | Admin actions | Mobile |
|---|---|---|---|---|---|
| Employee (`admin 0`, Employee role) | own + child companies | **every user in those companies** | only if listed as approver | server does not stop them (UI must hide) | Yes |
| Manager (`admin 0` + reportees/approver) | same | same | yes, per module | same | Yes |
| HR / company admin (`admin 0`, Admin role) | same | same | yes if configured | intended | Phase 2 / web |
| Branch-wise role | own company only | users in the role's branches | as configured | — | Yes |
| Sub admin / Dealer (3/4) | all | all | — | platform | No |
| Super admin (2) | all | all | — | platform | Blocked |

**Mobile rule:** decide *manager* capabilities from data, not user type:
- Team tab: show if `GET /reportTo/v1/reportstoImmediateChild` returns any `child`.
- Approvals tab: show if `POST /AuthorizationDetails/v1/getAuthList {userMasterID}` returns non-zero counts, or if any module's pending list is non-empty.
- HR-only menus: from `finalcheckpermission`.

---

## 4. Tenant architecture

### 4.1 CURRENT IMPLEMENTATION

- **Tenant** = `companyMaster` row. `parentCompanyMasterID = 0` means a parent company; otherwise it is a child of that parent. `fetchChildCompanies` (`utils/commonQueries.js`) goes **one level** deep.
- **Subscription** belongs to the parent (`subscriptionPlan`). It is checked **only** at login and `dashboardcheck`, not on each request.
- **User → company:** `userMaster.companyMasterId`.
- **Org assignments** are time-bounded rows. "Current" = `status=1 AND applicableDate <= today AND (endDate >= today OR endDate IS NULL)`:
  - `employeeBranch` (→ `branchMaster`, which also holds geofence lat/long/radius)
  - `employeeDepartment` (→ `department`), `employeeDesignation` (→ `designation`)
  - `employeeDivision` (→ `division`), `employeeWorkingArea` (→ `workingArea`), `employeeWorkingLocation` (→ `workingLocation`)
  - `employeeEmployeement` (employment type), `employeeReportTo` (manager; no dates, can be many)
- **From authentication:** VT puts `companyMasterId` and `parentCompanyMasterId` (from the DB) into `req.userDetails`.
- **permissionAccess (PA)** runs at mount level on about 90 prefixes. It computes the caller's accessible companies/branches/users and rejects the request with 403 if the body/query/params contain `companyMasterID`, `branchMasterID` or `userMasterID` outside that scope. Exact behaviour:
  - Only those three **exact, case-sensitive** keys are checked. `userid`, `id`, `companyid`, `companyId`, `userMasterIDs`, indexed keys like `userMasterID0`, and route params like `:id` are **not checked**.
  - PA runs at `app.use` level, where `req.params` is still empty, so **path params are never checked**.
  - On **multipart** routes PA runs **before** multer parses the body, so it sees an empty body and **checks nothing**.
  - For a normal employee, "accessible users" = **every user in their company tree**. PA prevents cross-tenant access, **not** access to a colleague's data.
- **Where controllers get `companyMasterID`:** mostly from the client (≈425 body/query reads across 138 controllers vs ≈156 token reads in 32 controllers). Routes mounted with VT only (no PA) do **not** validate client-sent IDs at all.

### 4.2 Which requests need `companyMasterID`

Many list endpoints require `companyMasterID` in the body or query (e.g. `/userleave/v1/getUserLeaveBalance?companyMasterID=`, `/attendanceTransaction/v1/dashboardpunchinout`, `/advancePayment/v1/getcompanydata`). The mobile app should **always send the `companyid` returned by login** and never let the user change it. Endpoints that read the company from the token (`/userInbox/v1/getUserInboxData`, `/ticket/v1`, `/userExpense/v2/add`, `/policyDocument/v1` default) ignore or override it.

### 4.3 Risks of client-supplied IDs

| Risk | Where | Effect |
|---|---|---|
| Colleague data access | any PA route taking `userMasterID` | payslips, leave, attendance, profile of any co-worker |
| Cross-tenant access | VT-only routes (`/userLetters`, `/reportTo/*`, `/LastFiveAttendance`, `/attendanceCorrectionRequest`, `/paySlipGenerator`, `/shortLeave`, `/visit`…) and any `:id` param | data from **other companies** |
| Scope override | controllers that set `req.userDetails.accessibleCompanies = body.companyMasterID` | relies on PA having run first |
| Multipart bypass | all upload routes | PA checks nothing |

### 4.4 RECOMMENDED FUTURE IMPROVEMENT

- Add token-derived `/me` endpoints for mobile (§14) so the client never sends its own `userMasterID`/`companyMasterID`.
- Move PA after multer on upload routes, and scope `:id` params.
- Add a `requirePermission(form, operation)` middleware for HR/manager actions.

---

## 5. Employee MVP APIs

All endpoints below require `Authorization: Bearer <token>` unless noted. "Client uid" means the app must send its own `userMasterID`. Until the §14 fixes land, the app must **always send the logged-in user's own ID** and never an ID typed by the user.

### A. Login
| Need | Endpoint | Status |
|---|---|---|
| Login | `POST /auth/v1/mobilelogin` | READY |
| Bootstrap / version gate | `POST /auth/v1/dashboardcheck` | READY (uses body uid) |
| First-login password change | `POST /auth/v1/resetpassword` | REVIEW (no auth) |
| Change password | `POST /auth/v1/changepassword` | REVIEW (body uid) |
| Forgot password | `forgotpasswordOtpMARS` → `checkPasswordTokenMARS` → `reset` (SMS) or `forgot` → `reset` (email) | **GAP** — `reset` does not verify the OTP; `forgot` leaks it |
| Login OTP | — | NOT AVAILABLE |
| Logout | `POST /auth/v1/userLogout` | READY (clears FCM only) |

### B. Home
| Widget | Endpoint | Notes |
|---|---|---|
| Employee info | `GET /auth/v1/profile/:id` (or `getprofileWithCutomizeFields/:id`) | name, code, photo URL, company, designation, department, branch, address |
| Today's attendance | `POST /attendanceTransaction/v2/attendancestatus {userMasterID}` | `In_Data`, `Out_Data`, `continuePunchIN` |
| Month summary | `GET /attendanceTransaction/v1/userAttendanceSummary?startdate&enddate&userMasterID` | present/late/early/absent/leave/weekoff/holiday counts |
| Leave balance | `GET /userleave/v1/getUserLeaveBalance?companyMasterID&userMasterID` | |
| Pending requests (mine) | per module (leave `v2/LeaveByUser` with status filter, short leave, gate pass…) | **GAP** — no single "my open requests" endpoint |
| Approvals badge (manager) | `POST /leaveauthorizationRequest/v1/countpending {userMasterID}` | leave/OT/expense only |
| Payslip availability | — | **GAP** — no month list for main payroll (see E) |
| Notifications | `GET /userInbox/v1/getUserInboxData` + `POST /announcement/v1/countUnreadAnnouncement` | inbox is token-scoped |
| Tasks | `POST /user_tasks/v1/getTaskReport {userMasterID,startDate,endDate}` | pending/accepted/rejected/completed counts |
| Birthdays / anniversaries | `GET /auth/v1/birthday`, `GET /auth/v1/anniversary` | token-scoped |

### C. Attendance
| Need | Endpoint | Notes |
|---|---|---|
| Today | `POST /attendanceTransaction/v2/attendancestatus` | |
| Check-in | `POST /attendanceTransaction/v1/attendanceApi` `direction:"in", newpunchin:true` | server time, geofence, optional selfie |
| Resume after break | same, `direction:"in", newpunchin:false` | "continue punch-in" |
| Check-out | same, `direction:"out"` | |
| Monthly calendar | `POST /attendanceTransaction/v1/getcalenderdatamonthwise` | richest per-day data |
| History list | `POST /attendanceTransaction/v1/attendanceData` ("USED IN MOBILE ONLY") or `/v1/attendanceByUserid` (paginated) | |
| Day punch logs | `POST /attendanceTransaction/v1/getUserLogDateWise {userMasterID, attendanceDate}` | |
| Last 5 days | `POST /LastFiveAttendance/v1/getlastfiveattendance {userMasterID}` | VT only (cross-tenant IDOR) |
| Shift | `GET /employeeshift/v1/getbyuserid/:id`, `GET /shift/v1/getbyid/:id`, `POST /shiftRoster/v1/listShiftRosterData` | `:id` unchecked |
| Working hours | `inHours`/`outHours` per day in the calendar; `InHrs` (worked minutes) on the transaction | |
| Regularization request | `POST /attendanceCorrectionReason/v1/list` → `GET /attendanceCorrection/v1/getAlldata?userMasterID&date` → `POST /attendanceCorrectionRequest/v1/add` | VT only |
| My regularization requests | `POST /attendanceCorrectionRequest/v1/getByUserId` | |
| Mood check-in (optional) | `POST /sentimentPunchIn/v1 {mood}` | token uid; once per day |

### D. Leave
| Need | Endpoint | Notes |
|---|---|---|
| Balance | `GET /userleave/v1/getUserLeaveBalance` | `[{leaveName, LeaveDesc, LeaveTranId, Leave_CF, LeaveID, Balance}]` |
| Types | `GET /hrleavetypes/v1/getDataWithoutOutDuty/:id` | send `LeaveTranId` when applying |
| Optional holidays | `GET /userleave/v1/getOptionalLeaveByUserId?userMasterID&startDate&endDate` | |
| Holidays | `GET /empholidaypolicy/v1/getbyuserid/:id` → `GET /holidayspolicy/v1/getbyid/:id` | two calls |
| History + status | `POST /userleave/v2/LeaveByUser` *(working tree)* | includes approvals, day rows, attachment |
| Approval trail | `GET /leaveauthorizationRequest/v1/getAuthorizationRequestByReferanceId/:id` | |
| Who approves me | `GET /leaveauthorizationRequest/v1/leaveAuthCriteria/:id` | |
| Apply (with attachment) | `POST /userleave/v2/bulk/add` (multipart, indexed keys) | live apply endpoint (commit `698a896`) |
| Edit pending | `POST /userleave/v1/update` (multipart) | no status guard |
| Withdraw pending | `GET /userleave/v1/delete/:id` | GET with side effect; no owner/status guard |
| Cancel approved day | `POST /leaveauthorizationRequest/v1/leavecancellist` → `/v1/leavecancel` | no approval step |
| Short leave | `POST /userShortLeave/v1/add`, `/v1/listDataByUser`, `PUT /v1/update/:id`, `DELETE /v1/delete/:id` | VT only |
| Comp-off | `POST /coffMaster/v1/addCoffmasterWithAuthorization`, `GET /coffMaster/v1/getCoffDataByUserMasterID` | |

### E. Payslip
There are **two payslip systems**. Confirm with the product team which one each tenant uses.

| System | List | Detail | PDF | Publish control |
|---|---|---|---|---|
| **Main payroll** (`hrSalarySlip`) | **NOT AVAILABLE** — backend endpoint required | `POST /salaryTrans/v1/salaryslipuserwise` (raw data; **SQL injectable, unscoped — do not use**) | `POST /salaryTrans/v1/getUserWiseSalarySlip {userMasterID, yyyymm}` → `data.path` = **base64 PDF** | `salarySlipIssue` (0/1). Without `status` only issued slips are returned. Sending `status:"01"` bypasses this, so **never send `status`**. |
| **PaySlip Generator** (`paySlip`) | `GET /paySlipGenerator/v1/getMyPaySlipData` (**token uid**) → `[{yearMonth, payrollFrequency, startDate, endDate, path}]` | — | public file at `${APIURL}${path}` (`uploads/PaySlips/<company>/<ms>-<user>.pdf`) | none |

Related: Form 16 = `GET /report/v1/getPreviousfinancialYear` → `POST /report/v1/form16Report {userMasterID, financialYear}` → base64 PDF. Salary structure = `GET /hrSalaryMaster/v1/?userMasterID=`.

### F. Notifications
| Need | Endpoint | Notes |
|---|---|---|
| Push | FCM (see §12) | token saved by `mobilelogin`/`dashboardcheck` |
| Inbox (action items) | `GET /userInbox/v1/getUserInboxData?page&limit&type&startdate&enddate` | **token uid**; `activityTable` + `activityTablePK` = deep-link target; no read/unread |
| Announcements | `POST /announcement/v1/getbyuserId {userMasterID,page,limit}` | marks **all** unread as read (side effect) |
| Unread badge | `POST /announcement/v1/countUnreadAnnouncement {userMasterID}` | |
| Per-item read/unread | — | **GAP** |

### G. Profile
| Need | Endpoint | Notes |
|---|---|---|
| Summary | `GET /auth/v1/getprofileWithCutomizeFields/:id` | hides fields per company config (`'-'`) |
| Employment details | `GET /empJoining/v1/getbyuserid/:id` | includes bank, Aadhaar, PAN; `:id` unchecked — **REVIEW** |
| Profile completion | `GET /empJoining/v1/profileStatus?userMasterID=` | `[{display, tabName}]` |
| Address | `GET /useraddress/v1/getbyuserid/:id`, `POST /useraddress/v1/add`, `/v1/updatebyid` | |
| Family | `GET /userfamily/v1/getbyuserid/:id`, `add`, `update` | |
| Education | `GET /usereducation/v1/getbyuserid/:id`, `add` (multipart `degree`) | |
| Experience | `GET /userexperience/v1/getbyuserid/:id`, `add`, `update` | |
| Skills | `GET /userskills/v1/getbyuserid/:id`, `add` | |
| Personal documents (ID proofs) | `GET /userdocument/v1/getbyuserid/:id`, `POST /userdocument/v1/add` (multipart `adharPhoto`) | type list `POST /documentlist/v1/getActiveDocumentTypeData` |
| HR-issued documents | `POST /compdoc/v1/getbyuserid {userMasterID,page,limit}` | |
| Letters | `POST /userLetters/v1/getAllUserLetter {userMasterID}` | VT only — cross-tenant IDOR |
| Policies | `GET /policyDocument/v1?page&pageSize` | token company by default |
| Photo | `POST /auth/v1/editprofile` (multipart `photo`, body `userMasterID`) | **no auth** — REVIEW; respects `isPhotoLock` only in UI |
| My managers | `GET /reportto/v1/getbyid/:id` | |

Profile edits create pending items: adding a record with `verifyStatus: 0` creates an HR inbox item (e.g. `userdocument.controller.js`). The app should **always send `verifyStatus: 0`** and never `verifyBy`.

---

## 6. Manager MVP APIs

| Need | Endpoint | Status |
|---|---|---|
| Manager dashboard (counts) | `POST /leaveauthorizationRequest/v1/countpending {userMasterID}` (leave, OT, expense only) | REVIEW (body uid, no try/catch) |
| Team list (direct reports, today's attendance) | `GET /reportTo/v1/reportstoImmediateChild?userMasterID&date&search&page&limit` | REVIEW (VT only, unscoped) |
| Team tree | `GET /reportTo/v1/reportsto/:id` | REVIEW |
| Team attendance (today) | `GET /reportTo/v1/reportstowithoutchild/:id` | REVIEW |
| Team attendance (date) | `POST /reportTo/v1/reportstowithoutchilddatewise {userMasterID, AttendanceDate}` | REVIEW |
| Team punch counts | `POST /attendanceTransaction/v1/dashboardpunchinout {companyMasterID, date, …}` | company-wide, not team |
| Pending leave approvals | `POST /leaveauthorizationRequest/v2/listLeaveAuthRequestNew {userMasterID, status:2, page, limit}` | REVIEW |
| Leave details for approval | `GET /leaveauthorizationRequest/v1/leavedetails/:id` | needed to build `leavetransaction[]` |
| Approve / reject leave | `POST /leaveauthorizationRequest/v1/authorizationacceptreject` | **GAP** — no approver check; client-built day breakdown |
| Short leave approvals | `POST /shortLeaveAuthorization/v1/listShortLeaveAuthRequest` → `/v1/shortLeaveAcceptReject` | GAP (no approver check) |
| Comp-off approvals | `POST /compensatoryOffAuthorizationRequest/viewcompensatoryOffAuthorizationByUserId` → `/compensatoryOffAuthorizationacceptreject` | GAP |
| Expense approvals | `POST /authorizationRequest/v3/getExpenseAuthByUser` (or `/v1/expenseauthorizationrequestbyuserid`) → `POST /authorizationRequest/v1/authorizationacceptrejectexpenseall` | REVIEW (actor = token; row ownership not checked) |
| Overtime approvals | `POST /authorizationRequest/v1/viewauthorizationrequestbyuseridforovertime` → `/v1/authorizationacceptrejectovertime` | GAP |
| Gate-pass approvals | `POST /gatepassauthorization/gatepassauthorizationrequest` → `/gatepassauthorization/authorizationacceptreject` | GAP |
| Attendance regularization approvals | `POST /attendanceCorrectionAuthorization/listAttendaceAuthorization` → `/attendanceCorrectionAuthorization/attendancecorrectionauthorizationrequest` | GAP |
| Extra-days approvals | `POST /extraDaysAuthorization/v1/viewExtraDayAuthorizationByUserId` → `/v1/extraDaysAuthorizationacceptreject` | GAP |
| Resignation approvals | `POST /resignation/v1/getAll` → `/resignation/resignationAuthorizationacceptreject` | GAP |
| Unified approval queue | **NOT AVAILABLE — backend endpoint required.** Closest: `GET /userInbox/v1/getUserInboxData` (token uid, all modules except overtime) | GAP |
| Tasks I assigned | `POST /user_tasks/v2/getTaskbyCompany` (createBy = token) | READY |
| Assign task | `POST /user_tasks/v2/add` (multipart) | READY (createBy = token) |
| Nudge assignee | `POST /Tasks_Stages/v1/send-reminder` | READY |
| Team visits | `POST /visit/v1/Team_Visit` | GAP (unscoped; returns every tenant if `userMasterID` omitted) |

**Approval status codes (shared by leave, short leave, comp-off, gate pass):**
- Per-approver row `authstatus`: **2 pending, 1 approved, 0 rejected**.
- Request `authorizationStatus`: **0 no approver configured, 1 pending (Any One/Two/Three), 2 pending (Sequence), 3 approved, 4 rejected, 5 cancelled** (short leave).
- Criteria (by display text): `'Sequeance No'` (sic), `'Any One'`, `'Any Two'`, otherwise Any Three.

---

## 7. Phase 2 APIs

These are **not MVP**. Each has working endpoints but the same identity and approver issues as above.

| Module | Employee endpoints | Manager / approval | Notes |
|---|---|---|---|
| **Expenses** | `POST /userExpense/v2/add` (multipart `attachFile` ×40, 10 MB, jpeg/png/pdf, **token uid**), `/v3/userExpenseNew` (vouchers, token uid), `/v2/userExpenseNew` (lines), `/v1/userExpenseByID`, `/v1/updatebyUserExpenseID`, `/v2/reapply`, `/v1/deleteUserExpenseByExpenseID`; dropdowns `/expensecategory`, `/expensehead`, `/expenseprice` | `/authorizationRequest/v3/getExpenseAuthByUser`, `/v1/authorizationacceptrejectexpenseall` | Line status 0/1/2 pending, 3 approved, 4 rejected, 10 superseded. `filesTobeRemoved` lets the client delete arbitrary server files. |
| **Advances** | `POST /advancePayment/v1/addd {userMasterID, description, amount}`, `/v1/getuserdata` | `/v1/statusreq` (anyone) | `AdvanceStatus` 0/1/2. No approver configured. |
| **Loans** | `POST /loanmaster/v1/addrequest`, `/v1/getLoanByUserId`, `GET /v1/getbyid/:id` | `/v1/changestatusrequest` (anyone) | `/v1/getid/:id` and `/v1/getbyloanid/:id` are SQL-injectable. |
| **Visits** | `POST /visit/v1/getVisitByUserID`, `/v1/add`, `/v1/updatebyid` (check-in/out with client time + lat/long), `/visitformcustomizevalue/v1/addbulk`, `/visitReportCustomizevalue/v1/bulkadd`, `/customer/v1/*`, `/callfollowup/v1/*`, `/toursMaster/v1/*`, `/vehicleUsage/v1/*` | `/visit/v1/Team_Visit` | No visit approval. No server geofence or time check. |
| **Tasks / daily report** | `POST /user_tasks/v3/getTaskbyUser`, `/v1/TaskAcceptReject`, `/v2/postUpdateTaskStage`, `/v1/getNextStageById/:id`, `/taskRemark/v1/*`; `POST /dailyTask/v2/add|update|getAll` | see §6 | `taskStatus` 0 pending, 1 accepted, 2 rejected, 3 completed. Avoid `/user_tasks/v2/getTaskbyUser` (broken). |
| **Assets** | `POST /assignasset/v1/getbyUserID` | — | Read-only; no request/acknowledge flow. |
| **Gate pass (employee)** | `POST /employeeGatepass/addmygatepass`, `PUT /updatebyid/:id`, `GET /v1?userMasterID=`, `POST /v1/update` (check-out/in selfie, multipart `attachment`, jpeg/png, 10 MB), `GET /gatepassauthorization/gatepassrequestdatabyid/:id` | `/gatepassauthorization/*` | Final state is `authorizationStatus` (3/4); `status` string stays `'Pending'`. |
| **Visitor gate pass (host)** | `POST /gatePass/v1/getgatePassuser` | — | Reception feature. |
| **Employee documents** | `POST /compdoc/v1/getbyuserid`, `/userdocument/*`, `GET /policyDocument/v1`, `POST /userLetters/v1/getAllUserLetter`, `POST /hrToolKit/v1/getAll` | — | No acknowledge/read tracking. |
| **Announcements** | `POST /announcement/v1/getbyuserId`, `/v1/countUnreadAnnouncement`, `GET /v1/getbyid/:id` | — | |
| **Help desk** | `GET /ticket/v1`, `GET /ticket/v1/:id`, `POST /ticket/v1` (multipart `attachments` ×5, jpeg/png/mp4, 10 MB), `POST /ticket/v1/:id/updates`, `GET /ticketCategory/v1`, `GET /ticketSubCategory/v1` | `PUT /ticket/v1/:id` (assignee only) | Token-scoped, real HTTP codes. Status `Created/In Progress/On Hold/Closed`. |
| **Mood tracker** | `POST /sentimentPunchIn/v1 {mood}`, `GET /sentimentPunchIn/v1`, `GET /v1/analysis` | — | Moods: `sad, happy, stressed, angry, notSure, ok`. |
| **Anonymous feedback** | `POST /anonymousFeedback/v1/add` | — | Stores the author ID (not actually anonymous). |
| **Performance** | `GET /employeeGoal/v1?userMasterID=`, `PUT /employeeGoal/v1/:id`, `GET /employeeGoalReview/v1?revieweeId=`, `GET /employeePerformanceReview/v1?revieweeId=`, `GET /employeePerformanceReview/v1/:id` | `GET /employeeGoalReview/v1?userMasterID=`, `POST /employeeGoalReview/v1/add-review`, `POST /reviewFormAnswer/v1`, `PUT /employeePerformanceReview/v1/:id {isCompleted:true}` | No reviewer identity check. `PUT /employeeGoalReview/v1` always crashes. |
| **Training / skills** | `POST /companyTraining/v1/listdata` (view only), `POST /monthlySkillsetsform/v1/getbyuserid`, `GET /v1/getbymonthlySkillsetsid/:id`, `POST /v1/addSkillsetsAnswers` | `POST /monthlySkillsetsform/v1/getbyreporttoid`, `/v1/verifySkillsetsAnswers` | `listdata` leaks password hashes. No enrolment. |
| **Resignation** | `POST /resignation/v1/add` (multipart `attachment`), `GET /v1/getResignationByUserId/:id`, `GET /v1/getauthdatabyid/:id` | `/resignation/v1/getAll`, `/resignation/resignationAuthorizationacceptreject` | |
| **Payroll extras** | Form 16, tax regime (`/employeeTaxRegime/v1/*`), investment declarations (`/employeeDeclaration/v1/*`), incentives (`/employeeincentive/v1/getMyIncentive?userMasterID=`), penalties (`POST /emppenalty/v1/getbyuserid`) | — | Never send `declarationFrom` (it self-approves). |
| **Chat** | REST `/userchats/v1/*` + socket.io (§12) | — | Trusts client sender/receiver IDs. |

---

## 8. Complete mobile API catalogue

The machine-readable version is [`docs/mobile-api-inventory.json`](mobile-api-inventory.json). This table lists the endpoints the mobile app will actually call. **Auth** = VT required. **MW** = extra middleware. **Uid** = where the user identity comes from.

| # | Feature | Method | Endpoint | Auth | MW | User types | Uid | Paging | Files | Purpose |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Auth | POST | `/auth/v1/mobilelogin` | No | – | 0,3,4 (not 2) | – | – | – | Login, 365-day JWT |
| 2 | Auth | POST | `/auth/v1/dashboardcheck` | Yes | – | 0 | body | – | – | Bootstrap, version gate, FCM save |
| 3 | Auth | POST | `/auth/v1/finalcheckpermission` | Yes | – | 0 | body | – | – | Role rights for menus |
| 4 | Auth | POST | `/auth/v1/resetpassword` | No | – | 0 | body | – | – | Forced first-login change |
| 5 | Auth | POST | `/auth/v1/changepassword` | Yes | – | 0 | body | – | – | Change password |
| 6 | Auth | POST | `/auth/v1/forgotpasswordOtpMARS` | No | – | 0 | mobile | – | – | Send SMS OTP |
| 7 | Auth | POST | `/auth/v1/checkPasswordTokenMARS` | No | – | 0 | mobile | – | – | Verify SMS OTP |
| 8 | Auth | POST | `/auth/v1/forgot` | No | – | 0 | mobile | – | – | Email OTP (**leaks OTP**) |
| 9 | Auth | POST | `/auth/v1/reset` | No | – | 0 | mobile | – | – | Set new password (**no OTP check**) |
| 10 | Auth | POST | `/auth/v1/userLogout` | Yes | – | 0 | body | – | – | Clear FCM token |
| 11 | Profile | GET | `/auth/v1/profile/:id` | Yes | – | 0 | param | – | photo URL | Profile summary |
| 12 | Profile | GET | `/auth/v1/getprofileWithCutomizeFields/:id` | Yes | – | 0 | param | – | photo URL | Profile summary (masked) |
| 13 | Profile | POST | `/auth/v1/editprofile` | **No** | multer `photo` | 0 | body | – | upload | Change photo |
| 14 | Profile | GET | `/empJoining/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | – | Employment/bank/ID details |
| 15 | Profile | GET | `/empJoining/v1/profileStatus` | Yes | PA+VCP | 0 | query | – | – | Profile completion |
| 16 | Profile | GET | `/useraddress/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | – | Addresses |
| 17 | Profile | POST | `/useraddress/v1/add` | Yes | PA | 0 | body | – | – | Add address (pending HR verify) |
| 18 | Profile | GET | `/userfamily/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | – | Family |
| 19 | Profile | GET | `/usereducation/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | – | Education |
| 20 | Profile | GET | `/userexperience/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | – | Experience |
| 21 | Profile | GET | `/userdocument/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | public URL | ID documents |
| 22 | Profile | POST | `/userdocument/v1/add` | Yes | PA+multer | 0 | body | – | upload `adharPhoto` | Upload ID document |
| 23 | Profile | GET | `/reportto/v1/getbyid/:id` | Yes | – | 0 | param | – | – | My managers |
| 24 | Home | GET | `/auth/v1/birthday` | Yes | – | 0 | token | – | – | Birthdays |
| 25 | Home | GET | `/auth/v1/anniversary` | Yes | – | 0 | token | – | – | Anniversaries |
| 26 | Attendance | POST | `/attendanceTransaction/v2/attendancestatus` | Yes | PA | 0 | body | – | – | Today's state |
| 27 | Attendance | POST | `/attendanceTransaction/v1/attendanceApi` | Yes | PA | 0 | body | – | base64 selfie | Punch in / resume / out |
| 28 | Attendance | POST | `/attendanceTransaction/v1/getcalenderdatamonthwise` | Yes | PA | 0 | body | – | – | Month calendar |
| 29 | Attendance | GET | `/attendanceTransaction/v1/userAttendanceSummary` | Yes | PA | 0 | query | – | – | Month counters |
| 30 | Attendance | POST | `/attendanceTransaction/v1/attendanceData` | Yes | PA | 0 | body | none | – | History (mobile) |
| 31 | Attendance | POST | `/attendanceTransaction/v1/attendanceByUserid` | Yes | PA | 0 | body | page/limit | – | History (paginated) |
| 32 | Attendance | POST | `/attendanceTransaction/v1/getUserLogDateWise` | Yes | PA | 0 | body | – | – | Punch logs of a day |
| 33 | Attendance | POST | `/LastFiveAttendance/v1/getlastfiveattendance` | Yes | – | 0 | body | – | – | Last 5 days |
| 34 | Attendance | GET | `/employeeshift/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | – | Assigned shifts |
| 35 | Attendance | POST | `/shiftRoster/v1/listShiftRosterData` | Yes | – | 0 | body | page/limit | – | Roster |
| 36 | Attendance | POST | `/attendanceCorrectionReason/v1/list` | Yes | – | 0 | – | – | – | Regularization reasons |
| 37 | Attendance | GET | `/attendanceCorrection/v1/getAlldata` | Yes | – | 0 | query | – | – | Current logs for a day |
| 38 | Attendance | POST | `/attendanceCorrectionRequest/v1/add` | Yes | – | 0 | body | – | – | Request regularization |
| 39 | Attendance | POST | `/attendanceCorrectionRequest/v1/getByUserId` | Yes | – | 0 | body | page/limit | – | My regularizations |
| 40 | Attendance | POST | `/Tracking/v1/savedatabulk` | Yes | PA | 0 | **token** | – | – | Background location batch |
| 41 | Attendance | POST | `/overTime/v1/getOvertimeDataUserwise` | Yes | PA | 0 | body | page/limit | – | Approved OT |
| 42 | Attendance | POST | `/overTime/v1/getPendingOvertimedata` | Yes | PA | 0 | body | none | – | Pending OT |
| 43 | Leave | GET | `/userleave/v1/getUserLeaveBalance` | Yes | PA | 0 | query | – | – | Balances |
| 44 | Leave | GET | `/hrleavetypes/v1/getDataWithoutOutDuty/:id` | Yes | – | 0 | – | – | – | Leave types |
| 45 | Leave | POST | `/userleave/v2/bulk/add` | Yes | multer+PA | 0 | indexed body | – | upload `attachment` ×10 | Apply leave |
| 46 | Leave | POST | `/userleave/v2/LeaveByUser` | Yes | PA | 0 | body | page/limit | attachment URL | History + status |
| 47 | Leave | GET | `/leaveauthorizationRequest/v1/getAuthorizationRequestByReferanceId/:id` | Yes | PA | 0 | – | – | – | Approval trail |
| 48 | Leave | GET | `/leaveauthorizationRequest/v1/leaveAuthCriteria/:id` | Yes | PA | 0 | param | – | – | My approvers |
| 49 | Leave | GET | `/userleave/v1/delete/:id` | Yes | PA | 0 | – | – | – | Withdraw leave |
| 50 | Leave | POST | `/userleave/v1/update` | Yes | multer+PA | 0 | body | – | upload | Edit leave |
| 51 | Leave | POST | `/leaveauthorizationRequest/v1/leavecancellist` | Yes | PA | 0 | body | page/limit | – | Cancellable days |
| 52 | Leave | POST | `/leaveauthorizationRequest/v1/leavecancel` | Yes | PA | 0 | body | – | – | Cancel an approved day |
| 53 | Leave | GET | `/empholidaypolicy/v1/getbyuserid/:id` | Yes | PA | 0 | param | – | – | Holiday policy |
| 54 | Leave | GET | `/holidayspolicy/v1/getbyid/:id` | Yes | – | 0 | – | – | – | Holiday list |
| 55 | Leave | GET | `/userleave/v1/getOptionalLeaveByUserId` | Yes | – | 0 | query | – | – | Optional holidays |
| 56 | Leave | POST | `/userShortLeave/v1/add` | Yes | – | 0 | body | – | – | Apply short leave |
| 57 | Leave | POST | `/userShortLeave/v1/listDataByUser` | Yes | – | 0 | body | page/limit | – | My short leaves |
| 58 | Leave | GET | `/coffMaster/v1/getCoffDataByUserMasterID` | Yes | PA | 0 | query | page (buggy) | – | Comp-offs |
| 59 | Payslip | POST | `/salaryTrans/v1/getUserWiseSalarySlip` | Yes | PA | 0 | body | – | base64 PDF | Payslip PDF (main payroll) |
| 60 | Payslip | GET | `/paySlipGenerator/v1/getMyPaySlipData` | Yes | – | 0 | **token** | – | public PDF URL | Payslip list (generator) |
| 61 | Payslip | GET | `/report/v1/getPreviousfinancialYear` | Yes | PA | 0 | – | – | – | Form 16 FY list |
| 62 | Payslip | POST | `/report/v1/form16Report` | Yes | PA | 0 | body | – | base64 PDF | Form 16 PDF |
| 63 | Notifications | GET | `/userInbox/v1/getUserInboxData` | Yes | VCP | 0 | **token** | page/limit | – | Action inbox |
| 64 | Notifications | POST | `/announcement/v1/getbyuserId` | Yes | PA | 0 | body | page/limit | public URL | Announcements (marks read) |
| 65 | Notifications | POST | `/announcement/v1/countUnreadAnnouncement` | Yes | PA | 0 | body | – | – | Unread badge |
| 66 | Documents | POST | `/compdoc/v1/getbyuserid` | Yes | PA | 0 | body | page/limit | public URL | HR documents |
| 67 | Documents | GET | `/policyDocument/v1` | Yes | VCP | 0 | token company | page/pageSize | public URL | Policies |
| 68 | Documents | POST | `/userLetters/v1/getAllUserLetter` | Yes | – | 0 | body | – | public URL | Letters |
| 69 | Manager | GET | `/reportTo/v1/reportstoImmediateChild` | Yes | – | 0 (manager) | query | page/limit | – | My team + today's attendance |
| 70 | Manager | POST | `/reportTo/v1/reportstowithoutchilddatewise` | Yes | PA | 0 (manager) | body | – | – | Team attendance by date |
| 71 | Manager | POST | `/leaveauthorizationRequest/v1/countpending` | Yes | PA | 0 (manager) | body | – | – | Pending counts |
| 72 | Manager | POST | `/leaveauthorizationRequest/v2/listLeaveAuthRequestNew` | Yes | PA | 0 (approver) | body | page/limit | – | Pending leave approvals |
| 73 | Manager | GET | `/leaveauthorizationRequest/v1/leavedetails/:id` | Yes | PA | 0 (approver) | – | – | – | Leave day breakdown |
| 74 | Manager | POST | `/leaveauthorizationRequest/v1/authorizationacceptreject` | Yes | PA | 0 (approver) | none checked | – | – | Approve / reject leave |
| 75 | Manager | POST | `/shortLeaveAuthorization/v1/listShortLeaveAuthRequest` | Yes | – | 0 (approver) | body | page/limit | – | Pending short leaves |
| 76 | Manager | POST | `/shortLeaveAuthorization/v1/shortLeaveAcceptReject` | Yes | – | 0 (approver) | none checked | – | – | Decide short leave |
| 77 | Manager | POST | `/attendanceCorrectionAuthorization/listAttendaceAuthorization` | Yes | PA | 0 (approver) | body | page/limit | – | Pending regularizations |
| 78 | Manager | POST | `/attendanceCorrectionAuthorization/attendancecorrectionauthorizationrequest` | Yes | PA | 0 (approver) | none checked | – | – | Decide regularization |
| 79 | Manager | POST | `/gatepassauthorization/gatepassauthorizationrequest` | Yes | PA | 0 (approver) | body | page/limit | – | Pending gate passes |
| 80 | Manager | POST | `/gatepassauthorization/authorizationacceptreject` | Yes | PA | 0 (approver) | none checked | – | – | Decide gate pass |
| 81 | Manager | POST | `/authorizationRequest/v1/viewauthorizationrequestbyuseridforovertime` | Yes | PA | 0 (approver) | body | page/limit | – | Pending OT |
| 82 | Manager | POST | `/authorizationRequest/v1/authorizationacceptrejectovertime` | Yes | PA | 0 (approver) | none checked | – | – | Decide OT |
| 83 | Manager | POST | `/authorizationRequest/v3/getExpenseAuthByUser` | Yes | PA | 0 (approver) | – | page/limit | – | Pending expenses |
| 84 | Manager | POST | `/authorizationRequest/v1/authorizationacceptrejectexpenseall` | Yes | PA | 0 (approver) | **token** | – | – | Decide expenses |
| 85 | Manager | POST | `/AuthorizationDetails/v1/getAuthList` | Yes | PA | 0 | body | – | – | "Do I approve anyone?" |
| 86 | Tasks | POST | `/user_tasks/v3/getTaskbyUser` | Yes | PA | 0 | body | page/limit | public URL | My tasks |
| 87 | Tasks | POST | `/user_tasks/v1/TaskAcceptReject` | Yes | PA | 0 | none | – | – | Accept / reject task |
| 88 | Tasks | POST | `/user_tasks/v2/postUpdateTaskStage` | Yes | PA | 0 | none | – | – | Advance stage |
| 89 | Tasks | POST | `/user_tasks/v1/getTaskReport` | Yes | PA | 0 | body | – | – | Task counts |
| 90 | App | GET | `/appversion/v1/getalldata` | Yes | – | 0 | – | – | – | Current app versions |

Phase 2 endpoints (expenses, visits, gate pass, help desk, PMS, etc.) are listed in §7 and in the JSON inventory.

---

## 9. Request / response examples

All values are sanitized. IDs, names and numbers are fictional. `<JWT>` stands for the token.

### 9.1 Login
See §2.2.

### 9.2 Employee profile — `GET /auth/v1/profile/345`
```json
{
  "status": 200,
  "message": "…",
  "data": {
    "name": "Asha Patel", "firstName": "Asha", "lastName": "Patel",
    "userNumber": "9876500001", "email": "asha.patel@example.com",
    "dob": "1994-05-12", "employeeCode": "EMP0042",
    "profile": "https://api.example.com/uploads/user/photo/photo_1726000000000.jpeg",
    "isPhotoLock": 0,
    "companyName": "Example Industries Pvt Ltd",
    "designation": "Sales Executive", "department": "Sales", "branch": "Ahmedabad HQ",
    "address": { "houseNumber": "12", "houseName": "Shanti Niwas", "landmark": "Near Park",
                 "area": "Navrangpura", "zipcode": "380009", "city": "Ahmedabad" }
  }
}
```

### 9.3 Dashboard bootstrap — `POST /auth/v1/dashboardcheck`
See §2.4.

### 9.4 Today's attendance — `POST /attendanceTransaction/v2/attendancestatus`
Request: `{ "userMasterID": 345 }`
```json
{
  "status": 200,
  "message": "…",
  "data": {
    "In_Data":  { "logDateTime": "2026-09-23T09:02:11+05:30", "direction": "in",  "address": "SG Road, Ahmedabad" },
    "Out_Data": null
  },
  "continuePunchIN": false
}
```
After `missPunchMinutes` without a punch-out, `Out_Data.address` is `"Missed Punch Out"`.

### 9.5 Check-in — `POST /attendanceTransaction/v1/attendanceApi`
```json
{
  "userMasterID": 345,
  "direction": "in",
  "newpunchin": true,
  "attendnaceFrom": "mobile",
  "latitude": "23.0225",
  "longitude": "72.5714",
  "address": "SG Road, Ahmedabad",
  "photo": "<raw base64 PNG/JPEG, no data: prefix, or empty string>",
  "createBy": 345,
  "createByIp": ""
}
```
- `newpunchin` must be the JSON boolean `true` for a new day. Sending `false` means "resume after a break".
- The field name really is `attendnaceFrom` (misspelled). Always send `"mobile"`.
- `latitude`, `longitude`, `address`, `photo` are NOT NULL in `attendancelogs`. Send `""` if unavailable, or the log insert fails after the transaction is created.

Success: `{ "status": 200, "message": "PunchIn successfully." }`
Errors (HTTP 200): `{status:401, message:"You are not in attendance area."}`, `{status:401, message:"Branch not assigned"}`, `{status:401, message:"You have already punch IN and Punch OUT for today"}`.

### 9.6 Check-out — same endpoint
```json
{ "userMasterID": 345, "direction": "out", "attendnaceFrom": "mobile",
  "latitude": "23.0226", "longitude": "72.5713", "address": "SG Road, Ahmedabad",
  "photo": "", "createBy": 345, "createByIp": "" }
```
Success: `{ "status": 200, "message": "PunchOut successfully.", "data": {} }`
Error: `{ "status": 401, "message": "Sorry, You have missed your Punch-Out timeline for today!" }`

### 9.7 Attendance history — `POST /attendanceTransaction/v1/getcalenderdatamonthwise`
Request: `{ "userMasterID": 345, "calendarstartdate": "2026-09-01", "calendarenddate": "2026-09-30" }`
```json
{
  "status": 200,
  "data": [
    { "date": "2026-09-01", "title": "Present", "EmployeeCode": "EMP0042", "userMasterId": 345,
      "inTime": "09:02", "outTime": "18:10", "shift": "General", "shiftName": "General",
      "shiftInTime": "09:00", "shiftOutTime": "18:00", "shiftHours": "09:00",
      "inHours": "08:38", "outHours": "00:30", "lateBy": "00:02", "earlyBy": "00:00",
      "branchName": "Ahmedabad HQ", "otStatus": null, "remarks": null },
    { "date": "2026-09-06", "title": "Week Off" },
    { "date": "2026-09-10", "title": "Casual Leave" }
  ]
}
```
`title` values include `Present`, `Half Day`, `Absent`, the leave name, weekoff/holiday names, and shift names for future days.

### 9.8 Leave balance — `GET /userleave/v1/getUserLeaveBalance?companyMasterID=12&userMasterID=345`
```json
{ "status": 200, "data": [
  { "leaveName": "CL", "LeaveDesc": "Casual Leave", "LeaveTranId": 81, "Leave_CF": "No", "LeaveID": 2, "Balance": 4.5 },
  { "leaveName": "SL", "LeaveDesc": "Sick Leave",   "LeaveTranId": 82, "Leave_CF": "No", "LeaveID": 3, "Balance": 6 }
] }
```

### 9.9 Apply leave — `POST /userleave/v2/bulk/add` (multipart/form-data)
One request can hold several leaves. Suffix `0` is the first leave.
```
LeaveTranId0   = 81
userMasterID0  = 345
companyMasterID0 = 12
FromDate0      = 2026-10-05
ToDate0        = 2026-10-06
LeaveDays0     = 2
DayType0       = Full Day
Remark0        = Family function
isattachment0  = yes
createByIp0    =
attachment     = <file: invitation.pdf>   (jpeg/png/jpg/pdf, ≤10 MB, matched in order to entries with isattachment=yes)
```
Success: `{ "status": 200, "message": "…" }` (the new leave ID is **not** returned — refresh the history list).
Errors: `{status:401, message:"…"}` for balance, policy, overlap or missing-attachment rules; HTTP 400 `{message}` for a bad file.

### 9.10 Leave history — `POST /userleave/v2/LeaveByUser`
Request: `{ "userMasterID": 345, "page": 1, "limit": 20, "startdate": "2026-04-01", "enddate": "2027-03-31", "searchQuery": "" }`
```json
{ "status": 200, "totalcount": 1, "data": [
  { "UserLeaveApplicationID": 9001, "FromDate": "2026-10-05", "ToDate": "2026-10-06",
    "LeaveDays": 2, "DayType": "Full Day", "Remark": "Family function",
    "authorizationStatus": 2, "attachment": "1727000000000.pdf",
    "hrLeaveType": { "LeaveMaster": { "LeaveName": "Casual Leave" } },
    "userLeaveTransactions": [],
    "approvedLeaveAuthorizations": [] }
] }
```
Attachment URL: `${APIURL}uploads/employee-leave-attachment/<attachment>`.

### 9.11 Payslip list
- **PaySlip Generator:** `GET /paySlipGenerator/v1/getMyPaySlipData`
```json
{ "status": 200, "totalcount": 2, "data": [
  { "yearMonth": "202608", "payrollFrequency": "Monthly", "startDate": "2026-08-01", "endDate": "2026-08-31",
    "path": "uploads/PaySlips/12/1725180000000-345.pdf" }
] }
```
- **Main payroll:** NOT AVAILABLE. The app must probe `getUserWiseSalarySlip` month by month, or wait for the PROPOSED `/salaryTrans/v1/mySalarySlipMonths` (§14).

### 9.12 Payslip download — `POST /salaryTrans/v1/getUserWiseSalarySlip`
Request: `{ "userMasterID": 345, "yyyymm": "202608" }` (never send `status`)
```json
{ "status": 200, "message": "…",
  "data": { "userMasterID": 345, "salaryYYYYMM": "202608", "salarySlipIssue": 1, "paid": true,
            "path": "JVBERi0xLjQKJ…(base64 PDF)…" } }
```
If the slip is not issued, `data` is empty/null. Decode `data.path` to a file (§10.3).

### 9.13 Notifications — `GET /userInbox/v1/getUserInboxData?page=1&limit=20`
```json
{ "status": 200, "totalcount": 1, "data": [
  { "id": 5501, "activityTable": "LeaveAuthorizationRequest", "activityTablePK": 7702,
    "message": "Asha Patel applied for Casual Leave from 05-10-2026 to 06-10-2026",
    "companyMasterID": 12, "assignedTo": 210, "assignedBy": 345, "createdAt": "2026-09-23T10:15:00+05:30" }
] }
```

### 9.14 Manager team — `GET /reportTo/v1/reportstoImmediateChild?userMasterID=210&date=2026-09-23&page=1&limit=20`
```json
{ "status": 200, "childCount": 1, "data": {
  "currentUser": { "userMasterID": 210, "displayName": "Ravi Shah", "photo": "photo_1.jpeg",
                   "employeeJoiningDetails": [ { "employeeCode": "EMP0007" } ] },
  "child": [
    { "reportToID": 210, "userMasterID": 345,
      "employee": { "displayName": "Asha Patel", "userNumber": "9876500001", "photo": "photo_2.jpeg",
                    "employeeDesignations": [ { "designation": { "designationName": "Sales Executive" } } ],
                    "employeeDepartments":  [ { "department":  { "departmentName": "Sales" } } ],
                    "employeeBranches":     [ { "branchMaster":{ "branchName": "Ahmedabad HQ" } } ],
                    "attendanceTransactions": [ { "AttendanceTransID": 88001, "InDatetime": "2026-09-23T09:02:11+05:30",
                                                  "OutDateTime": null, "fulldayhalfday": null } ] } }
  ] } }
```

### 9.15 Approval queue — `POST /leaveauthorizationRequest/v2/listLeaveAuthRequestNew`
Request: `{ "userMasterID": 210, "status": 2, "page": 1, "limit": 20, "startdate": "", "enddate": "", "user": [] }`
```json
{ "status": 200, "totalcount": 1, "data": [
  { "AuthorizationRequestId": 7702, "ReferenceID": 9001, "authstatus": 2, "viewstatus": 0,
    "rejectionRemarks": null, "createdAt": "2026-09-23T10:15:00+05:30",
    "userLeave": { "UserLeaveApplicationID": 9001, "FromDate": "2026-10-05", "ToDate": "2026-10-06",
                   "LeaveDays": 2, "authorizationStatus": 2,
                   "userMaster": { "displayName": "Asha Patel", "photo": "photo_2.jpeg" },
                   "hrLeaveType": { "LeaveMaster": { "LeaveName": "Casual Leave" } } } }
] }
```

### 9.16 Leave approval — `POST /leaveauthorizationRequest/v1/authorizationacceptreject`
Approve (the web app builds `leavetransaction` from `GET /leaveauthorizationRequest/v1/leavedetails/9001`):
```json
{ "AuthorizationRequestId": 7702, "ReferenceID": 9001, "authstatus": 1, "rejectionRemarks": "",
  "leavetransaction": [
    { "ReferenceID": 9001, "userMasterID": 345, "LeaveTranId": 81, "days": 1, "date": "2026-10-05", "issandwichleave": "No" },
    { "ReferenceID": 9001, "userMasterID": 345, "LeaveTranId": 81, "days": 1, "date": "2026-10-06", "issandwichleave": "No" }
  ] }
```
Reject: `{ "AuthorizationRequestId": 7702, "ReferenceID": 9001, "authstatus": 0, "rejectionRemarks": "Quarter-end freeze" }`
Response: `{ "status": 200, "message": "…", "data": {} }`.
**Warning:** the server trusts `leavetransaction[]` and does not check that the caller is the approver (see §13 and §14 P0).

---

## 10. File handling

### 10.1 Uploads relevant to mobile

| Use | Endpoint | Field | Destination | Types | Max size |
|---|---|---|---|---|---|
| Profile photo | `POST /auth/v1/editprofile` | `photo` (single) | `uploads/user/photo/` | not filtered | none |
| Selfie punch | `POST /attendanceTransaction/v1/attendanceApi` | JSON `photo` (base64) | `uploads/attendaceLogs/<company>/<MMYYYY>/` | not checked | 500 MB body limit |
| Face enrolment | `POST /empJoining/v1/updateUserFaces` | `userFaces` (×5) | `uploads/user-faces/` | jpeg, png | 10 MB |
| Leave attachment | `POST /userleave/v2/bulk/add`, `/v1/update` | `attachment` (×10) | `uploads/employee-leave-attachment/` | jpeg, png, jpg, pdf | 10 MB |
| Expense receipt | `POST /userExpense/v2/add`, `/v1/updatebyUserExpenseID`, `/v2/reapply` | `attachFile` (×40) | `uploads/user-Expense/` | jpeg, png, jpg, pdf | 10 MB |
| ID document | `POST /userdocument/v1/add` | `adharPhoto` (controller ignores `panPhoto`) | `uploads/user/document/` | not filtered | none |
| Education proof | `POST /usereducation/v1/add` | `degree` | `uploads/user/degree/` | not filtered | none |
| Investment proof | `POST /employeeDeclaration/v1/add` | `attachments` (×10) | `uploads/employee-declaration-attachments/` | not filtered | 10 MB |
| Gate-pass selfie | `POST /employeeGatepass/v1/update` | `attachment` (×1) | `uploads/employee-gatepass/` | jpeg, png | 10 MB |
| Task attachment | `POST /user_tasks/v2/add` | `attachment` (×10) | `uploads/task/` | jpeg, png, jpg, pdf, doc, docx | 10 MB |
| Daily report | `POST /dailyTask/v2/add` | `attachment` (×10) | `uploads/dailyTask/` | not filtered | none |
| Help-desk ticket | `POST /ticket/v1`, `/v1/:id/updates` | `attachments` (×5) | `uploads/ticket-attachments/` | jpeg, png, mp4 | 10 MB |
| Resignation | `POST /resignation/v1/add` | `attachment` | `uploads/resignation/` | not filtered | none |
| Chat file | `POST /userchats/v1/postSendMessage` | `path` | `uploads/chatfile/` | not filtered | none |

Multer errors → HTTP 400 `{message}`. Filenames are `<field>_<Date.now()>.<ext>` or `<Date.now()><ext>`.

### 10.2 Downloads

| What | How | Auth |
|---|---|---|
| Any stored upload (photos, leave/expense attachments, documents, announcements) | `GET ${APIURL}uploads/<subdir>/<filename>` | **None — public** |
| Payslip (main payroll) | base64 in `data.path` of `getUserWiseSalarySlip` | Token (but IDOR) |
| Payslip (generator) | `GET ${APIURL}uploads/PaySlips/<company>/<file>.pdf` | **None — public** |
| Form 16 | base64 in `data` of `/report/v1/form16Report` | Token |
| Letters | `GET ${APIURL}uploads/letter/<type>_<userMasterID>.pdf` (**predictable names**) | **None — public** |
| Goal review report | `GET /employeeGoalReview/v1/report?employeeGoalId=` → `application/pdf` stream | Token |
| Ticket attachments | stored as **absolute server paths**; strip everything before `uploads/` | None |
| Gate-pass selfie | stored as **absolute server path**; same fix | None |

`APIURL` is the env value the backend uses to build URLs (e.g. profile photo: `${APIURL}uploads/user/photo/<photo>`). Configure the same base in the app.

### 10.3 React Native guidance
- **Upload:** use `FormData` with `{ uri, name, type }` parts. Do **not** set `Content-Type` manually (let the client add the boundary). Keep the JWT header. Compress images client-side (the backend has no resize).
- **Base64 PDFs (payslip, Form 16):** write `data.path` (or `data`) to the cache directory with a filesystem library, then open with the OS viewer or share sheet. Payloads can be several MB; show a spinner and avoid storing them in Redux/state.
- **Public URLs:** load with the plain URL (no auth header needed today). Treat them as sensitive: do not log or share them. If §14 authenticated downloads are added, switch to header-authenticated downloads.
- **Selfie punch:** send raw base64 without the `data:image/...;base64,` prefix. Downscale to ~640 px / quality 0.6 to keep the body small.

---

## 11. Attendance / location analysis

### 11.1 What exists (CURRENT)

| Capability | Exists? | Details |
|---|---|---|
| GPS lat/long on punches | **Yes** | `attendancelogs.latitude`, `longitude`, `address` (NOT NULL strings) (`models/attendancelogs.js`). `attendanceTransaction` stores only `punchINbranch`/`punchOUTbranch` and `locationTypeIN`/`OUT` (`'branch'`/`'workinglocation'`). |
| Geofencing | **Yes, server-side** | `getBranchByLatLong` (`utils/commonUtilFunctions.js:9977-10111`): haversine vs `branchMaster.latitude/longitude/radius` (metres), then the employee's `workingLocation` rows. Branch set chosen by policy `attBrType` (`all`/`selected`/`assigned`). |
| Geofence bypasses | Yes | `attendnaceFrom:"web"` (client-controlled) skips it; policy `outsidePunchInPunchOut=1`; a `datewiseAttendancepolicy` exemption row. |
| Office location master | Yes | `/branchmaster` (lat, long, radius), `/workingLocation` (name, address, lat, long, radius), `/employeeWorkingLocation` |
| Device info | Partial | `userMaster.uniqueID`, `deviceType`, `firebaseToken` — stored, **not enforced**, not on punch rows |
| IP address | Partial | `x-forwarded-for` copied to `req.userDetails.userIpAddress`; `createByIp` sent by client. `/userIp` CRUD exists but **nothing enforces it**. |
| Biometric devices | Yes | MSSQL pull (`/biometric/v1/biometricsync`), eTimeOffice APIs, device push (`/biometricDataTransfer`), AI devices (`/aibiometric`). Employee mapping: `employeeJoiningDetails.biometricCode`, `biometricSerialNo`, `attendanceFrom` (`mobile`/`biometric`/`mobileandbiometric`). |
| Mobile attendance | Yes | `POST /attendanceTransaction/v1/attendanceApi` is the only mobile punch endpoint. |
| Selfie attendance | Partial | base64 `photo` stored as PNG. Policy flags `selfieAttendance`, `selfieWithFaceDetection` are returned by `dashboardcheck` but **not enforced by the server**. |
| Face match | Partial | `POST /empJoining/v1/checkUserFaces {userFace, userMasterID}` → proxies to `FACE_API_URL`. The result is **not bound to the punch**. |
| Punch source | Yes | `attendancelogs.attendnaceFrom`: `web`, `mobile`, `biometric`, `manual`, `excel`, `canteen` (client sends `mobile`) |
| Timestamps | Server | `attendanceApi` uses `new Date()` (good). `/attendancelogs/v1/add` and `/Tracking` trust client time. |
| Mock-location detection | No | Only tracking points carry `developerMode`. |
| Live tracking | Yes | `POST /Tracking/v1/savedatabulk` (token uid) with `{tracking:[{Lattitude, Longitude, Address, Track_datetime, Battery, Gps, Wifi, Mobile_name, type, developerMode, geofence}]}`; socket `register`/`punch_out` for online status; config via `/usertracking` (`trackingTime`, `statusMonitoring`, `notifyReportTo`). |
| `attendanceFrom` enforcement | No | A biometric-only employee can still punch from mobile. |

### 11.2 Mobile check-in call sequence (CURRENT)
1. `dashboardcheck` → read `attendancepolicy` (`selfieAttendance`, `selfieWithFaceDetection`, `outsidePunchInPunchOut`, `missPunchMinutes`) and `attendanceFrom`. Hide punch UI if `attendanceFrom == "biometric"`.
2. `attendancestatus` → decide which button to show (In / Resume / Out).
3. Get a high-accuracy location fix and reverse-geocode an address (client-side).
4. If `selfieAttendance == 1`, capture a selfie. If `selfieWithFaceDetection == 1`, call `checkUserFaces` first and block on failure (**client-side only**).
5. `attendanceApi` (§9.5 / §9.6).
6. If `tracking == true`: start background location, batch to `savedatabulk` every `trackingInterval`, and emit socket `register {userId}`; on punch-out emit `punch_out {userId}`.

## Mobile Attendance Gap

Backend changes needed for a **secure** mobile check-in/check-out (none exist today):

1. **Take the punching user from the token** in `attendanceApi` (ignore body `userMasterID`, `createBy`). Today any employee can punch for a colleague ("buddy punching").
2. **Reject `attendnaceFrom:"web"` from mobile clients** (e.g. require a server-known client type), so the geofence cannot be skipped.
3. **Enforce `employeeJoiningDetails.attendanceFrom`** (`biometric` users cannot punch from mobile).
4. **Enforce the selfie / face policy on the server**: when `selfieAttendance=1` reject punches without a photo; when `selfieWithFaceDetection=1` run the face match server-side (or accept a signed, short-lived face-check token) inside the punch request.
5. **Validate coordinates**: numeric range, required accuracy (`accuracy` metres field), and a mock-location flag.
6. **Store device/context on each punch**: `deviceId` (bound to `userMaster.uniqueID`), `platform`, `appVersion`, `isMock`, `accuracy`, raw `latitude/longitude` on `attendanceTransaction`.
7. **Device binding**: optional policy to allow punches only from the registered `uniqueID`.
8. **Fix punch-out and resume** to target *today's open* transaction instead of "the latest transaction" (a double punch-out currently overwrites the time; resume can reopen an old day).
9. **Accept the selfie as multipart** with type/size limits, and serve selfies through an authenticated endpoint.
10. **Enforce the IP allow-list** (`/userIp`) if the tenant has one, using the real client IP (not `x-forwarded-for` from the client).
11. **Authenticate `/biometric/*`, `/biometricDataTransfer/*` and `/tpMirror/*`** (currently open; `addManualLog` lets anyone forge attendance, `tpMirrorConvertImage` writes arbitrary files).

---

## 12. Notification analysis

### 12.1 Push (FCM) — exists
- `firebase-admin` 13, HTTP v1 `messaging().send()` (`utils/commonUtilFunctions.js:7708 sendNotification`, `:33794 sendNotification_NEW`), bulk `sendEachForMulticast` for crons.
- Two Firebase apps: Android/default and iOS, chosen by `userMaster.deviceType === 'ios'` (`config/firebase.js`). Credentials come from env/JSON files that are gitignored.
- **Device token registration:** `mobilelogin` (`firebaseToken`) and `dashboardcheck` (`FirebaseToken`, `deviceType`). **One token per user** — the last device wins. `userLogout` clears it.
- Message shape:
```js
{ token,
  notification: { title, body },
  data: { screen: "leaveauth", isScheduled: "true", scheduledTime: "2026-09-23T10:15:00.000Z", /* sometimes senderID or ID */ },
  apns: { payload: { aps: { alert: { title, body }, sound: "default", badge: 1 } } },
  android: { priority: "high", ttl: 86400000 } }
```
No Android `channelId` is set; badge is always 1.

### 12.2 Deep-link targets (`data.screen` values in code)

| screen | Meaning | Suggested RN route |
|---|---|---|
| `home` | tracking dropped while punched in | Home |
| `chat` (+`senderID`) | new chat message | Chat thread |
| `announcement` | new announcement | Announcements |
| `leave` | my leave decided | Leave history |
| `leaveauth` | leave awaiting my approval | Approvals › Leave |
| `outDoorDutyAuth` | outdoor duty awaiting approval | Approvals › Outdoor duty |
| `shortLeaveAuth` | short leave awaiting approval | Approvals › Short leave |
| `coffauth`, `CompensatoryOffAuth` | comp-off awaiting approval | Approvals › Comp-off |
| `extradaysauth` | extra days awaiting approval | Approvals › Extra days |
| `attendanceCorrectionauth` | regularization awaiting approval | Approvals › Regularization |
| `gatepass`, `gatepassadmin` | gate pass events | Gate pass |
| `gatepassauth` | gate pass awaiting approval | Approvals › Gate pass |
| `expense` | my expense decided | Expenses |
| `expenserequest`, `officeexpenserequest` | expense awaiting approval | Approvals › Expenses |
| `task` | task assigned/updated | Tasks |
| `visit`, `tour` | visit/tour assigned | Visits |
| `resignationAuthorizations`, `resignationAuthorization` | resignation approval | Approvals › Resignation |
| `skillsetAuth`, `myskillset` | skill form verify / verified | Skills |
| `trackingOutside` | team member left the geofence | Team › Member |
| `ticketraise`, `ticketstatus` (+`ID`) | help-desk | Help desk (note: `ticketraise` push likely fails; numeric `ID`) |
| `preboarding`, `hrpreboarding` | pre-boarding | not in mobile MVP |

Match case-insensitively; fall back to Home. Punch-in/out and holiday reminder pushes carry **no** `screen`.

### 12.3 In-app
- **Inbox** (`/userInbox/v1/getUserInboxData`, token-scoped): acts as a pending-action queue; rows are deleted when a request is decided; **no read/unread**.
- **Announcements**: `readstatus` per user; fetching the feed marks all as read; `countUnreadAnnouncement` for the badge.
- **Chat**: REST `/userchats/v1/postSendMessage` (persists + push), `/v1/getuserList`, `/v1/getuserWiseChat` (marks read); socket.io on **port 3210**, connect with `io(URL, { query: { Authorization: "Bearer <jwt>" } })`; events `signin`, `listSignin`, `message`, `deleteMessage`, `listDisconnect`; server emits `message`, `deleteMessage`, `botEvent`. The socket does not persist messages — call REST first.
- **Chatbot**: socket event `chatbot` → `botEvent` with HTML replies containing **web** links (`${appURL}#/app/...`) the app must intercept.
- **Scheduled reminders**: punch-in/punch-out/holiday pushes via `companyNotificationSetup` + crons (production only).

### 12.4 Email / SMS
- Email via nodemailer (global SMTP from env + per-company SMTP from `/notificationPolicy`). Used for OTP, leave, expense, letters, reports.
- SMS only for the MARS forgot-password OTP.

### 12.5 What the React Native app needs
1. `@react-native-firebase/messaging` (Android + iOS/APNs) with the **same Firebase projects** as the backend credentials.
2. Send the FCM token in `mobilelogin` and on every `dashboardcheck`; re-send on token refresh.
3. Create an Android notification channel client-side (the server sends none).
4. Route taps via `data.screen` (table above).
5. For chat, open the socket on port 3210 only while the chat screens are visible.
6. Accept that only the **last logged-in device** receives pushes (backend limitation; §14 P1).

---

## 13. API security review for mobile

A native app makes the API easy to call directly, so these issues matter more once it ships. Findings are grouped by severity. File references are for the backend team.

### Existing protection
- JWT required on almost all business routes (`verifyToken`), with user and company `status` re-checked on every request.
- bcrypt password hashing (`bcrypt.compareSync`).
- `permissionAccess` blocks **cross-tenant** access when the client sends `companyMasterID` / `branchMasterID` / `userMasterID` under those exact names on JSON routes.
- Several newer endpoints use the token user: `/Tracking/v1/savedatabulk`, `/userExpense/v2/add`, `/userExpense/v3/userExpenseNew`, `/paySlipGenerator/v1/getMyPaySlipData`, `/userInbox/v1/getUserInboxData`, `/ticket/*`, `/sentimentPunchIn/v1`, `/authorizationRequest/v1/authorizationacceptrejectexpenseall`, `/officeExpenseAuthRequest/*`.
- Punch timestamps in `attendanceApi` come from the server clock; a server-side geofence exists.
- Payslip publish flag (`salarySlipIssue`) on `getUserWiseSalarySlip` when `status` is omitted.
- Secrets (`.env`, Firebase keys) and `uploads/` are gitignored.
- Some upload routes use `configureMulter` with type/size limits (leave, expense, tasks v2, gate pass, tickets, policies).

### Critical — fix before any production mobile launch
| # | Issue | Where |
|---|---|---|
| C1 | **Account takeover by mobile number:** `/auth/v1/reset {mobile,new_password}` sets any password with no OTP; `/auth/v1/forgot` returns the OTP in the response; `/auth/v1/changepasswordMultipleEmp` (no auth) resets any list of accounts. | `auth.controller.js:1039-1162`, `auth.router.js` |
| C2 | **Arbitrary SQL for any logged-in user:** `POST /common/v1/query {query}` and `/common/v1/getview`. | `common.controller.js` |
| C3 | **Mass password reset:** `POST /companycontact/v1/changeallpassword` (any token, all tenants). | `companycontact.router.js:74-78` |
| C4 | **Privilege escalation:** client-controlled `admin` on `/companycontact/v1/add` (multipart → PA skipped) can create `admin=2`; `/roleMaster/v1/AssignRoleMaster` and `/rolePermission/v1/changePermissionData` have no caller check. | `companyContact.controller.js:397` |
| C5 | **Approvals not bound to the approver:** leave, short leave, comp-off, attendance correction, gate pass, overtime, extra days, resignation, advance, loan accept/reject endpoints never check that the caller is the assigned approver or that the request is still pending; leave approval trusts a client-built `leavetransaction[]`. Employees can approve their own requests. | `leaveAuthorization.controller.js:1491+` and peers |
| C6 | **Payroll exposure:** `GET /salaryTrans/v1/getAllSalarySlip` lets any employee download a ZIP of the company's payslips (issued or not); `status:"01"` bypasses the publish flag; `issueSalarySlip`, salary generation/deletion have no role check. | `hrSalaryTransaction.controller.js:8318,8923,9680` |
| C7 | **Unauthenticated attendance/file writes:** `/biometric/*` (e.g. `addManualLog`), `/biometricDataTransfer/*`, `/tpMirror/v1/tpMirrorConvertImage` (client-chosen file path). | `router.js` mounts without VT |
| C8 | **SQL injection** in endpoints reachable by any employee, e.g. `/salaryTrans/v1/salaryslipuserwise`, `/hrSalaryMaster/v1/getbyid/:id`, `/loanmaster/v1/getid/:id`, `/attendanceTransaction/v1/getAttendanceLogsByTrnsactionId/:id`, `/userleave/v1/LeavedetailById/:id`, `/leaveauthorizationRequest/v1/mobileauthuserforleave`, `/userchats/v1/getuserList`, `/auth/v1/dashboard1`. | various |
| C9 | **All uploads are public** (`/uploads` static, no auth) with guessable or predictable names — Aadhaar/PAN images, selfies, leave and expense attachments, payslips (`uploads/PaySlips/...`), letters (`uploads/letter/<type>_<userMasterID>.pdf`). | `app.js` |
| C10 | **Arbitrary server file deletion** via `filesTobeRemoved` on expense edit/reapply and office expense. | `userExpense.controller.js:2324`, `officeExpense.controller.js:677,1363` |

### High
| # | Issue |
|---|---|
| H1 | **IDOR within the company:** most endpoints take the target user from the body; PA allows every user in the company. An employee can read colleagues' payslips, salary structure, leave, attendance, documents and bank details. |
| H2 | **Cross-tenant IDOR:** `:id` path params are never scope-checked; VT-only routers (`/userLetters`, `/reportTo`, `/LastFiveAttendance`, `/attendanceCorrectionRequest`, `/shortLeaveAuthorization`, `/visit` incl. `Team_Visit`, `/userShortLeave`, `/hrLeaveBal`, `/empJoining/v1/getbyuserid/:id`…) accept any ID; `userid` alias bypasses PA on `getcalenderdatamonthwise` and `dashboardcheck`. |
| H3 | **Multipart routes bypass PA** (PA runs before multer). Affects leave apply, profile uploads, tasks, expenses, gate pass. |
| H4 | **Password hash / FCM token / OTP leakage** because `UserMaster` has no `defaultScope`; seen in chat list, company training, compdoc, advance/loan/penalty lists, report-to lists. |
| H5 | **Push hijack:** `dashboardcheck` and `userLogout` accept any `userMasterID`, letting a user redirect or clear another user's FCM token. |
| H6 | **Buddy punching / geofence bypass** (§ Mobile Attendance Gap items 1–2). |
| H7 | **Socket impersonation:** `signin`, `message`, `register`, `punch_out` trust client IDs; anyone can read or send chat as anyone. REST chat also trusts `senderID`/`receiverID`. |
| H8 | **Unauthenticated `/auth/v1/editprofile`** (replace anyone's photo) and `/auth/v1/resetpassword` (old-password brute force by `userMasterID`). |
| H9 | **No server RBAC:** HR endpoints (salary, leave balance changes via `/userleave/v1/manageLeaveBalance`, lapse via `/userleave/v1/lapseLeaveBalance`, approver setup `/AuthorizationDetails/v1/*`, announcements, policies) are callable by any employee. |

### Medium
- 365-day JWT with no revocation and no refresh; subscription not re-checked per request.
- `x-forwarded-for` trusted for audit IPs; `createBy`/`updateBy` often from the client (audit spoofing).
- 500 MB body limit and unrestricted upload types on several routes (DoS, stored XSS via HTML/SVG in public `/uploads`).
- Email approve/reject links are base64, not signed.
- Inconsistent HTTP status codes make error handling brittle.
- Socket/crons live in a single process (no horizontal scaling).

### Recommended hardening before production mobile launch
1. **Remove or lock down** `/common/v1/query`, `/common/v1/getview`, `/companycontact/v1/changeallpassword`, `/auth/v1/changepasswordMultipleEmp`, `/auth/v1/checkfcm`.
2. **Fix the reset flow:** `/auth/v1/reset` must require a single-use, short-lived reset token issued by a successful OTP check; stop returning the OTP from `/auth/v1/forgot`; rate-limit OTP endpoints.
3. **Add token-derived `/me` endpoints** for every MVP read and write (§14 P0) and have the mobile app use only those.
4. **Approver binding:** every accept/reject must verify `row.userMasterID === req.userDetails.userMasterId`, the row is pending, and `ReferenceID` matches; compute the leave breakdown server-side.
5. **Authenticated file access:** serve payslips, documents, selfies and attachments through a token-checked endpoint (or short-lived signed URLs) and stop serving sensitive directories statically.
6. **Add VT** to `/biometric`, `/biometricDataTransfer`, `/tpMirror`, `/authorizationCriteriaMasterRoutes`, `/auth/v1/editprofile`, `/auth/v1/resetpassword`.
7. **Run PA after multer** and validate `:id` params against scope.
8. **Add a `UserMaster` defaultScope** excluding `password`, `passwordToken`, `firebaseToken`.
9. **Parameterise the raw SQL** listed in C8.
10. **Enforce role permissions** (`requirePermission(form, op)`) on HR/admin actions.
11. **Bind socket events** to `socket.userDetails.userMasterId`.
12. Shorter mobile JWT + refresh token (§14 P1).

---

## 14. Mobile API gaps

> **Everything in this section is PROPOSED. None of these endpoints exist today.** Naming follows the existing `/<module>/v1/<action>` convention. All proposed endpoints must: require VT; take the acting user from `req.userDetails.userMasterId`; take the company from `req.userDetails.companyMasterId`; ignore any client-sent `userMasterID`/`companyMasterID`; use the legacy envelope `{status, message, data, totalcount}`.

### P0 — required before MVP

| # | Proposed endpoint | Purpose / why | Request | Response | Users | Tenant rule |
|---|---|---|---|---|---|---|
| P0-1 | `POST /auth/v1/resetWithOtp` (or fix `/auth/v1/reset`) | Secure password reset; current flow allows takeover | `{mobile, otp, new_password}` (or `{resetToken, new_password}` from `checkPasswordTokenMARS`) | `{status, message}` | all | user found by mobile, OTP must match and be unexpired, single use |
| P0-2 | `GET /attendanceTransaction/v1/me/today` | Today's state without a client uid | – | same as `v2/attendancestatus` | 0 | token user |
| P0-3 | `POST /attendanceTransaction/v1/me/punch` | Secure punch: token user, no `web` bypass, server-enforced selfie/face/`attendanceFrom`, device fields | `{direction, newpunchin, latitude, longitude, accuracy, address, isMock, deviceId, appVersion}` + multipart `photo` | same as `attendanceApi` | 0 | token user; company policy |
| P0-4 | `POST /attendanceTransaction/v1/me/calendar`, `GET /attendanceTransaction/v1/me/summary` | History without client uid | `{startDate, endDate}` | same as existing | 0 | token user |
| P0-5 | `GET /userleave/v1/me/balance`, `POST /userleave/v1/me/list`, `POST /userleave/v1/me/apply`, `POST /userleave/v1/me/withdraw` | Leave self-service without client uid; withdraw only own **pending** leave | apply: multipart like `v2/bulk/add` without `userMasterID{i}`/`companyMasterID{i}`; withdraw: `{UserLeaveApplicationID}` | existing shapes; apply returns the new `UserLeaveApplicationID` | 0 | token user |
| P0-6 | `POST /salaryTrans/v1/mySalarySlipMonths` | List issued payslip months (none exists) | `{financialYear?}` | `{data:[{salaryYYYYMM, paid, paidDate}]}` where `salarySlipIssue=1` | 0 | token user |
| P0-7 | `POST /salaryTrans/v1/mySalarySlip` | Payslip PDF for the token user, issued only (ignores `status`) | `{yyyymm}` | `{data:{salaryYYYYMM, path:<base64>}}` or a PDF stream | 0 | token user, `salarySlipIssue=1` |
| P0-8 | `GET /auth/v1/me/profile` | Profile without IDOR | – | same as `getprofileWithCutomizeFields` + `employeeCode`, `companyMasterID`, `isManager`, `isApprover` | 0 | token user |
| P0-9 | `GET /authorizationRequest/v1/myPendingApprovals` | One approval queue for managers across modules | `{module?, page, limit}` | `{data:[{module:"leave"|"shortLeave"|"coff"|"attendanceCorrection"|"gatePass"|"overtime"|"expense"|"extraDays"|"resignation", authorizationRequestId, referenceId, requester:{userMasterID, displayName, photo}, summary, createdAt}], totalcount, counts:{leave, …}}` | 0 (approver) | rows where approver = token user and pending |
| P0-10 | Approver check inside existing accept/reject endpoints (or `POST /authorizationRequest/v1/myDecision`) | Stop self-approval | `{module, authorizationRequestId, authstatus, remarks}` | `{status, message}` | 0 (approver) | approver must be token user; row pending; leave breakdown computed server-side |
| P0-11 | `GET /uploads-secure/:category/:file` (or signed URLs) | Authenticated access to payslips, documents, attachments, selfies | – | file stream | 0 | owner, their approvers, or HR of the same company |
| P0-12 | `GET /reportTo/v1/me/team` | Team list scoped to the token user's direct reports | `{date?, search?, page, limit}` | same as `reportstoImmediateChild` | 0 (manager) | only rows where `reportToID` = token user |

### P1 — useful soon

| # | Proposed endpoint | Purpose | Request / response | Tenant rule |
|---|---|---|---|---|
| P1-1 | `POST /auth/v1/refreshToken` + shorter access token | Revocable sessions | `{refreshToken}` → `{token, refreshToken}` | token user, device-bound |
| P1-2 | `POST /auth/v1/logoutDevice` | Revoke refresh token + remove device FCM token | `{deviceId}` | token user |
| P1-3 | `POST /userDevice/v1/register` (new `userDevice` table) | Multiple devices per user for push | `{deviceId, platform, fcmToken, appVersion}` | token user |
| P1-4 | `GET /userInbox/v1/me/notifications` with `readStatus` + `POST /userInbox/v1/me/markRead` | Real notification centre with read/unread | `{ids[]}` | token user |
| P1-5 | `GET /employeeGatepass/v1/me`, `POST /employeeGatepass/v1/me/apply` | Gate pass without client uid | as existing | token user |
| P1-6 | `GET /holidayspolicy/v1/me/holidays?year=` | Holidays in one call | → `[{date, name, optional}]` | token user's active policy |
| P1-7 | `GET /employeeshift/v1/me/current` | Today's shift and roster | → `{shiftName, inTime, outTime, hours}` | token user |
| P1-8 | `POST /userleave/v1/me/cancelRequest` | Request cancellation of an approved leave, routed to approvers | `{UserLeaveApplicationID, dates[], remark}` | token user |
| P1-9 | `GET /appversion/v1/check?deviceType&version` (min-version semantics) | Soft/force update without exact-match coupling | → `{minVersion, latestVersion, force}` | public/global |
| P1-10 | `GET /auth/v1/me/requests` | All my open requests across modules for Home | → `[{module, id, status, createdAt}]` | token user |

### P2 — future

| # | Proposed | Purpose |
|---|---|---|
| P2-1 | `POST /policyDocument/v1/:id/acknowledge` | Policy read/acknowledge tracking |
| P2-2 | `POST /assignasset/v1/me/acknowledge` | Asset receipt acknowledgement |
| P2-3 | `POST /companyTraining/v1/:id/enrol` | Training enrolment |
| P2-4 | `POST /overTime/v1/me/request` | Employee-initiated overtime request |
| P2-5 | `POST /userdocument/v1/me/upload` | Employee document upload with type/size limits |
| P2-6 | `GET /attendanceTransaction/v1/me/team/today` | Manager team attendance summary counts |
| P2-7 | Offline punch queue: `POST /attendanceTransaction/v1/me/punchBatch` with signed device timestamps | Offline check-in with server-side validation window |

---

## 15. React Native integration guidance

### 15.1 Configuration
```ts
// src/config/env.ts
export const API_BASE_URL = "https://<host>/";          // REST, port 3000 behind the proxy; trailing slash
export const SOCKET_URL   = "https://<host>:3210";       // socket.io server (separate port)
export const FILE_BASE_URL = API_BASE_URL;               // uploads are served at `${FILE_BASE_URL}uploads/...`
```
Use build-time env (e.g. `react-native-config`) per environment. Ask ops whether ports 3000/3210 are fronted by a reverse proxy with TLS.

### 15.2 Auth flow and storage
- Store the JWT (and later refresh token) in **Keychain/Keystore** (e.g. `react-native-keychain`), never AsyncStorage.
- Keep `userid` and `companyid` from login in memory plus secure storage; inject them into requests that need them.
- On app start: token present → `dashboardcheck` → if 403, go to Login; if version message, go to Force Update.

### 15.3 HTTP client
One `axios` instance (already a common RN choice; `fetch` is fine too):
- `baseURL = API_BASE_URL`, `timeout = 30000` (60000 for uploads and PDF endpoints).
- Request interceptor: add `Authorization: Bearer <token>`.
- Response interceptor that normalises the three envelopes (§1.1):

```ts
function unwrap(res) {
  const b = res.data;
  if (b && typeof b === "object" && "status" in b && Number(b.status) !== 200) {
    throw new ApiError(Number(b.status), b.message ?? b.msg ?? "Request failed", b);
  }
  return b;
}
```
- Global handling:
  - HTTP **403** or `body.msg === "Authorization Denied!"` → clear session, go to Login.
  - `body.status === 401` and message `"Please update app version."` → Force Update screen.
  - `body.status === 401` with subscription/company messages → blocking "account inactive" screen.
  - HTTP 400 `{message}` → form validation message.
  - HTTP 5xx / network → retry option.
- Never send `exportData`, `Export`, `status` (payslip), `declarationFrom`, `verifyBy`, `admin`.

### 15.4 Pagination
Implement two helpers: `legacyPage({page, limit}) → totalcount` and `restPage({page, pageSize}) → totalcount/page/pageSize`. Use infinite lists; stop when `items.length >= totalcount`.

### 15.5 Files
- **Upload:** `FormData`, with field names exactly as in §10.1; indexed keys for leave (`FromDate0`, …) and expense (`expenseHeadId0`, …).
- **Download:** public URLs today → `react-native-blob-util`/`expo-file-system` download, then open/share. Base64 PDFs → write to the cache directory, then open/share.

### 15.6 Offline
- The backend has **no offline or idempotency support**. Do not queue punches offline and replay them later: `attendanceApi` stamps server time, so a replay records the wrong time.
- Cache read-only data (profile, balances, holidays, last calendar) for offline display.
- Queue non-time-critical writes (e.g. leave apply) only with an explicit "send when online" UI, and dedupe on the client (no server idempotency keys).

### 15.7 Push and deep links
- `@react-native-firebase/messaging` + `notifee` (for Android channels/foreground display).
- Register the token in `mobilelogin` and `dashboardcheck`; listen for `onTokenRefresh` and call `dashboardcheck` again.
- Route taps using `data.screen` (§12.2). No URL-based deep links exist on the server; implement app-scheme links (`musterbox://approvals/leave/<id>`) purely client-side if needed.

### 15.8 Location
- `react-native-geolocation-service` (or equivalent) for high-accuracy fixes; background tracking only when `dashboardcheck.data.tracking === true`, batching to `/Tracking/v1/savedatabulk` every `trackingInterval` seconds.
- Reverse-geocode on device for `address` (the backend expects a string).

---

## 16. Recommended mobile architecture

```
src/
  config/            env.ts (API_BASE_URL, SOCKET_URL)
  api/
    client.ts        axios instance, interceptors, envelope unwrap, ApiError
    endpoints.ts     one constant per path in this document
    auth.api.ts      mobilelogin, dashboardcheck, finalcheckpermission, password flows, logout
    attendance.api.ts
    leave.api.ts
    payslip.api.ts
    notifications.api.ts   inbox, announcements
    profile.api.ts
    team.api.ts            reportTo
    approvals.api.ts       per-module list + decide adapters → one Approval model
    tasks.api.ts
  auth/              AuthProvider, session store, token refresh hook (future)
  storage/           secureStore.ts (keychain), cache.ts (MMKV/AsyncStorage for non-secret cache)
  navigation/        RootNavigator, EmployeeTabs, ManagerTabs, linking.ts (screen → route map)
  features/
    home/
    attendance/      PunchScreen, CalendarScreen, DayDetailScreen, RegularizationForm
    leave/           BalanceScreen, ApplyLeaveScreen, HistoryScreen, LeaveDetailScreen
    payslip/         PayslipListScreen, PayslipViewerScreen (base64 + URL)
    notifications/   InboxScreen, AnnouncementsScreen
    profile/         ProfileScreen, sub-sections, DocumentsScreen
    team/            TeamScreen, MemberScreen
    approvals/       ApprovalsScreen, ApprovalDetailScreen (module adapters)
    tasks/           (feature-flagged)
  components/        shared UI
  hooks/             usePaginatedQuery, useLocation, useSelfie
  notifications/     fcm.ts, channels.ts, handlers.ts (data.screen router)
  socket/            chatSocket.ts (Phase 2)
  utils/             dates (IST), files (base64 → file), permissions (formName helpers)
  types/             generated from docs/mobile-api-inventory.json
```

Key design points:
- **An adapter per approval module**, because each module has its own list and decision endpoints, status codes and field names. Adapters map them to one `Approval` type until P0-9 exists.
- **Feature flags from data**: `isManager` from `reportstoImmediateChild`, `isApprover` from `getAuthList`, HR menus from `finalcheckpermission`, punch UI from `attendanceFrom` + policy.
- **All dates in IST** (`Asia/Kolkata`); the backend stores and compares in `+05:30`.

---

## 17. Navigation

Only screens the backend supports today are listed.

**Employee (bottom tabs)**
- **Home** — profile card, today's punch state, month summary, leave balance chips, unread announcements, task counts, birthdays.
- **Attendance** — punch (In / Resume / Out), calendar, day detail, regularization request + list.
- **Leave** — balance, apply, history + detail (approval trail), withdraw, short leave, holidays.
- **Payslip** — list (generator tenants: from `getMyPaySlipData`; main-payroll tenants: month picker until P0-6), viewer/share, Form 16.
- **Notifications** — inbox (action items), announcements.
- **Profile** — details, address/family/education/experience, documents, letters, policies, change password, logout.

**Manager (shown when `isManager` or `isApprover`)**
- **Home** — pending counts (`countpending`), team present/absent from the team list.
- **Team** — direct reports with today's attendance; member detail (calendar, leave via their `userMasterID`).
- **Approvals** — segmented by module: Leave, Short leave, Comp-off, Regularization, Gate pass, Overtime, Expense. **Hide until the P0-10 approver check is deployed.**
- **Attendance** — the manager's own punch screen.
- **Tasks** — my tasks, tasks I assigned, assign task.
- **Profile** — as Employee.

Not in MVP navigation: visits, expenses, advances/loans, assets, help desk, PMS, training, chat, resignation (Phase 2).

---

## 18. MVP implementation order

1. **Backend P0 security fixes** (C1–C10 and P0-1). Without them, shipping a mobile client increases exposure.
2. **App shell:** env config, HTTP client with envelope handling, secure storage, navigation skeleton.
3. **Auth:** `mobilelogin` → forced password change → `dashboardcheck` (version gate + FCM token) → `finalcheckpermission` → logout.
4. **Profile (read-only)** and Home skeleton.
5. **Attendance:** status → punch (in/resume/out, selfie, location) → calendar → summary → day logs. Switch to P0-3 `/me/punch` when available.
6. **Leave:** balance → types → apply (with attachment) → history/trail → withdraw → holidays.
7. **Payslip:** generator list or P0-6/P0-7 → PDF viewer/share → Form 16.
8. **Notifications:** FCM handling + `data.screen` router → inbox → announcements.
9. **Manager:** team list (P0-12 or `reportstoImmediateChild`) → approvals once P0-9/P0-10 are deployed (leave first, then short leave, regularization, gate pass, overtime, expense).
10. **Regularization request** (employee) and approval (manager).
11. **Hardening:** error states, offline caching of reads, analytics, crash reporting.
12. **Phase 2 modules** in priority order: expenses, gate pass, tasks, visits, help desk, documents upload, PMS.

---

## Mobile MVP API Checklist

- **READY** — existing API can be consumed as-is (identity from the token, or low risk).
- **REVIEW** — API exists but needs a security or contract fix; usable for a pilot if the app sends only the logged-in user's own IDs.
- **GAP** — backend change required.

| Area | Capability | Endpoint(s) | Status |
|---|---|---|---|
| Auth | Login | `/auth/v1/mobilelogin` | READY |
| Auth | Bootstrap / version gate / FCM save | `/auth/v1/dashboardcheck` | REVIEW (body uid → push hijack) |
| Auth | Permissions for menus | `/auth/v1/finalcheckpermission` | REVIEW (body uid) |
| Auth | Forced first-login change | `/auth/v1/resetpassword` | REVIEW (no auth) |
| Auth | Change password | `/auth/v1/changepassword` | REVIEW (body uid) |
| Auth | Forgot password (OTP) | `forgotpasswordOtpMARS`, `checkPasswordTokenMARS`, `reset` | **GAP** (P0-1) |
| Auth | Refresh token | — | GAP (P1-1) |
| Auth | Logout | `/auth/v1/userLogout` | REVIEW (body uid; JWT not revoked) |
| Home | Profile card | `/auth/v1/getprofileWithCutomizeFields/:id` | REVIEW (IDOR) |
| Home | Birthdays / anniversaries | `/auth/v1/birthday`, `/auth/v1/anniversary` | READY |
| Home | My open requests | — | GAP (P1-10) |
| Attendance | Today's state | `/attendanceTransaction/v2/attendancestatus` | REVIEW |
| Attendance | Check-in / resume / check-out | `/attendanceTransaction/v1/attendanceApi` | **GAP** for production (buddy punching, `web` bypass, unenforced selfie) — REVIEW for pilot |
| Attendance | Calendar / history | `/v1/getcalenderdatamonthwise`, `/v1/attendanceData`, `/v1/attendanceByUserid` | REVIEW |
| Attendance | Month summary | `/v1/userAttendanceSummary` | REVIEW |
| Attendance | Day punch logs | `/v1/getUserLogDateWise` | REVIEW |
| Attendance | Shift info | `/employeeshift/v1/getbyuserid/:id`, `/shiftRoster/v1/listShiftRosterData` | REVIEW |
| Attendance | Regularization request | `/attendanceCorrectionRequest/v1/add`, `/v1/getByUserId` | REVIEW (VT only) |
| Attendance | Background tracking | `/Tracking/v1/savedatabulk` | READY (token uid) |
| Attendance | Face check | `/empJoining/v1/checkUserFaces` | REVIEW (not bound to punch) |
| Leave | Balance | `/userleave/v1/getUserLeaveBalance` | REVIEW |
| Leave | Types | `/hrleavetypes/v1/getDataWithoutOutDuty/:id` | READY |
| Leave | Apply (+attachment) | `/userleave/v2/bulk/add` | REVIEW (indexed uid unchecked; working tree) |
| Leave | History / status / trail | `/userleave/v2/LeaveByUser`, `/leaveauthorizationRequest/v1/getAuthorizationRequestByReferanceId/:id` | REVIEW |
| Leave | Withdraw | `/userleave/v1/delete/:id` | REVIEW (no owner/status guard) |
| Leave | Cancel approved day | `/leaveauthorizationRequest/v1/leavecancel` | REVIEW |
| Leave | Holidays | `/empholidaypolicy/v1/getbyuserid/:id` + `/holidayspolicy/v1/getbyid/:id` | REVIEW |
| Leave | Short leave | `/userShortLeave/v1/add`, `/v1/listDataByUser` | REVIEW (VT only) |
| Payslip | List (generator tenants) | `/paySlipGenerator/v1/getMyPaySlipData` | READY (token uid; files public) |
| Payslip | List (main payroll) | — | **GAP** (P0-6) |
| Payslip | PDF (main payroll) | `/salaryTrans/v1/getUserWiseSalarySlip` | REVIEW (IDOR; `status` bypass) → P0-7 |
| Payslip | Form 16 | `/report/v1/form16Report` | REVIEW (IDOR) |
| Notifications | Push registration + delivery | FCM via `mobilelogin` / `dashboardcheck` | READY (single device) |
| Notifications | Inbox | `/userInbox/v1/getUserInboxData` | READY (token uid; no read state) |
| Notifications | Announcements + badge | `/announcement/v1/getbyuserId`, `/v1/countUnreadAnnouncement` | REVIEW (body uid) |
| Notifications | Read/unread per item | — | GAP (P1-4) |
| Profile | Details / sub-sections | `/empJoining/v1/getbyuserid/:id`, `/useraddress`, `/userfamily`, `/usereducation`, `/userexperience`, `/userskills` | REVIEW (IDOR; password-hash leakage) |
| Profile | Documents | `/userdocument/v1/getbyuserid/:id`, `/compdoc/v1/getbyuserid`, `/userLetters/v1/getAllUserLetter`, `/policyDocument/v1` | REVIEW (public files) |
| Profile | Photo update | `/auth/v1/editprofile` | REVIEW (no auth) |
| Files | Authenticated downloads | — | **GAP** (P0-11) |
| Manager | Team list | `/reportTo/v1/reportstoImmediateChild` | REVIEW (unscoped) → P0-12 |
| Manager | Team attendance | `/reportTo/v1/reportstowithoutchild/:id`, `/v1/reportstowithoutchilddatewise` | REVIEW |
| Manager | Pending counts | `/leaveauthorizationRequest/v1/countpending` | REVIEW |
| Manager | Unified approval queue | — | **GAP** (P0-9) |
| Manager | Leave approve / reject | `/leaveauthorizationRequest/v2/listLeaveAuthRequestNew`, `/v1/authorizationacceptreject` | **GAP** (P0-10) |
| Manager | Short leave / comp-off / regularization / gate pass / overtime approvals | per §6 | **GAP** (P0-10) |
| Manager | Expense approvals | `/authorizationRequest/v3/getExpenseAuthByUser`, `/v1/authorizationacceptrejectexpenseall` | REVIEW (actor = token; row ownership unchecked) |
| Manager | Tasks | `/user_tasks/v2/add`, `/v2/getTaskbyCompany`, `/v3/getTaskbyUser` | READY / REVIEW |
| App | Version gating | `dashboardcheck` + `/appversion` | REVIEW (exact match; crash if row missing) |
