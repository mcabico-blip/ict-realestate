# ICT Realtors 🏠🇵🇭

**Philippines' Real Estate Marketplace** — Buy, sell, rent properties and connect with licensed brokers, salespersons, and real estate lawyers.

Built with **Next.js 16 · TypeScript · PostgreSQL · Prisma · NextAuth · Tailwind CSS v4**

---

## Features

- 🏠 Property listings — For Sale, For Rent, For Lease
- 🔍 Advanced search & filters (city, price, bedrooms, type)
- 👤 User roles: Buyer, Seller, Broker, Salesperson, Lawyer, Admin
- 👔 **Professionals directory** — PRC-licensed brokers, RESA salespersons, IBP lawyers
- ⚖️ Real estate lawyer profiles with IBP roll numbers and legal specializations
- 📋 4-step property listing wizard
- 💬 Property inquiries & legal consultations
- 📊 Seller/agent dashboard with stats
- 🔐 Authentication (email/password + Google OAuth)

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/mcabico-blip/ict-realestate.git
cd ict-realestate
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL` with your PostgreSQL credentials.

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Seed accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ictrealtors.ph | admin123456 |
| Broker | broker@ictrealtors.ph | broker123456 |
| Salesperson | salesperson@ictrealtors.ph | sales123456 |
| Lawyer | lawyer@ictrealtors.ph | lawyer123456 |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/           # REST API routes
│   ├── auth/          # Login & Register pages
│   ├── dashboard/     # User dashboard
│   ├── professionals/ # Broker/Salesperson/Lawyer directory
│   └── properties/    # Property listings & detail
├── components/
│   ├── dashboard/     # New listing form
│   ├── home/          # Hero search
│   ├── layout/        # Navbar & Footer
│   ├── professionals/ # Professional cards & consultation form
│   ├── property/      # Property cards, filters, listings
│   └── ui/            # Shared UI components
└── lib/
    ├── auth.ts         # NextAuth config
    ├── db.ts           # Prisma client
    ├── professionals.ts # PH-specific data (PAREB boards, IBP chapters)
    └── utils.ts        # Helpers (formatPrice, PH regions, amenities)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |

---

Built for the Philippines 🇵🇭 · ICT Realtors 2025
