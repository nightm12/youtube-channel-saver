const tabs = document.getElementById("category-tabs");
const list = document.getElementById("channel-list");
const summary = document.getElementById("summary");
const search = document.getElementById("channel-search");
let selected = "全部";
let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.addEventListener("click", event => {
  if (!event.target.closest?.(".move-control")) document.querySelectorAll(".move-control.open").forEach(item => {
    item.classList.remove("open"); item.querySelector(".move-category")?.setAttribute("aria-expanded", "false");
  });
});

async function render() {
  const { savedChannels = [], categories = ["默认"] } = await chrome.storage.local.get({ savedChannels: [], categories: ["默认"] });
  const names = ["全部", ...new Set(["默认", ...categories, ...savedChannels.map(item => item.category || "默认")])];
  if (!names.includes(selected)) selected = "全部";
  tabs.replaceChildren();
  for (const name of names) {
    const tab = document.createElement("button");
    tab.className = `tab${name === selected ? " active" : ""}`;
    tab.textContent = name;
    tab.addEventListener("click", () => { selected = name; render(); });
    tabs.append(tab);
  }
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = savedChannels.filter(item => {
    const matchesCategory = selected === "全部" || (item.category || "默认") === selected;
    const matchesQuery = !query || `${item.title} ${item.url}`.toLocaleLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
  summary.textContent = `${savedChannels.length} 个频道 · ${names.length - 1} 个分类`;
  list.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = savedChannels.length ? (query ? `没有找到与“${search.value.trim()}”匹配的频道。` : `“${selected}”分类里还没有频道。`) : "还没有收藏频道。前往 YouTube 频道页，在铃铛旁点击“收藏频道”即可添加。";
    list.append(empty);
    return;
  }
  const groups = selected === "全部" ? [...new Set(filtered.map(item => item.category || "默认"))].map(name => [name, filtered.filter(item => (item.category || "默认") === name)]) : [[selected, filtered]];
  for (const [category, channels] of groups) {
    const title = document.createElement("h2");
    title.className = "group-title";
    title.textContent = `${category} · ${channels.length}`;
    const grid = document.createElement("div");
    grid.className = "card-grid";
    for (const channel of channels) {
      const card = document.createElement("article");
      card.className = "card";
      const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = (channel.title || "▶").slice(0, 1).toUpperCase();
      if (channel.avatar) {
        const image = document.createElement("img");
        image.src = channel.avatar;
        image.alt = "";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.addEventListener("error", () => image.remove(), { once: true });
        avatar.replaceChildren(image);
      }
      const details = document.createElement("div"); details.className = "details";
      const link = document.createElement("a"); link.className = "name"; link.href = channel.url; link.target = "_blank"; link.rel = "noopener"; link.textContent = channel.title;
      const url = document.createElement("span"); url.className = "url"; url.textContent = channel.url.replace("https://www.youtube.com", "");
      details.append(link, url);
      const moveWrap = document.createElement("div"); moveWrap.className = "move-control";
      const move = document.createElement("button");
      move.className = "move-category"; move.type = "button";
      move.setAttribute("aria-label", `更改 ${channel.title} 的分类`); move.setAttribute("aria-expanded", "false");
      const currentCategory = document.createElement("span"); currentCategory.textContent = channel.category || "默认";
      const chevron = document.createElement("span"); chevron.textContent = "⌄"; chevron.setAttribute("aria-hidden", "true");
      move.append(currentCategory, chevron);
      const menu = document.createElement("div"); menu.className = "category-menu"; menu.setAttribute("role", "listbox"); menu.setAttribute("aria-label", "选择分类");
      for (const name of names.slice(1)) {
        const option = document.createElement("button"); option.className = "category-option"; option.type = "button";
        option.setAttribute("role", "option"); option.setAttribute("aria-selected", String(name === (channel.category || "默认")));
        const label = document.createElement("span"); label.textContent = name;
        const check = document.createElement("span"); check.textContent = name === (channel.category || "默认") ? "✓" : "";
        option.append(label, check);
        option.addEventListener("click", async () => {
          if (name === (channel.category || "默认")) { moveWrap.classList.remove("open"); move.setAttribute("aria-expanded", "false"); return; }
          const data = await chrome.storage.local.get({ savedChannels: [] });
          await chrome.storage.local.set({ savedChannels: data.savedChannels.map(item => item.id === channel.id ? { ...item, category: name } : item) });
          moveWrap.classList.remove("open");
          move.setAttribute("aria-expanded", "false");
          showToast(`已移动到“${name}”`);
        });
        menu.append(option);
      }
      move.addEventListener("click", event => {
        event.stopPropagation();
        const open = !moveWrap.classList.contains("open");
        document.querySelectorAll(".move-control.open").forEach(item => {
          item.classList.remove("open"); item.querySelector(".move-category")?.setAttribute("aria-expanded", "false");
        });
        moveWrap.classList.toggle("open", open);
        move.setAttribute("aria-expanded", String(open));
      });
      moveWrap.append(move, menu);
      const remove = document.createElement("button"); remove.className = "remove"; remove.type = "button"; remove.title = "移除收藏"; remove.textContent = "×";
      remove.setAttribute("aria-label", `移除 ${channel.title}`);
      remove.addEventListener("click", async () => { const data = await chrome.storage.local.get({ savedChannels: [] }); await chrome.storage.local.set({ savedChannels: data.savedChannels.filter(item => item.id !== channel.id) }); showToast(`已移除“${channel.title}”`); });
      card.append(avatar, details, moveWrap, remove); grid.append(card);
    }
    list.append(title, grid);
  }
}

document.getElementById("new-category").addEventListener("click", async () => {
  const existing = document.getElementById("category-form");
  if (existing) { existing.remove(); return; }
  const form = document.createElement("form");
  form.id = "category-form";
  form.className = "category-form";
  form.innerHTML = '<input name="category" maxlength="40" placeholder="输入分类名称（最多 40 个字符）" aria-label="分类名称" required><button type="submit">创建分类</button><button type="button" class="cancel">取消</button><span class="message" aria-live="polite"></span>';
  document.querySelector(".heading").insertAdjacentElement("afterend", form);
  form.querySelector(".cancel").addEventListener("click", () => form.remove());
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const name = form.elements.category.value.trim();
    if (!name) return;
    const { categories = ["默认"] } = await chrome.storage.local.get({ categories: ["默认"] });
    const duplicate = categories.find(item => item.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (duplicate) {
      selected = duplicate;
      form.querySelector(".message").textContent = `“${duplicate}”已存在，已选中该分类。`;
      render();
      return;
    }
    await chrome.storage.local.set({ categories: [...categories, name] });
    selected = name;
    form.remove();
    render();
  });
  form.elements.category.focus();
});
document.getElementById("backup-export").addEventListener("click", async () => {
  const { savedChannels = [], categories = ["默认"] } = await chrome.storage.local.get({ savedChannels: [], categories: ["默认"] });
  const backup = { format: "youtube-channel-saver", version: 1, exportedAt: new Date().toISOString(), savedChannels, categories };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `youtube-channel-saver-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`已导出 ${savedChannels.length} 个频道的备份`);
});
const backupFile = document.getElementById("backup-file");
document.getElementById("backup-import").addEventListener("click", () => backupFile.click());
backupFile.addEventListener("change", async () => {
  const file = backupFile.files?.[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (backup.format !== "youtube-channel-saver" || !Array.isArray(backup.savedChannels) || !Array.isArray(backup.categories)) {
      throw new Error("不兼容的备份文件");
    }
    const importedChannels = backup.savedChannels.filter(item => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.url === "string");
    const importedCategories = backup.categories.filter(name => typeof name === "string" && name.trim()).map(name => name.trim());
    const current = await chrome.storage.local.get({ savedChannels: [], categories: ["默认"] });
    const channelsById = new Map((current.savedChannels || []).map(item => [item.id, item]));
    for (const channel of importedChannels) channelsById.set(channel.id, channel);
    const categoryNames = [...new Set(["默认", ...(current.categories || []), ...importedCategories, ...importedChannels.map(item => item.category || "默认")])];
    await chrome.storage.local.set({ savedChannels: [...channelsById.values()], categories: categoryNames });
    selected = "全部";
    render();
    showToast(`已恢复 ${importedChannels.length} 个频道`);
  } catch (error) {
    console.error("Channel Saver backup import failed.", error);
    showToast("备份文件无效或无法读取");
  } finally {
    backupFile.value = "";
  }
});
search.addEventListener("input", render);
chrome.storage.onChanged.addListener(render);
render();
