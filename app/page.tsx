import { Analytics } from "@vercel/analytics/react";

import { Home } from "./components/home";

import { getServerSideConfig } from "./config/server";

import { headers } from "next/headers";

// import { VerifiedUser } from "@/lib/auth";
// import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const CustomNotification = dynamic(
  async () =>
    (await import("./components/customNotification")).CustomNotification,
  { ssr: false },
);

const serverConfig = getServerSideConfig();
export function getCurrentDomain() {
  const headersList = headers();
  // 获取完整的 Host 信息
  // const host = headersList.get('host')
  // 获取协议
  // const protocol = headersList.get('x-forwarded-proto') || 'http'
  return headersList.get("host");
}

export default async function App() {
  // const isUser = await VerifiedUser();
  // if (!isUser) {
  //   redirect("/login");
  // }
  const host = getCurrentDomain();
  console.log("-----", host);

  return (
    <>
      <Home />

      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
