import React, { useEffect } from "react";
import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import { essos } from "@/lib/charts_theme";

interface SiEchartsProps {
  option: EChartsOption;
}

function SiEcharts({ option }: SiEchartsProps) {
  const chartID = "si-echarts";

  useEffect(() => {
    if (option && typeof window !== "undefined") {
      let chartDom = document.getElementById(chartID);
      echarts.registerTheme("default", essos);
      let myChart = echarts.init(chartDom, "default");
      option && myChart.setOption(option);
    }
  }, [option]);

  // 窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      let chartDom = document.getElementById(chartID);
      if (!chartDom) return;
      const myChart = echarts.getInstanceByDom(chartDom);
      myChart?.resize();
    };
    const targetNode = document.documentElement; // 或者 document.body
    // 创建一个观察器实例并传入回调函数，该函数在观察到变化时执行
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // console.log(`Element's size: ${width}px x ${height}px`);
        handleResize();
      }
    });

    targetNode && resizeObserver.observe(targetNode);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return <div id={chartID} style={{ width: "100%", height: "400px" }}></div>;
}

export default SiEcharts;
