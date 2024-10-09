import { useEffect } from "react";

export default function TestRealTime() {
  useEffect(() => {
    // const ws = WebSocket('ws://localhost:23000')
    // ws.onmessage = (message) => {
    //   const payload = JSON.parse(message.data)
    // }
    // return () => {
    //   ws.close()
    // }
  }, []);

  return <div>My WebSocket test</div>;
}
