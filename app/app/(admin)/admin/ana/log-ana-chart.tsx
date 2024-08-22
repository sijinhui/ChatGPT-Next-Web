"use client";

import { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import SiEcharts from "@/app/app/(admin)/components/si-echarts";
import { EChartsOption } from "echarts";

// const CandleStickChart = ({ OHLC_Data }) => {
//   const chartContainerRef = useRef(null);
//
//   useEffect(() => {
//     const chart = createChart(chartContainerRef.current, {
//       width: 700,
//       height: 400,
//       timeScale: {
//         timeVisible: true,
//         secondsVisible: false,
//         fixLeftEdge: true,
//         fixRightEdge: true,
//       },
//       crosshair: {
//         mode: CrosshairMode.Normal,
//       },
//     });
//     const candleSeries = chart.addCandlestickSeries({});
//
//     candleSeries.setData(OHLC_Data);
//
//     return () => {
//       chart.remove();
//     };
//   }, [OHLC_Data]);
//
//   return <div ref={chartContainerRef} />;
// };

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
