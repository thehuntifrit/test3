// app.js
import { setupAuthentication } from "./dataManager.js";
import { attachEventListeners } from "./uiEvents.js";
import { displayStatus, renderMobCards } from "./uiRender.js";

document.addEventListener("DOMContentLoaded", () => {
  displayStatus("アプリを初期化中...", "loading");

  // UIイベントを先にバインド
  attachEventListeners();

  // Firebase認証 & データ購読開始
  setupAuthentication();

  // 初期描画（空でもOK、購読後に更新される）
  renderMobCards();
});
