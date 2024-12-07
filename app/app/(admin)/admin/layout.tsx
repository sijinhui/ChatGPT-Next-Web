"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Button, theme, ConfigProvider, Space, Card } from "antd";
import SideBar from "../components/sidebar";
import useTheme from "../hooks/useTheme";
import { IconDark } from "./icon/IconDark";
import { IconLight } from "./icon/IconLight";
import { Loading } from "@/app/components/home";

const { Header, Sider, Content } = Layout;

function MainLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState<Boolean>(false);

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

  useEffect(() => {
    // 检查页面是否已经完全加载
    if (document.readyState === "complete") {
      setIsLoading(false);
    } else {
      // 定义加载完成的处理函数
      const handleLoad = () => setIsLoading(false);

      // 添加事件监听器
      window.addEventListener("load", handleLoad);

      // 清理事件监听器
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ConfigProvider
      theme={{
        // 1. 单独使用暗色算法
        algorithm:
          currentTheme === "light"
            ? theme.defaultAlgorithm
            : theme.darkAlgorithm,
        token: {
          colorBgContainer:
            currentTheme === "light" ? "#fff" : "hsl(var(--sidebar))",
          // colorPrimary: "#00b96b",
        },
        components: {
          Layout: {
            // siderBg: "red",
            lightSiderBg: "hsl(var(--sidebar))",
            headerBg: "hsl(var(--header))",
          },
          Table: {
            // headerBg: "#5c5d61",
          },

          Menu: {
            itemBg: "hsl(var(--sidebar))",
            subMenuItemBg: "hsl(var(--sidebar))",
            itemActiveBg:
              currentTheme === "light"
                ? "hsl(var(--primary) / 15%)"
                : "hsl(var(--accent))",
            itemSelectedBg:
              currentTheme === "light"
                ? "hsl(var(--primary) / 15%)"
                : "hsl(var(--accent))",
            itemSelectedColor:
              currentTheme === "light" ? "hsl(var(--primary))" : "white",
          },
        },
      }}
    >
      <Layout style={{ height: "100%" }} id="admin-layout">
        <Sider
          theme="light"
          breakpoint={"md"}
          collapsedWidth="0"
          collapsed={collapsed}
          trigger={null}
          className="transition-all duration-150"
          width={224}
          style={{
            borderRight: currentTheme === "dark" ? "1px solid #343A46" : "none",
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
              // background: currentTheme === "light" ? "#fff" : "#141414",
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
                onClick={(e) => toggleCurrentTheme(e)}
              />
            </Space>
          </Header>
          <Content
            id="admin-page-content"
            style={{
              // margin: "24px 16px",
              padding: 24,
              minHeight: 280,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card>{children}</Card>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default MainLayout;
