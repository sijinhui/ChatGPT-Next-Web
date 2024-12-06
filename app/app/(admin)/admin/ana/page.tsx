import UsageByModel from "./usage-by-model-chart";
// import UserByMap from "./user-by-map";

import { Flex, Card } from "antd";

export default async function AdminPage() {
  return (
    <>
      <Flex gap="middle" vertical>
        <Card>
          <UsageByModel />
        </Card>
      </Flex>
    </>
  );
}
