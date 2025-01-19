"use client";

import { Modal, Button, Typography } from "antd";
import { useEffect, useState } from "react";
import { getClientConfig } from "../config/client";
import { useRouter } from "next/navigation";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text, Link } = Typography;

export const CustomNotice = () => {
  // const [host, setHost] = useState("");
  const clientVersion = getClientConfig()?.version ?? "";
  const clientVersionKey = "announcementDismissed";
  const RE_SHOW_DAYS = 7; // 间隔天数
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // 直接强制重定向, 后续把功能做到nginx中
  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     // 当前时间
  //     const now = new Date();
  //     // 对比目标时间（2025年2月1日）
  //     const target = new Date("2025-02-01");
  //     const host = window.location.hostname;
  //     // 如果当前时间大于目标时间，就直接重定向
  //     if (
  //       now > target &&
  //       host &&
  //       (host === "localhost" || host === "chat.xiaosi.cc")
  //     ) {
  //       router.push("https://si.icu");
  //     }
  //   }
  // }, [router]);

  useEffect(() => {
    // 检查 localStorage 中存储的已关闭版本
    if (typeof window !== "undefined") {
      // 确保在客户端执行
      const dismissedData = JSON.parse(
        localStorage.getItem(clientVersionKey) || "{}",
      );
      const dismissedVersion = dismissedData.version;
      const dismissedAt = dismissedData.dismissedAt;
      const isNewVersion = dismissedVersion !== clientVersion;
      const shouldReShow =
        dismissedAt &&
        new Date().getTime() - dismissedAt > RE_SHOW_DAYS * 24 * 60 * 60 * 1000;
      const host = window.location.hostname;
      if (
        (isNewVersion || shouldReShow) &&
        (host === "localhost" || host === "chat.xiaosi.cc")
      ) {
        setIsModalOpen(true);
      }
    }
  }, [clientVersion]);

  const hideAnnouncement = () => {
    setIsModalOpen(false);
    if (typeof window !== "undefined") {
      const dismissedData = {
        version: clientVersion,
        dismissedAt: new Date().getTime(),
      };
      localStorage.setItem(clientVersionKey, JSON.stringify(dismissedData));
    }
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ marginTop: "0.5em", marginBottom: "1em" }}>
          <InfoCircleOutlined style={{ color: "#1890ff" }} /> 域名更换通知 📢
        </Title>
      }
      centered
      open={isModalOpen}
      // onOk={() => hideAnnouncement()}
      onCancel={hideAnnouncement}
      footer={[
        <Button key="back" onClick={hideAnnouncement}>
          暂不🙅️
        </Button>,
        <Button
          key="link"
          type="primary"
          onClick={() => router.push("https://si.icu")}
        >
          立即跳转👉
        </Button>,
      ]}
    >
      <Typography>
        <Paragraph>亲爱的用户们，👋</Paragraph>
        <Paragraph>
          该开源项目作者不积极维护，很多gpt新功能无法使用，因此决定该网站也不再更新。
          将使用新网址配合全新的项目提供<Text strong>更好的服务体验</Text>。
        </Paragraph>

        <Paragraph>
          从 <Link strong>chat.xiaosi.cc</Link> 切换到{" "}
          <Link strong>si.icu</Link>。✨
        </Paragraph>
        <Paragraph>
          为了确保您不会丢失任何重要信息，请务必在{" "}
          <Text type="danger">2025年2月1日</Text> 前完成以下操作：
        </Paragraph>
        <ul>
          <li>📁 备份您的重要聊天记录</li>
          <li>
            🔐 <Text strong>提供我您使用的邮箱</Text>以便于在新的站点中创建账号
          </li>
          <li>🔗 更新书签以便快速访问新域名</li>
        </ul>
        <Paragraph>
          如有任何疑问或需要帮助，请随时联系我。感谢您的理解与支持！🌟
        </Paragraph>
        <Paragraph>祝您使用愉快！😊</Paragraph>
      </Typography>
    </Modal>
  );
};
