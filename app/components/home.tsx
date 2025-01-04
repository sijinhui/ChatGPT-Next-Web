"use client";

require("../polyfill");

import { useState, useEffect, useRef } from "react";
import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getISOLang } from "../locales";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "@/app/store";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { type ClientApi, getClientApi } from "../client/api";
import { useAccessStore } from "../store";
import clsx from "clsx";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Artifacts = dynamic(async () => (await import("./artifacts")).Artifacts, {
  loading: () => <Loading noLogo />,
});

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).ChatCom, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const PluginPage = dynamic(async () => (await import("./plugin")).PluginPage, {
  loading: () => <Loading noLogo />,
});

const SearchChat = dynamic(
  async () => (await import("./search-chat")).SearchChatPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const Sd = dynamic(async () => (await import("./sd")).Sd, {
  loading: () => <Loading noLogo />,
});

const Reward = dynamic(async () => (await import("./reward")).RewardPage, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const isDark = useRef<boolean | undefined>(undefined);

  const toggleTheme = (pos: { x: number; y: number }, theme: any) => {
    const endRadius = Math.hypot(
      Math.max(pos.x, innerWidth - pos.x),
      Math.max(pos.y, innerHeight - pos.y),
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setTheme(theme);
      // 兼容动画的模块
      const root = document.documentElement;
      root.classList.remove(isDark.current ? "dark" : "light");
      root.classList.add(isDark.current ? "light" : "dark");
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${pos.x}px ${pos.y}px)`,
        `circle(${endRadius}px at ${pos.x}px ${pos.y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: theme === "dark" ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 450,
          easing: "ease-in",
          pseudoElement:
            theme === "dark"
              ? "::view-transition-old(root)"
              : "::view-transition-new(root)",
        },
      );
    });
  };

  const setTheme = (prevTheme: string) => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (prevTheme === "dark") {
      document.body.classList.add("dark");
    } else if (prevTheme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (prevTheme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
    // 兼容动画模块
    isDark.current = document.body.classList.contains("dark");
  };

  useEffect(() => {
    // setTheme(config.theme);

    // 当主题为自动时不应该有动画
    if (isFirstRender || config.theme === "auto") {
      setTheme(config.theme);
      if (config.theme !== "auto") setIsFirstRender(false);
    } else {
      toggleTheme(config.themePos, config.theme);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  // const linkEl = document.createElement("link");
  // const proxyFontUrl = "/google-fonts";
  // const remoteFontUrl = "https://fonts.googleapis.com";
  // const googleFontUrl =
  //   getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  // linkEl.rel = "stylesheet";
  // linkEl.href =
  //   googleFontUrl +
  //   "/css2?family=" +
  //   encodeURIComponent("Noto Sans:wght@300;400;700;900") +
  //   "&display=swap";
  // document.head.appendChild(linkEl);
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isSd = location.pathname === Path.Sd;
  const isSdNew = location.pathname === Path.SdNew;

  const isMobileScreen = useMobileScreen();
  const shouldTightBorder =
    getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  if (isArtifact) {
    return (
      <Routes>
        <Route path="/artifacts/:id" element={<Artifacts />} />
      </Routes>
    );
  }
  const renderContent = () => {
    if (isAuth) return <AuthPage />;
    if (isSd) return <Sd />;
    if (isSdNew) return <Sd />;
    return (
      <>
        <SideBar
          className={clsx({
            [styles["sidebar-show"]]: isHome,
          })}
        />
        <WindowContent>
          <Routes>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.NewChat} element={<NewChat />} />
            <Route path={Path.Masks} element={<MaskPage />} />
            <Route path={Path.Plugins} element={<PluginPage />} />
            <Route path={Path.SearchChat} element={<SearchChat />} />
            <Route path={Path.Chat} element={<Chat />} />
            <Route path={Path.Settings} element={<Settings />} />
            <Route path={Path.Reward} element={<Reward />} />
          </Routes>
        </WindowContent>
      </>
    );
  };

  return (
    <div
      className={clsx(styles.container, {
        [styles["tight-container"]]: shouldTightBorder,
      })}
    >
      {renderContent()}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  const api: ClientApi = getClientApi(config.modelConfig.providerName);

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  // const { status } = useSession({ required: true })
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
