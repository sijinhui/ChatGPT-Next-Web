import { ReactNode } from "react";
import "./azureVoice/style.scss";

export default async function AzureVoiceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div id="azureVoiceApp" style={{ width: "100%", height: "95%" }}>
      {children}
    </div>
  );
}
