import "./ui-lib.adp.scss";
/* eslint-disable @next/next/no-img-element */
import styles from "./ui-lib.module.scss";
import LoadingIcon from "../icons/three-dots.svg";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";
import DownIcon from "../icons/down.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ClaudeInstantIcon from "../icons/Claude-Instant.svg";
import AzureIcon from "../icons/azure.svg";
import GoogleIcon from "../icons/google.svg";
import MoonShot from "../icons/Moonshot.svg";
import DeepSeekIcon from "../icons/deepseek.svg";

import Locale from "../locales";

import { createRoot } from "react-dom/client";
import React, {
  CSSProperties,
  HTMLProps,
  MouseEvent,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { IconButton } from "./button";
import clsx from "clsx";
import { List as AntList, Row, Col, Progress, Divider } from "antd";
import { OpenAIOutlined } from "@ant-design/icons";
// 自定义图标
import Icon from "@ant-design/icons";

// const { Meta } = AntCard;
import { CheckCard } from "@ant-design/pro-components";
import { CheckGroupValueType } from "@ant-design/pro-card/es/components/CheckCard/Group";

export function Popover(props: {
  children: JSX.Element;
  content: JSX.Element;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={styles.popover}>
      {props.children}
      {props.open && (
        <div className={styles["popover-mask"]} onClick={props.onClose}></div>
      )}
      {props.open && (
        <div className={styles["popover-content"]}>{props.content}</div>
      )}
    </div>
  );
}

export function Card(props: { children: JSX.Element[]; className?: string }) {
  return (
    <div className={clsx(styles.card, props.className)}>{props.children}</div>
  );
}

export function ListItem(props: {
  title?: string;
  subTitle?: string | JSX.Element;
  children?: JSX.Element | JSX.Element[];
  icon?: JSX.Element;
  className?: string;
  onClick?: (e: MouseEvent) => void;
  vertical?: boolean;
}) {
  return (
    <div
      className={clsx(
        styles["list-item"],
        {
          [styles["vertical"]]: props.vertical,
        },
        props.className,
      )}
      onClick={props.onClick}
    >
      <div className={styles["list-header"]}>
        {props.icon && <div className={styles["list-icon"]}>{props.icon}</div>}
        <div className={styles["list-item-title"]}>
          <div>{props.title}</div>
          {props.subTitle && (
            <div className={styles["list-item-sub-title"]}>
              {props.subTitle}
            </div>
          )}
        </div>
      </div>
      {props.children}
    </div>
  );
}

export function List(props: { children: React.ReactNode; id?: string }) {
  return (
    <div className={styles.list} id={props.id}>
      {props.children}
    </div>
  );
}

export function Loading() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoadingIcon />
    </div>
  );
}

