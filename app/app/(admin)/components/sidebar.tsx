"use client";

import React, { useState } from "react";
// import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import {
  AppstoreOutlined,
  // MailOutlined,
  // SettingOutlined,
  // DashboardTwoTone,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group",
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("面板", "dashboard", <AppstoreOutlined />, [
    getItem("使用分析", "/admin/ana"),
  ]),

  getItem("管理", "manage", <AppstoreOutlined />, [
    getItem("用户管理", "/admin/users"),
    getItem("系统设置", "/admin/setting"),
  ]),

  // getItem("Navigation Three", "sub4", <SettingOutlined />, [
  //   getItem("Option 9", "9"),
  //   getItem("Option 10", "10"),
  //   getItem("Option 11", "11"),
  //   getItem("Option 12", "12"),
  // ]),
];

const SideBar: React.FC = () => {
  const pathname = usePathname();
  const [current, setCurrent] = useState(pathname);
  const router = useRouter();

  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
    router.push(e.key);
  };

  const openKeys = items.map((item) => item?.key as string);
  return (
    <>
      <br />
      <br />
      <Menu
        onClick={onClick}
        selectedKeys={[current]}
        defaultOpenKeys={openKeys}
        mode="inline"
        items={items}
        style={{
          border: "none",
          padding: "5px 0",
        }}
      />
    </>
  );
};

export default SideBar;
