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
  const RE_SHOW_DAYS = 1; // 间隔天数
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

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
        为方便记忆，且刚好有个不错的域名闲置。
        <Paragraph>
          我的网站即将更换域名，从 <Link strong>chat.xiaosi.cc</Link> 切换到{" "}
          <Link strong>si.icu</Link>。✨
        </Paragraph>
        <Paragraph>
          为了确保您不会丢失任何重要信息，请务必在{" "}
          <Text type="danger">2025年2月1日</Text> 前完成以下操作：
        </Paragraph>
        <ul>
          <li>📁 设置-本地数据中导出您的重要聊天记录</li>
          <li>🔐 确认您现在使用的账号，在左下角可以查看或者注销后尝试登录</li>
          <li>
            🔗 更新书签以便快速访问新域名
            <Text type="secondary">（不更换后续也会正常跳转）</Text>
          </li>
        </ul>
        <Paragraph>
          如有任何疑问或需要帮助，请随时联系我。感谢您的理解与支持！🌟
        </Paragraph>
        <Paragraph>祝您使用愉快！😊</Paragraph>
      </Typography>
    </Modal>
  );
};