interface ModalProps {
  title: string;
  children?: any;
  actions?: React.ReactNode[];
  defaultMax?: boolean;
  footer?: React.ReactNode;
  onClose?: () => void;
  is_cus?: boolean;
}
export function Modal(props: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isMax, setMax] = useState(!!props.defaultMax);

  return (
    <div
      className={clsx(styles["modal-container"], {
        [styles["modal-container-max"]]: isMax,
        [styles["cus-modal-container"]]: props.is_cus,
      })}
    >
      <div className={styles["modal-header"]}>
        <div className={styles["modal-title"]}>{props.title}</div>

        <div className={styles["modal-header-actions"]}>
          <div
            className={styles["modal-header-action"]}
            onClick={() => setMax(!isMax)}
          >
            {isMax ? <MinIcon /> : <MaxIcon />}
          </div>
          <div
            className={styles["modal-header-action"]}
            onClick={props.onClose}
          >
            <CloseIcon />
          </div>
        </div>
      </div>

      <div className={styles["modal-content"]}>{props.children}</div>

      <div className={styles["modal-footer"]}>
        {props.footer}
        <div className={styles["modal-actions"]}>
          {props.actions?.map((action, i) => (
            <div key={i} className={styles["modal-action"]}>
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function showModal(props: ModalProps) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    props.onClose?.();
    root.unmount();
    div.remove();
  };

  div.onclick = (e) => {
    if (e.target === div) {
      closeModal();
    }
  };

  root.render(<Modal {...props} onClose={closeModal}></Modal>);
}

export type ToastProps = {
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  onClose?: () => void;
};

export function Toast(props: ToastProps) {
  return (
    <div className={styles["toast-container"]}>
      <div className={styles["toast-content"]}>
        <span>{props.content}</span>
        {props.action && (
          <button
            onClick={() => {
              props.action?.onClick?.();
              props.onClose?.();
            }}
            className={styles["toast-action"]}
          >
            {props.action.text}
          </button>
        )}
      </div>
    </div>
  );
}

export function showToast(
  content: string,
  action?: ToastProps["action"],
  delay = 3000,
) {
  const div = document.createElement("div");
  div.className = styles.show;
  document.body.appendChild(div);

  const root = createRoot(div);
  const close = () => {
    div.classList.add(styles.hide);

    setTimeout(() => {
      root.unmount();
      div.remove();
    }, 300);
  };

  setTimeout(() => {
    close();
  }, delay);

  root.render(<Toast content={content} action={action} onClose={close} />);
}

export type InputProps = React.HTMLProps<HTMLTextAreaElement> & {
  autoHeight?: boolean;
  rows?: number;
};

export function Input(props: InputProps) {
  return (
    <textarea
      {...props}
      className={clsx(styles["input"], props.className)}
    ></textarea>
  );
}

export function PasswordInput(
  props: HTMLProps<HTMLInputElement> & { aria?: string },
) {
  const [visible, setVisible] = useState(false);
  function changeVisibility() {
    setVisible(!visible);
  }

  return (
    <div className={"password-input-container"}>
      <IconButton
        aria={props.aria}
        icon={visible ? <EyeIcon /> : <EyeOffIcon />}
        onClick={changeVisibility}
        className={"password-eye"}
      />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={"password-input"}
      />
    </div>
  );
}

export function Select(
  props: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement> & {
      align?: "left" | "center";
    },
    HTMLSelectElement
  >,
) {
  const { className, children, align, ...otherProps } = props;
  return (
    <div
      className={clsx(
        styles["select-with-icon"],
        {
          [styles["left-align-option"]]: align === "left",
        },
        className,
      )}
    >
      <select className={styles["select-with-icon-select"]} {...otherProps}>
        {children}
      </select>
      <DownIcon className={styles["select-with-icon-icon"]} />
    </div>
  );
}

export function showConfirm(content: any) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    root.unmount();
    div.remove();
  };

  return new Promise<boolean>((resolve) => {
    root.render(
      <Modal
        title={Locale.UI.Confirm}
        actions={[
          <IconButton
            key="cancel"
            text={Locale.UI.Cancel}
            onClick={() => {
              resolve(false);
              closeModal();
            }}
            icon={<CancelIcon />}
            tabIndex={0}
            bordered
            shadow
          ></IconButton>,
          <IconButton
            key="confirm"
            text={Locale.UI.Confirm}
            type="primary"
            onClick={() => {
              resolve(true);
              closeModal();
            }}
            icon={<ConfirmIcon />}
            tabIndex={0}
            autoFocus
            bordered
            shadow
          ></IconButton>,
        ]}
        onClose={closeModal}
      >
        {content}
      </Modal>,
    );
  });
}

function PromptInput(props: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const [input, setInput] = useState(props.value);
  const onInput = (value: string) => {
    props.onChange(value);
    setInput(value);
  };

  return (
    <textarea
      className={styles["modal-input"]}
      autoFocus
      value={input}
      onInput={(e) => onInput(e.currentTarget.value)}
      rows={props.rows ?? 3}
    ></textarea>
  );
}

export function showPrompt(content: any, value = "", rows = 3) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    root.unmount();
    div.remove();
  };

  return new Promise<string>((resolve) => {
    let userInput = value;

    root.render(
      <Modal
        title={content}
        actions={[
          <IconButton
            key="cancel"
            text={Locale.UI.Cancel}
            onClick={() => {
              closeModal();
            }}
            icon={<CancelIcon />}
            bordered
            shadow
            tabIndex={0}
          ></IconButton>,
          <IconButton
            key="confirm"
            text={Locale.UI.Confirm}
            type="primary"
            onClick={() => {
              resolve(userInput);
              closeModal();
            }}
            icon={<ConfirmIcon />}
            bordered
            shadow
            tabIndex={0}
          ></IconButton>,
        ]}
        onClose={closeModal}
      >
        <PromptInput
          onChange={(val) => (userInput = val)}
          value={value}
          rows={rows}
        ></PromptInput>
      </Modal>,
    );
  });
}

