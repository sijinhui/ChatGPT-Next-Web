import UsageByModel from "./usage-by-model-chart";
import { LogAnaChartCom } from "./log-ana-chart";

import { Flex } from "antd";

export default async function AdminPage() {
  return (
    <>
      <Flex gap="middle" vertical>
        <UsageByModel />
        {/*<UserByMap />*/}
        <LogAnaChartCom />
      </Flex>
    </>
  );
}
