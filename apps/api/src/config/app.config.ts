export const appConfig = () => ({
  apiPort: Number(process.env.API_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "replace-me"
});