export function showImageModal(
  img: string,
  defaultMax?: boolean,
  style?: CSSProperties,
  boxStyle?: CSSProperties,
) {
  showModal({
    title: Locale.Export.Image.Modal,
    defaultMax: defaultMax,
    children: (
      <div style={{ display: "flex", justifyContent: "center", ...boxStyle }}>
        <img
          src={img}
          alt="preview"
          style={
            style ?? {
              maxWidth: "100%",
            }
          }
        ></img>
      </div>
    ),
  });
}

export function Selector<T>(props: {
  items: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
  }>;
  defaultSelectedValue?: T[] | T;
  onSelection?: (selection: T[]) => void;
  onClose?: () => void;
  multiple?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState<T[]>(
    Array.isArray(props.defaultSelectedValue)
      ? props.defaultSelectedValue
      : props.defaultSelectedValue !== undefined
        ? [props.defaultSelectedValue]
        : [],
  );

  const handleSelection = (e: MouseEvent, value: T) => {
    if (props.multiple) {
      e.stopPropagation();
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      props.onSelection?.(newSelectedValues);
    } else {
      setSelectedValues([value]);
      props.onSelection?.([value]);
      props.onClose?.();
    }
  };

  return (
    <div className={styles["selector"]} onClick={() => props.onClose?.()}>
      <div className={styles["selector-content"]}>
        <List>
          {props.items.map((item, i) => {
            const selected = selectedValues.includes(item.value);
            return (
              <ListItem
                className={clsx(styles["selector-item"], {
                  [styles["selector-item-disabled"]]: item.disable,
                })}
                key={i}
                title={item.title}
                subTitle={item.subTitle}
                onClick={(e) => {
                  if (item.disable) {
                    e.stopPropagation();
                  } else {
                    handleSelection(e, item.value);
                  }
                }}
              >
                {selected ? (
                  <div
                    style={{
                      height: 10,
                      width: 10,
                      backgroundColor: "var(--primary)",
                      borderRadius: 10,
                    }}
                  ></div>
                ) : (
                  <></>
                )}
              </ListItem>
            );
          })}
        </List>
      </div>
    </div>
  );
}
export function FullScreen(props: any) {
  const { children, right = 10, top = 10, ...rest } = props;
  const ref = useRef<HTMLDivElement>();
  const [fullScreen, setFullScreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);
  useEffect(() => {
    const handleScreenChange = (e: any) => {
      if (e.target === ref.current) {
        setFullScreen(!!document.fullscreenElement);
      }
    };
    document.addEventListener("fullscreenchange", handleScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleScreenChange);
    };
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }} {...rest}>
      <div style={{ position: "absolute", right, top }}>
        <IconButton
          icon={fullScreen ? <MinIcon /> : <MaxIcon />}
          onClick={toggleFullscreen}
          bordered
        />
      </div>
      {children}
    </div>
  );
}

