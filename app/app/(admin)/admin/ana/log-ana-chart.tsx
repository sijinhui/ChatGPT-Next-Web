"use client";

import { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import SiEcharts from "@/app/app/(admin)/components/si-echarts";
import { EChartsOption } from "echarts";

export const LogAnaChartCom = () => {
  const option = {
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: "line",
        areaStyle: {},
      },
    ],
  } as EChartsOption;
  return <SiEcharts option={option} />;
};
