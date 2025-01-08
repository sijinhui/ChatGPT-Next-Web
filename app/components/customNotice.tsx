"use client";

import { Modal } from "antd";
import { useEffect, useState } from "react";

export const CustomNotice = () => {
  const [host, setHost] = useState("");
  console.log("-----", host);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.hostname);
    }
  }, []);

  useEffect(() => {
    if (host === "localhost") {
      setIsModalOpen(true);
    }
  }, [host]);

  return (
    <Modal
      title="Vertically centered modal dialog"
      centered
      open={isModalOpen}
      onOk={() => setIsModalOpen(false)}
      onCancel={() => setIsModalOpen(false)}
    >
      <p>some contents...</p>
      <p>some contents...</p>
      <p>some contents...</p>
    </Modal>
  );
};
