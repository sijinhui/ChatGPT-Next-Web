import { notification } from "antd";
import type { NotificationArgsProps } from "antd";

export const CustomNotification = ({
  message,
  description,
}: NotificationArgsProps) => {
  const openNotification = () => {
    notification.open({
      message,
      description,
    });
  };

  // 打开通知
  openNotification();

  return null;
};
