// app.js
import { setupAuthentication } from "./dataManager.js";
import { attachEventListeners } from "./uiEvents.js";
import { displayStatus } from "./uiRender.js";

document.addEventListener("DOMContentLoaded", () => {
  displayStatus("アプリを初期化中...", "loading");
  attachEventListeners();
  setupAuthentication();
});
