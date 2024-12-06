"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Button, theme, ConfigProvider, Space } from "antd";
import SideBar from "../components/sidebar";
import useTheme from "../hooks/useTheme";
import { IconDark } from "./icon/IconDark";
import { IconLight } from "./icon/IconLight";

const { Header, Sider, Content } = Layout;

const isDark = true;

function MainLayout({ children }: { children: ReactNode }) {
  const [currentTheme, toggleCurrentTheme] = useTheme();

  const [collapsed, setCollapsed] = useState(
    typeof window !== "undefined" && window.innerWidth < 768,
  );
  const {
    token: { colorBgContainer, borderRadiusLG, colorBgLayout },
  } = theme.useToken();
  // 处理布局
  useEffect(() => {
    const handleResize = () => {
      // 更新折叠状态以匹配屏幕宽度
      setCollapsed(typeof window !== "undefined" && window.innerWidth < 768);
    };
    // 监听窗口大小变化
    window.addEventListener("resize", handleResize);
    // 组件卸载时移除监听器
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // 客户端才执行
  // useEffect(() => {
  //   // 用户已登录，且没设置密码
  //   // if (status === "loading") return;
  //   if (status === "authenticated" && !(name && ADMIN_LIST.includes(name))) {
  //     redirect("/");
  //   }
  //   // 状态变化时，重新判断
  // }, [name, status]);

  return (
    <ConfigProvider
      theme={{
        // 1. 单独使用暗色算法
        algorithm:
          currentTheme === "light"
            ? theme.defaultAlgorithm
            : theme.darkAlgorithm,
        token: {
          // colorBgContainer: currentTheme === 'light' ? '#fff' : '#141414',
          // colorPrimary: "#00b96b",
        },
      }}
    >
      <Layout style={{ height: "100%" }}>
        <Sider
          theme="light"
          breakpoint={"md"}
          collapsedWidth="0"
          collapsed={collapsed}
          trigger={null}
          style={{
            // borderRight:
            //     '1px solid #343A46',
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          }}
        >
          {/*<div className="demo-logo-vertical" />*/}
          <SideBar />
        </Sider>

        <Layout>
          <Header
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 24px 0 16px",
              background: currentTheme === "light" ? "#fff" : "#141414",
              justifyContent: "space-between",
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 32,
                height: 32,
              }}
            />

            <Space size="middle">
              <Button
                type="text"
                icon={
                  currentTheme === "dark" ? (
                    <IconDark style={{ height: 20, width: 20 }} />
                  ) : (
                    <IconLight style={{ height: 24, width: 24 }} />
                  )
                }
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => toggleCurrentTheme && toggleCurrentTheme()}
              />
            </Space>
          </Header>
          <Content
            id="admin-page-content"
            style={{
              // margin: "24px 16px",
              padding: 24,
              minHeight: 280,
              background: currentTheme === "light" ? "#f5f5f5" : "#000",
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default MainLayout;
