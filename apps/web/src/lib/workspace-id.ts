export const WS_COOKIE = "zv_ws";
export const WS_HEADER = "x-zv-workspace";

const WS_RE = /^ws_[a-f0-9]{32}$/;

export const isWorkspaceId = (v: string) => WS_RE.test(v);
