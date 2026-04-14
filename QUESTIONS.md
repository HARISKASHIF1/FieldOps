# QUESTIONS.md — Clarifications I Would Have Asked

These are questions I would raise before starting in a real project context.

---

### 1. Job Creation — Who initiates?
**Question**: Does a client submit a service request themselves, or does an admin always create jobs on their behalf?

**My assumption**: Admin creates all jobs. This ensures data quality (correct scheduling, technician availability checked upfront). A client self-service request form would be a Phase 2 feature.

---

### 2. Technician Availability
**Question**: Is there a concept of technician availability or scheduling constraints? Should the system prevent assigning a technician to overlapping jobs?

**My assumption**: No availability model in MVP. Admin is responsible for checking manually. A calendar/availability system would be a separate feature.

---

### 3. Job Reassignment Rules
**Question**: Can a job be reassigned after it's `in_progress`? Is there a handoff process?

**My assumption**: Admins can reassign at any status. The previous technician receives no notification (could be added). An activity log entry records the change.

---

### 4. Authentication — Invite-only vs. Open Registration
**Question**: Should technicians and admins be invited, or can anyone register as any role?

**My assumption**: Open registration for all roles (for demo/testing ease). In production, technician/admin accounts should be created by an existing admin only.

---

### 5. Client Portal — Same app or separate URL?
**Question**: Should clients access a completely separate frontend (different domain/subdomain) or a restricted view within the same app?

**My assumption**: Same app, role-based routing. Simpler to build and maintain. If white-labelling or client branding is needed, a separate portal becomes justified.

---

### 6. "Notes" vs. "Status Updates" — Are they the same?
**Question**: Should a note be purely a comment, or can a note also trigger a status change?

**My assumption**: Notes are comments only. Status changes are separate actions. This keeps the activity timeline clean and separable.

---

### 7. Data Retention
**Question**: How long should jobs, audit logs, and notifications be retained?

**My assumption**: Indefinitely for MVP. In production, a retention policy (e.g. archive completed jobs after 2 years) would be implemented at the DB level.
