import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { Path } from "../constant";
import Locale from "../locales";

import { signOut } from "next-auth/react";

import { Dropdown, ConfigProvider, Tag } from "antd";
import type { MenuProps } from "antd";

import SettingIcon from "../icons/setting.svg";
import UsernameIcon from "../icons/username.svg";
import LogoutIcon from "../icons/logout.svg";
import MoneyIcon from "../icons/money.svg";
import Icon from "@ant-design/icons";

import { ReactNode } from "react";

import { useSession } from "next-auth/react";

export function UserInfo({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userMoney, setUserMoney] = useState({
    total: 0,
    today: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        fetch("/api/logs/money", {
          method: "GET",
          credentials: "include",
        })
          .then((response) => response.json())
          .then((result) => {
            setUserMoney(result.result);
          });
      } catch (error) {}
    };

    fetchData();
  }, []);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <label>
          {Locale.Settings.UserInfo.Nickname}
          {session?.user.name}
        </label>
      ),
      icon: <Icon component={UsernameIcon} />,
    },
    {
      key: "#",
      label: (
        <label>
          {Locale.Settings.UserInfo.Money.Today}
          <Tag color="gold">{userMoney?.today}$</Tag>
          {Locale.Settings.UserInfo.Money.Total}
          <Tag color="gold">{userMoney?.total}$</Tag>
        </label>
      ),
      icon: <Icon component={MoneyIcon} />,
      disabled: true,
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
        token: {
          colorBgElevated: "var(--white)",
          colorText: "var(--black)",
          colorTextDisabled: "null",
        },
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
