namespace chrome.runtime {
  type Message = {type: string; payload?: any};
  export interface Port {
    postMessage: (message: Message) => void;
  }
  export interface PortMessageEvent {
    addListener(callback: (message: Message, port: Port) => void): void;
  }
}
interface ExtensionConnectEvent extends chrome.runtime.ExtensionConnectEvent {}
type ExtensionConnectEventListener = ExtractCallbackType<
  ExtensionConnectEvent['addListener']
>;
interface Port extends chrome.runtime.Port {}
interface PortDisconnectEvent extends chrome.runtime.PortDisconnectEvent {}
type PortDisconnectEventListener = ExtractCallbackType<
  PortDisconnectEvent['addListener']
>;
interface PortMessageEvent extends chrome.runtime.PortMessageEvent {}
type PortMessageEventListener = ExtractCallbackType<
  PortMessageEvent['addListener']
>;
