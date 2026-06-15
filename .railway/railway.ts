import {
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  service,
} from "railway/iac";

export default defineRailway((ctx) => {
  const db = postgres("postgres");

  const backend = service("backend", {
    source: github("N1CH-code/cashflow", { rootDirectory: "backend" }),
    build: "npm install && npx prisma generate && npm run build",
    start: "npx prisma db push && node dist/main",
    healthcheck: "/api/v1/education/articles",
    env: {
      NODE_ENV: "production",
      DATABASE_URL: db.env.DATABASE_URL,
      JWT_SECRET: preserve(),
      TELEGRAM_BOT_TOKEN: preserve(),
      OPENAI_API_KEY: preserve(),
    },
  });

  const frontend = service("frontend", {
    source: github("N1CH-code/cashflow", { rootDirectory: "frontend" }),
    build: "npm install && npm run build",
    start: "npx next start",
    env: {
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: backend.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${backend.env.RAILWAY_PUBLIC_DOMAIN}/api/v1`
        : preserve(),
    },
  });

  return project("cashflow", {
    resources: [db, backend, frontend],
  });
});
