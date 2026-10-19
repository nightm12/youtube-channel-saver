const list = document.getElementById("channels");
const count = document.getElementById("count");
const search = document.getElementById("search");
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  const selected = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = selected;
  themeToggle.textContent = selected === "dark" ? "☀" : "☾";
  themeToggle.title = selected === "dark" ? "切换到浅色背景" : "切换到深色背景";
  themeToggle.setAttribute("aria-label", themeToggle.title);
}

async function render() {
  const { savedChannels = [] } = await chrome.storage.local.get({ savedChannels: [] });
  const query = search.value.trim().toLocaleLowerCase();
  const visible = savedChannels.filter(item =>
    String(item.title || "").toLocaleLowerCase().includes(query)
    || String(item.url || "").toLocaleLowerCase().includes(query)
    || String(item.category || "默认").toLocaleLowerCase().includes(query)
  );
  count.textContent = `${savedChannels.length} 个频道`;
  list.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = savedChannels.length
      ? "没有找到匹配的频道。\n试试其他名称或分类。"
      : "还没有收藏频道。\n打开 YouTube 频道页，点击「收藏频道」即可添加。";
    list.append(empty);
    return;
  }
  for (const [index, channel] of visible.entries()) {
    const row = document.createElement("div");
    row.className = "channel";
    row.style.animationDelay = `${Math.min(index * 25, 150)}ms`;
    const avatar = document.createElement("img");
    avatar.className = "channel-avatar";
    avatar.alt = "";
    avatar.loading = "lazy";
    avatar.src = channel.avatar || "assets/icon-48.png";
    avatar.addEventListener("error", () => { avatar.src = "assets/icon-48.png"; }, { once: true });
    const link = document.createElement("a");
    link.className = "channel-main";
    link.href = channel.url || "https://www.youtube.com";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const name = document.createElement("span");
    name.className = "channel-name";
    name.textContent = channel.title || "未命名频道";
    const url = document.createElement("span");
    url.className = "channel-url";
    const category = document.createElement("span");
    category.className = "category-chip";
    category.textContent = channel.category || "默认";
    category.title = category.textContent;
    const address = document.createElement("span");
    address.textContent = ` · ${(channel.url || "").replace(/^https?:\/\/(www\.)?youtube\.com/i, "")}`;
    url.append(category, address);
    link.append(name, url);
    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "移除收藏";
    remove.setAttribute("aria-label", `移除 ${channel.title || "此频道"}`);
    remove.addEventListener("click", async () => {
      const current = await chrome.storage.local.get({ savedChannels: [] });
      await chrome.storage.local.set({ savedChannels: current.savedChannels.filter(item => item.id !== channel.id) });
    });
    row.append(avatar, link, remove);
    list.append(row);
  }
}

search.addEventListener("input", render);
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    search.focus();
  }
});
themeToggle.addEventListener("click", async () => {
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  await chrome.storage.local.set({ popupTheme: next });
});
document.getElementById("clear").addEventListener("click", async () => {
  const { savedChannels = [] } = await chrome.storage.local.get({ savedChannels: [] });
  if (!savedChannels.length || !confirm("确定清空所有收藏频道吗？")) return;
  await chrome.storage.local.set({ savedChannels: [] });
});
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes.savedChannels) render();
  if (changes.popupTheme) applyTheme(changes.popupTheme.newValue);
});

chrome.storage.local.get({ popupTheme: "dark" }).then(({ popupTheme }) => applyTheme(popupTheme));
render();
