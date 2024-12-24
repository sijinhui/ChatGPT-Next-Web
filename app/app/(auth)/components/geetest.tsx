"use client";

import Script from "next/script";
import React, { Dispatch, SetStateAction } from "react";

interface ComponentProps {
  capResult: any;
  setCapResult: Dispatch<SetStateAction<any>>;
}

export function GeeTestInput({ capResult, setCapResult }: ComponentProps) {
  const [capOnReady, setCapOnReady] = React.useState(false);
  const [capOnSuccess, setCapOnSuccess] = React.useState(false);

  const validateCap = (result: any) => {
    // console.log("validateCap", result);
    setCapOnSuccess(true);
    setCapResult(result);
  };

  return (
    <>
      <div
        id="captcha"
        className="text-sm font-medium text-stone-600 dark:text-stone-400 cap-button"
      ></div>
      <Script
        src="https://static.geetest.com/v4/gt4.js"
        strategy="afterInteractive"
        onLoad={() =>
          window.initGeetest4(
            {
              captchaId: process.env.NEXT_PUBLIC_GEETEST_CAPTCHA_ID,
              product: "popup",
              nativeButton: {
                height: "40px",
                width: "320px",
              },
            },
            function (captcha: {
              appendTo: (arg0: string) => void;
              onReady(param: () => void): any;
              getValidate(): any;
            }) {
              captcha.appendTo("#captcha");
              captcha
                .onReady(() => setCapOnReady(true))
                .onSuccess(function () {
                  var result = captcha.getValidate();
                  validateCap(result);
                });
            },
          )
        }
      />
    </>
  );
}
