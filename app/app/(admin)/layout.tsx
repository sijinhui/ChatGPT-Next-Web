import "@/app/app/login.scss";
import { Metadata } from "next";
import { ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
// import Head from "next/head";
// import { VerifiedAdminUser, VerifiedUser } from "@/lib/auth";
// import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin | 管理页面",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // const isAdmin = await VerifiedAdminUser();
  // if (!isAdmin) {
  //   redirect("/");
  // }

  return (
    <>
      <AntdRegistry>{children}</AntdRegistry>
    </>
  );
}
