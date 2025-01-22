import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";

import dynamic from "next/dynamic";

const CustomNotice = dynamic(
  async () => (await import("./components/customNotice")).CustomNotice,
  { ssr: false },
);

const serverConfig = getServerSideConfig();

export default async function App() {
  return (
    <>
      <Home />
      <CustomNotice />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
