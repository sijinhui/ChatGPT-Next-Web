import DeleteIcon from "../icons/delete.svg";
import styles from "./home.module.scss";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
  DraggableProvided,
} from "@hello-pangea/dnd";

import { useChatStore } from "../store";

import Locale from "../locales";
import { useLocation, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { MaskAvatar } from "./mask";
import { Mask } from "../store/mask";
import { useRef, useEffect } from "react";
import { showConfirm } from "./ui-lib";
import { useMobileScreen } from "../utils";
import clsx from "clsx";

// motion
import QueueAnim from "rc-queue-anim";

function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
  provided: DraggableProvided;
  isMobileScreen: boolean;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.selected]);

  const { pathname: currentPath } = useLocation();
  return (
    <div
      className={clsx(styles["chat-item"], {
        [styles["chat-item-selected"]]:
          props.selected &&
          (currentPath === Path.Chat || currentPath === Path.Home),
      })}
      onClick={props.onClick}
      ref={(ele) => {
        draggableRef.current = ele;
        props.provided.innerRef(ele);
      }}
      {...(props.isMobileScreen ? {} : props.provided.draggableProps)}
      {...(props.isMobileScreen ? {} : props.provided.dragHandleProps)}
      title={`${props.title}\n${Locale.ChatItem.ChatItemCount(props.count)}`}
    >
      {props.narrow ? (
        <div className={styles["chat-item-narrow"]}>
          <div className={clsx(styles["chat-item-avatar"], "no-dark")}>
            <MaskAvatar
              avatar={props.mask.avatar}
              model={props.mask.modelConfig.model}
            />
          </div>
          <div className={styles["chat-item-narrow-count"]}>{props.count}</div>
        </div>
      ) : (
        <>
          <div className={styles["chat-item-title"]}>{props.title}</div>
          <div className={styles["chat-item-info"]}>
            <div className={styles["chat-item-count"]}>
              {Locale.ChatItem.ChatItemCount(props.count)}
            </div>
            <div className={styles["chat-item-date"]}>{props.time}</div>
          </div>
        </>
      )}

      <div
        className={
          styles["chat-item-delete"] +
          ` ${props.isMobileScreen ? styles["chat-item-delete-visible"] : ""}`
        }
        onClickCapture={(e) => {
          props.onDelete?.();
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DeleteIcon />
      </div>
    </div>
  );
}

export function ChatList(props: { narrow?: boolean }) {
  const [sessions, selectedIndex, selectSession, moveSession] = useChatStore(
    (state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.moveSession,
    ],
  );
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();
  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveSession(source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="chat-list"
        renderClone={(provided, snapshot, rubic) => (
          <ChatItem
            title={sessions[rubic.source.index].topic}
            time={new Date(
              sessions[rubic.source.index].lastUpdate,
            ).toLocaleString()}
            count={sessions[rubic.source.index].messages.length}
            key={sessions[rubic.source.index].id}
            id={sessions[rubic.source.index].id}
            index={rubic.source.index}
            selected={rubic.source.index === selectedIndex}
            onClick={() => {
              navigate(Path.Chat);
              selectSession(rubic.source.index);
            }}
            onDelete={async () => {
              if (
                (!props.narrow && !isMobileScreen) ||
                (await showConfirm(Locale.Home.DeleteChat))
              ) {
                chatStore.deleteSession(rubic.source.index);
              }
            }}
            narrow={props.narrow}
            mask={sessions[rubic.source.index].mask}
            provided={provided}
            isMobileScreen={isMobileScreen}
          />
        )}
      >
        {(provided, snapshot) => (
          <div
            className={styles["chat-list"]}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <QueueAnim
              delay={[100, 0]}
              ease={"easeOutQuart"} // "easeInOutQuart"
              duration={[350, 450]}
              animConfig={[
                { opacity: [1, 0], translateY: [0, -30], height: [71, 0] },
                { height: 0 },
              ]}
              // TODO：手机端好像还有点问题,先把拖拽关了
              onEnd={({ key, type, target }) => {
                if (type === "enter") target.style.height = "auto";
              }}
              interval={50}
            >
              {sessions.map((item, i) => (
                <div key={item.id}>
                  <Draggable draggableId={`${item.id}`} index={i}>
                    {(provided, snapshot) => (
                      <ChatItem
                        title={item.topic}
                        time={new Date(item.lastUpdate).toLocaleString()}
                        count={item.messages.length}
                        key={item.id}
                        id={item.id}
                        index={i}
                        selected={i === selectedIndex}
                        onClick={() => {
                          navigate(Path.Chat);
                          selectSession(i);
                        }}
                        onDelete={async () => {
                          if (
                            (!props.narrow && !isMobileScreen) ||
                            (await showConfirm(Locale.Home.DeleteChat))
                          ) {
                            chatStore.deleteSession(i);
                          }
                        }}
                        narrow={props.narrow}
                        mask={item.mask}
                        provided={provided}
                        isMobileScreen={isMobileScreen}
                      />
                    )}
                  </Draggable>
                </div>
              ))}
            </QueueAnim>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
