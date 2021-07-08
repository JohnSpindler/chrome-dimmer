type Message = {type: string; payload?: any};
type PortCallback = (port: Port) => void;
type PortDisconnectCallback = PortCallback;
type PortConnectCallback = PortCallback;
type PortMessageCallback = (message: Message, port: Port) => void;

interface PortDisconnectEvent extends chrome.runtime.PortDisconnectEvent {
  addListener(callback: PortCallback): void;
  removeListener(callback: PortCallback): void;
}

interface PortMessageEvent extends chrome.runtime.PortMessageEvent {
  addListener(callback: PortMessageCallback): void;
  removeListener(callback: PortMessageCallback): void;
}

interface Port extends chrome.runtime.Port {
  onDisconnect: PortDisconnectEvent;
  onMessage: PortMessageEvent;
  postMessage(message: Message): void;
}

interface ExtensionConnectEvent extends chrome.runtime.ExtensionConnectEvent {
  addListener(callback: PortCallback): void;
}
