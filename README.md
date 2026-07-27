# MediScribe

MediScribe is a React-based clinical documentation prototype designed to simulate a modern ambulatory care workflow. It guides a clinician through patient selection, visit recording, transcript review, SOAP-note editing, billing-code review, and note signing in a polished, desktop-friendly experience.

## What this project includes

- Role-based access for physicians, managers, and billing staff
- Patient roster workflow with CSV import support
- Simulated visit capture and transcript review
- AI-assisted draft generation for SOAP note sections
- Review and sign-off flow for finalized notes
- Basic dashboards for personal and practice-level insights
- Persistent client-side state so users can resume after refresh

## Tech stack

- React 18
- Vite
- Tailwind CSS
- Lucide icons
- Recharts for dashboard visualization

## Project structure

```text
src/
├── App.jsx
├── main.jsx
├── index.css
├── features/
│   ├── auth/components/
│   ├── workflow/components/
│   ├── dashboard/components/
│   ├── billing/components/
│   ├── permissions/components/
│   └── navigation/components/
├── shared/
│   ├── components/ui/
│   ├── constants/
│   ├── data/
│   ├── lib/
│   └── theme/
└── docs/
    └── assignments/
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the local Vite URL shown in the terminal.

## Build for production

```bash
npm run build
```

## Demo accounts

Password for all demo accounts: `pajama-time`

| Email | Role |
| --- | --- |
| elena.ruiz@sagebrushfamilymed.com | Physician |
| marcus.webb@ridgelineortho.com | Physician |
| priya.nair@harborviewclinic.com | Practice manager |
| dana.brooks@harborviewclinic.com | Billing specialist |

## Notes

This is a prototype and uses simulated authentication, demo data, and local browser storage for persistence. It is intended for assignment/demo purposes rather than production deployment.
