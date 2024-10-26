import { Link } from "react-router-dom";
import { Path } from "../constant";
import Locale from "../locales";

import { signOut } from "next-auth/react";

import { Dropdown, ConfigProvider } from "antd";
import type { MenuProps } from "antd";

import SettingIcon from "../icons/setting.svg";
import UsernameIcon from "../icons/username.svg";
import LogoutIcon from "../icons/logout.svg";
import Icon from "@ant-design/icons";

import { ReactNode } from "react";

import { useSession } from "next-auth/react";

export function UserInfo({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: <label>{session?.user.name}</label>,
      icon: <Icon component={UsernameIcon} />,
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: <Link to={Path.Settings}>{Locale.Settings.Title}</Link>,
      icon: <Icon component={SettingIcon} />,
    },
    {
      type: "divider",
    },
    {
      key: "3",
      label: (
        <a
          onClick={(e) => {
            e.preventDefault();
            signOut();
          }}
        >
          {Locale.Settings.UserInfo.UserStatus.Logout}
        </a>
      ),
      icon: <Icon component={LogoutIcon} />,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: { colorBgElevated: "var(--white)", colorText: "var(--black)" },
      }}
    >
      <Dropdown
        menu={{ items }}
        placement="topLeft"
        trigger={["click"]}
        arrow={{ pointAtCenter: true }}
      >
        {children}
      </Dropdown>
    </ConfigProvider>
  );
}
