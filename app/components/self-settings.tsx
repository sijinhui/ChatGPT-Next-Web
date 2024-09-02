import { FloatButton } from "antd";
import { CommentOutlined, CustomerServiceOutlined } from "@ant-design/icons";

import { Modal } from "./ui-lib";
import { IconButton } from "./button";
import Locale from "../locales";
import PeopleAvatar from "@/app/icons/people-avatar.svg";
import { UserOutlined } from "@ant-design/icons";

export function SelfSettingActions() {
  return (
    <>
      <FloatButton.Group
        trigger="click"
        style={{ insetInlineEnd: 24 }}
        icon={<UserOutlined />}
      >
        <FloatButton />
        <FloatButton />
      </FloatButton.Group>
    </>
  );
}

export function SelfSettingsModal(props: { onClose: () => void }) {
  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Chat.SelfActions.Title}
        onClose={props.onClose}
        footer={
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: 14,
              opacity: 0.5,
            }}
          >
            {Locale.Chat.SelfActions.Description.Title}
          </div>
        }
      ></Modal>
    </div>
  );
}