export function ModalSelector<T extends CheckGroupValueType>(props: {
  items: Array<{
    title: string;
    subTitle?: string;
    value: T;
    provider?: string;
  }>;
  defaultSelectedValue?: T;
  onSelection?: (selection: T[]) => void;
  onClose?: () => void;
  multiple?: boolean;
}) {
  const getCheckCardAvatar = (value: string): React.ReactNode => {
    if (value.startsWith("gemini")) {
      return <Icon component={GoogleIcon} />;
    }
    if (value.startsWith("claude")) {
      return <Icon component={ClaudeInstantIcon} />;
    }
    if (value.startsWith("moon")) {
      return <Icon component={MoonShot} />;
    }

    const providerName = value.split("@")[1];
    // console.log('========', providerName)
    if (providerName === "Azure") {
      return <Icon component={AzureIcon} />;
    }
    if (providerName === "OpenAI") {
      return <OpenAIOutlined />;
    }
    if (providerName === "DeepSeek") {
      // return <DeepSeekIcon />;
      return <Icon component={DeepSeekIcon} />;
    }

    return <></>;
  };
  const ifHot = (value: string): React.ReactNode => {
    const hotModels = [
      "gpt-4o@Azure",
      "o1-preview@Azure",
      "gemini-2.0-flash-exp@Google",
    ];
    const recommendModel = [
      "gemini-2.0-flash-thinking-exp@Google",
      "o1-preview@Azure",
      "o1-all@OpenAI",
      "o1-pro-all@OpenAI",
    ];
    const expensiveModel = ["o1-all@OpenAI", "o1-pro-all@OpenAI"];

    const icons: React.ReactNode[] = [];

    if (hotModels.includes(value)) {
      icons.push(<span key="hot">🔥</span>);
    }
    if (recommendModel.includes(value)) {
      icons.push(<span key="recommend">💡</span>);
    }
    if (expensiveModel.includes(value)) {
      icons.push(<span key="expensive">💰</span>);
    }

    return <>{icons}</>;
  };

  const clickMaskEvent = (event: React.MouseEvent) => {
    const div = document.getElementById("modal-mask");
    // console.log('-----', event.target)
    if (event.target === div) {
      props.onClose?.();
    }
  };

  const getProgressColor = (percent: number | undefined): string => {
    if (percent === undefined) {
      return "gray";
    }
    if (percent < 34) {
      return "red";
    }
    if (percent < 67) {
      return "goldenrod";
    }
    return "green";
  };
  const getProgressText = (modelName: string | undefined): string => {
    const percent = getProgressValue(modelName);
    if (percent !== undefined) return `${percent}%`;
    return "load";
  };
  const getProgressValue = (
    modelName: string | undefined,
  ): number | undefined => {
    if (modelName && modelName in modelAvailable) {
      return modelAvailable[modelName].availability * 100;
    }
    return undefined;
  };

  const [modelAvailable, setModelAvailable] = React.useState<
    Record<string, { availability: number }>
  >({});

  type Item = {
    title: string;
    subTitle?: string;
    value: T;
    provider?: string;
  };
  const groupedItems = props.items.reduce((map, current) => {
    // console.log("------", current.provider);
    if (!current.provider) return map;
    if (!map.has(current.provider)) {
      map.set(current.provider, []);
    }
    map.get(current.provider)!.push(current);
    return map;
  }, new Map<string, Item[]>());
  // console.log("555555", groupedItems);

  useEffect(() => {
    // 展开时获取模型的可用率，但是不要阻塞
    const fetchData = async () => {
      try {
        fetch("/api/logs/modelAvailable", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: props.items.map((item) => item.value),
          }),
        })
          .then((response) => response.json())
          .then((results) => {
            setModelAvailable(results.results);
            // console.log("4444444444", results);
          });
      } catch (err) {}
    };
    fetchData();
  }, [props.items]);

  return (
    <div
      onClick={(event) => clickMaskEvent(event)}
      id="modal-mask"
      className={styles["modal-mask"] + " " + styles["modal-mask-container"]}
    >
      <Modal
        title="选择模型"
        onClose={() => props.onClose?.()}
        footer={null}
        is_cus={true}
        defaultMax={true}
      >
        <AntList grid={{ gutter: 16 }}>
          <CheckCard.Group
            size="small"
            defaultValue={props.defaultSelectedValue}
          >
            {Array.from(groupedItems).map(([provider, items]) => (
              <div key={provider}>
                <Divider
                  plain
                  style={{ marginBottom: "4px", marginTop: "-4px" }}
                >
                  {provider}
                </Divider>
                <Row
                  gutter={[16, 8]}
                  style={{
                    marginLeft: "-8px",
                    marginRight: "-8px",
                    display: "flex",
                    justifyContent: "center",
                    rowGap: 0,
                  }}
                >
                  {items.map((item, i) => {
                    const selected = props.defaultSelectedValue === item.value;
                    return (
                      <Col
                        key={i}
                        sm={{ flex: "50%" }}
                        md={{ flex: "20%" }}
                        style={{
                          padding: 0,
                          marginLeft: "8px",
                          margin: "0 4px",
                        }}
                      >
                        <CheckCard
                          title={item.title}
                          description={item.subTitle}
                          value={item.value}
                          extra={ifHot(item.value?.toString() ?? "")}
                          onClick={() => {
                            props.onSelection?.([item.value]);
                            props.onClose?.();
                          }}
                          avatar={getCheckCardAvatar(
                            item.value?.toString() ?? "",
                          )}
                          style={{
                            marginBottom: "8px",
                            width: "250px",
                            marginInlineEnd: 0,
                          }}
                        />
                        <div className={styles["model-select-tip-div"]}>
                          <Progress
                            steps={3}
                            percent={100}
                            size="small"
                            format={() => getProgressText(item.value as string)}
                            strokeColor={getProgressColor(
                              getProgressValue(item.value as string),
                            )}
                            percentPosition={{ align: "start", type: "outer" }}
                          />
                          {/* <span className={styles["model-select-tip-span"]}>24H可用率：</span> */}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ))}
          </CheckCard.Group>
        </AntList>
      </Modal>
    </div>
  );
}
