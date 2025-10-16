// store.js

// アプリ全体で共有する状態をここに集約
const globalState = {
  mobs: [],              // Mobデータ（base + Firestoreマージ後）
  filter: {              // 現在のフィルタ状態
    rank: "ALL",
    name: "",
    areaSets: {}
  },
  user: null,            // Firebase認証ユーザー
  lastUpdated: null      // 最終更新時刻
};

// Getter
function getState() {
  return globalState;
}

// Setter（部分更新）
function setState(partial) {
  Object.assign(globalState, partial);
  globalState.lastUpdated = Date.now();
}

// 個別更新ヘルパー
function setMobs(mobs) {
  globalState.mobs = mobs;
  globalState.lastUpdated = Date.now();
}
function setFilter(filter) {
  globalState.filter = { ...globalState.filter, ...filter };
}
function setUser(user) {
  globalState.user = user;
}

export { globalState, getState, setState, setMobs, setFilter, setUser };
