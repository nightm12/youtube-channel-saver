(() => {
  const BUTTON_ID = "channel-saver-button";
  const HOST_ID = "channel-saver-host";
  const isSupportedPage = () => {
    const path = location.pathname;
    return /^\/@[^/]+/.test(path) || /^\/channel\/[^/]+/.test(path) || /^\/c\/[^/]+/.test(path)
      || /^\/user\/[^/]+/.test(path) || path === "/watch" || path.startsWith("/shorts/");
  };
  const getChannel = () => {
    const path = location.pathname;
    const isChannelPage = /^\/@[^/]+/.test(path) || /^\/channel\/[^/]+/.test(path) || /^\/c\/[^/]+/.test(path) || /^\/user\/[^/]+/.test(path);
    let url;
    let title;
    let avatar = "";
    if (isChannelPage) {
      const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
      url = new URL(canonical, location.origin);
      title = document.querySelector("ytd-channel-name yt-formatted-string")?.textContent?.trim()
        || document.querySelector("#channel-name")?.textContent?.trim()
        || document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim();
      avatar = document.querySelector("#avatar img, ytd-channel-avatar-editor img, #channel-header-container #avatar img")?.src || "";
    } else if (path === "/watch" || path.startsWith("/shorts/")) {
      const owner = document.querySelector("ytd-video-owner-renderer");
      const link = owner?.querySelector("a[href^='/@'], a[href^='/channel/'], a[href^='/c/'], a[href^='/user/']");
      if (!link) return null;
      url = new URL(link.getAttribute("href"), location.origin);
      title = owner.querySelector("#channel-name, #upload-info #channel-name")?.textContent?.trim() || link.textContent.trim();
      avatar = owner.querySelector("#avatar img, yt-img-shadow#avatar img")?.src || "";
    } else return null;
    const id = url.pathname.replace(/\/$/, "");
    return title && id ? { id, title, url: `https://www.youtube.com${id}`, avatar, savedAt: Date.now() } : null;
  };

  function showToast(message, isError = false) {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0 0 auto;z-index:2147483647;pointer-events:none";
    const shadow = host.attachShadow({ mode: "open" });
    const toast = document.createElement("div");
    toast.textContent = message;
    const style = document.createElement("style");
    style.textContent = `div{width:max-content;max-width:calc(100vw - 32px);margin:22px auto 0;padding:12px 18px;border-radius:10px;background:${isError ? "#b3261e" : "#0f9d58"};color:white;font:500 14px Roboto,Arial,sans-serif;box-shadow:0 4px 18px #0006;animation:enter .18s ease-out}@keyframes enter{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`;
    shadow.append(style, toast);
    document.body.append(host);
    setTimeout(() => host.remove(), 2400);
  }

  function channelHeaderActions() {
    if (location.pathname === "/watch" || location.pathname.startsWith("/shorts/")) {
      const bellControl = document.querySelector("ytd-video-owner-renderer #subscribe-button")
        || document.querySelector("#owner #subscribe-button");
      return bellControl ? { container: bellControl.parentElement, after: bellControl } : null;
    }
    const flexibleActions = document.querySelector("yt-flexible-actions-view-model");
    const actionRow = flexibleActions?.querySelector(".ytFlexibleActionsViewModelActionRow");
    const actionButtons = Array.from(flexibleActions?.querySelectorAll("button") || []);
    const joinButton = actionButtons.find(item => /加入此频道|\b加入\b|\bjoin\b/i.test(`${item.getAttribute("aria-label") || ""} ${item.innerText || ""}`));
    const subscribeButton = actionButtons.find(item => /订阅|已订阅|subscribe/i.test(`${item.getAttribute("aria-label") || ""} ${item.innerText || ""}`));
    const targetButton = joinButton || subscribeButton;
    const targetAction = targetButton?.closest(".ytFlexibleActionsViewModelAction");
    if (actionRow && targetAction) {
      return {
        container: actionRow,
        after: targetAction,
        wrapperClass: targetAction.className,
        buttonClass: targetButton.className,
        nativeStyle: true
      };
    }
    const header = document.querySelector("yt-page-header-renderer, ytd-page-header-renderer, ytd-c4-tabbed-header-renderer, #page-header");
    const bellControl = header?.querySelector("#subscribe-button")
      || document.querySelector("ytd-c4-tabbed-header-renderer #subscribe-button, yt-page-header-renderer #subscribe-button, ytd-page-header-renderer #subscribe-button");
    if (bellControl?.parentElement) return { container: bellControl.parentElement, after: bellControl };
    const container = header?.querySelector("#buttons, #actions, #page-header-container #buttons")
      || document.querySelector("#buttons.ytd-c4-tabbed-header-renderer")
      || document.querySelector("ytd-c4-tabbed-header-renderer #buttons, yt-page-header-renderer #buttons, ytd-page-header-renderer #buttons")
      || document.querySelector("#page-header #buttons");
    return container ? { container } : null;
  }

  function chooseCategory(categories, channelTitle, onSave) {
    return new Promise(resolve => {
      const host = document.createElement("div");
      host.style.cssText = "position:fixed;inset:0;z-index:2147483647";
      const shadow = host.attachShadow({ mode: "open" });
      shadow.innerHTML = `
        <style>
          *{box-sizing:border-box}.scrim{position:fixed;inset:0;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.62);font:14px Roboto,Arial,sans-serif;color:#f1f1f1;opacity:0;transition:opacity .18s ease}
          .panel{width:min(460px,100%);max-height:min(700px,calc(100vh - 40px));overflow:auto;padding:23px;border-radius:17px;background:#212121;box-shadow:0 16px 54px rgba(0,0,0,.5);border:1px solid #383838;opacity:0;transform:translateY(12px) scale(.985);transition:opacity .2s ease,transform .2s ease}
          .scrim.open{opacity:1}.scrim.open .panel{opacity:1;transform:translateY(0) scale(1)}.scrim.closing{opacity:0}.scrim.closing .panel{opacity:0;transform:translateY(7px) scale(.99)}
          .eyebrow{margin:0 0 5px;color:#aaa;font-size:12px}h2{font-size:19px;margin:0 0 7px}p.sub{margin:0 0 20px;color:#aaa;line-height:1.5;overflow-wrap:anywhere}
          .section-label{display:flex;align-items:center;justify-content:space-between;margin:0 0 9px;color:#ddd;font-size:13px}.count{color:#888;font-size:12px}
          .categories{display:grid;gap:7px;max-height:260px;overflow:auto;padding:1px 2px 3px}
          .category{width:100%;min-height:46px;display:flex;align-items:center;gap:11px;border:1px solid #3a3a3a;border-radius:11px;padding:8px 12px;background:#181818;color:#eee;text-align:left;font:inherit;cursor:pointer;transition:background .15s,border-color .15s,transform .15s}
          .category:hover{background:#292929;transform:translateY(-1px)}.category[aria-checked=true]{border-color:#3ea6ff;background:#202a31}
          .folder{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;background:#303030;color:#c7e0f4;font-size:15px}.category-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.check{color:#7fc5ff;opacity:0;transition:opacity .15s}.category[aria-checked=true] .check{opacity:1}
          .new-toggle{margin-top:10px;padding:8px 0;border:0;background:transparent;color:#8ab4f8;font:500 13px Roboto,Arial,sans-serif;cursor:pointer}.new-toggle:hover{color:#b5d4ff}
          .new-box{display:flex;gap:8px;overflow:hidden;max-height:0;opacity:0;transform:translateY(-4px);transition:max-height .18s ease,opacity .18s ease,transform .18s ease}.new-box.visible{max-height:55px;opacity:1;transform:translateY(0)}
          input{min-width:0;flex:1;height:40px;border:1px solid #555;border-radius:9px;padding:0 12px;background:#181818;color:#f1f1f1;font:inherit;outline:none}input:focus{border-color:#3ea6ff}
          .create{height:40px;border:0;border-radius:20px;padding:0 14px;background:#3f3f3f;color:#f1f1f1;font:500 13px Roboto,Arial,sans-serif;cursor:pointer;white-space:nowrap}.create:hover{background:#505050}
          .status{min-height:18px;margin:8px 0 0;color:#ffb4ab;font-size:12px}.status.success{color:#8bd49c}
          .actions{display:flex;justify-content:flex-end;gap:10px;margin-top:17px;padding-top:15px;border-top:1px solid #383838}
          button.action{height:39px;border:0;border-radius:20px;padding:0 18px;font:500 14px Roboto,Arial,sans-serif;cursor:pointer;transition:background .15s,transform .15s,opacity .15s}
          .cancel{background:#3f3f3f;color:#f1f1f1}.save{background:#f1f1f1;color:#0f0f0f}.cancel:hover{background:#505050}.save:hover{background:#ddd}.action:active{transform:scale(.97)}.action:disabled{opacity:.55;cursor:wait}
          @media(prefers-reduced-motion:reduce){*,*:before,*:after{transition:none!important;animation:none!important}}
        </style>
        <div class="scrim"><section class="panel" role="dialog" aria-modal="true" aria-labelledby="title">
          <p class="eyebrow">保存频道</p><h2 id="title">选择收藏分类</h2><p class="sub" id="channel-title"></p>
          <div class="section-label"><span>保存到</span><span class="count" id="category-count"></span></div>
          <div class="categories" id="categories" role="radiogroup" aria-label="收藏分类"></div>
          <button class="new-toggle" type="button" aria-expanded="false">＋ 新建分类</button>
          <div class="new-box"><input id="new-category" type="text" maxlength="40" placeholder="输入分类名称" autocomplete="off"><button class="create" type="button">创建并选择</button></div>
          <div class="status" aria-live="polite"></div>
          <div class="actions"><button class="action cancel" type="button">取消</button><button class="action save" type="button">保存频道</button></div>
        </section></div>`;
      const scrim = shadow.querySelector(".scrim");
      const categoryList = shadow.querySelector("#categories");
      const input = shadow.querySelector("#new-category");
      const status = shadow.querySelector(".status");
      const saveButton = shadow.querySelector(".save");
      const cancelButton = shadow.querySelector(".cancel");
      const uniqueCategories = [...new Set(["默认", ...categories.map(name => String(name).trim()).filter(Boolean)])];
      let selected = "默认";
      let saving = false;
      let closed = false;
      shadow.querySelector("#channel-title").textContent = channelTitle ? `频道：${channelTitle}` : "选择一个分类，之后可在收藏页调整。";
      shadow.querySelector("#category-count").textContent = `${uniqueCategories.length} 个分类`;
      function renderCategories() {
        categoryList.replaceChildren();
        for (const name of uniqueCategories) {
          const row = document.createElement("button");
          row.type = "button";
          row.className = "category";
          row.setAttribute("role", "radio");
          row.setAttribute("aria-checked", String(selected === name));
          row.innerHTML = '<span class="folder" aria-hidden="true">▰</span><span class="category-name"></span><span class="check" aria-hidden="true">✓</span>';
          row.querySelector(".category-name").textContent = name;
          row.addEventListener("click", () => { selected = name; status.textContent = ""; status.className = "status"; renderCategories(); });
          categoryList.append(row);
        }
      }
      renderCategories();
      const finish = value => {
        if (closed) return;
        closed = true;
        scrim.classList.remove("open"); scrim.classList.add("closing");
        setTimeout(() => { host.remove(); resolve(value); }, 190);
      };
      shadow.querySelector(".new-toggle").addEventListener("click", event => {
        const box = shadow.querySelector(".new-box");
        const show = !box.classList.contains("visible");
        box.classList.toggle("visible", show);
        event.currentTarget.setAttribute("aria-expanded", String(show));
        if (show) input.focus();
      });
      shadow.querySelector(".create").addEventListener("click", () => {
        const name = input.value.trim();
        if (!name) { status.textContent = "请输入分类名称。"; status.className = "status"; input.focus(); return; }
        const duplicate = uniqueCategories.find(item => item.toLocaleLowerCase() === name.toLocaleLowerCase());
        if (duplicate) {
          selected = duplicate;
          status.textContent = `“${duplicate}”已存在，已为你选中。`;
          status.className = "status success";
        } else {
          uniqueCategories.push(name);
          selected = name;
          status.textContent = `已添加“${name}”，保存频道时会一并创建分类。`;
          status.className = "status success";
          shadow.querySelector("#category-count").textContent = `${uniqueCategories.length} 个分类`;
        }
        input.value = "";
        renderCategories();
        shadow.querySelector(".new-box").classList.remove("visible");
        shadow.querySelector(".new-toggle").setAttribute("aria-expanded", "false");
      });
      shadow.querySelector(".new-box").addEventListener("keydown", event => {
        if (event.key === "Enter") { event.preventDefault(); shadow.querySelector(".create").click(); }
      });
      cancelButton.addEventListener("click", () => { if (!saving) finish(null); });
      scrim.addEventListener("click", event => { if (event.target === scrim && !saving) finish(null); });
      shadow.addEventListener("keydown", event => { if (event.key === "Escape" && !saving) finish(null); });
      saveButton.addEventListener("click", async () => {
        if (saving) return;
        const pendingName = input.value.trim();
        if (pendingName) {
          const duplicate = uniqueCategories.find(item => item.toLocaleLowerCase() === pendingName.toLocaleLowerCase());
          selected = duplicate || pendingName;
          if (!duplicate) uniqueCategories.push(pendingName);
          shadow.querySelector("#category-count").textContent = `${uniqueCategories.length} 个分类`;
          renderCategories();
        }
        saving = true;
        saveButton.disabled = true; cancelButton.disabled = true;
        saveButton.textContent = "保存中…";
        status.textContent = "正在保存频道和分类…"; status.className = "status";
        try {
          await onSave(selected, uniqueCategories);
          status.textContent = "保存成功"; status.className = "status success";
          finish(selected);
        } catch (error) {
          saving = false;
          saveButton.disabled = false; cancelButton.disabled = false;
          saveButton.textContent = "重试保存";
          status.textContent = "保存失败，请检查扩展是否已启用后重试。";
          status.className = "status";
          console.error("Channel Saver save failed.", error);
        }
      });
      document.body.append(host);
      requestAnimationFrame(() => { scrim.classList.add("open"); saveButton.focus(); });
    });
  }

  async function refreshButton() {
    try {
      if (!chrome.runtime?.id) return;
      const channel = getChannel();
      let button = document.getElementById(BUTTON_ID);
      let host = document.getElementById(HOST_ID);
      if (!channel) { host?.remove(); return; }
      const placement = channelHeaderActions();
      if (!placement?.container) return;
      if (!button) {
        button = document.createElement("button");
        button.id = BUTTON_ID;
        button.type = "button";
        host = host || document.createElement("div");
        host.id = HOST_ID;
        host.append(button);
        button.addEventListener("click", async () => {
          try {
            const current = getChannel();
            if (!current || !chrome.runtime?.id) return;
            const { savedChannels = [], categories = ["默认"] } = await chrome.storage.local.get({ savedChannels: [], categories: ["默认"] });
            const existing = savedChannels.find(item => item.id === current.id);
            if (existing) {
              await chrome.storage.local.set({ savedChannels: savedChannels.filter(item => item.id !== current.id) });
              renderButton(button, false);
              showToast("已从收藏中移除");
              return;
            }
            const category = await chooseCategory(categories, current.title, async (chosen, categoryNames) => {
              const nextChannels = [{ ...current, category: chosen, savedAt: Date.now() }, ...savedChannels.filter(item => item.id !== current.id)];
              await chrome.storage.local.set({ categories: categoryNames, savedChannels: nextChannels });
              const verified = await chrome.storage.local.get({ savedChannels: [] });
              if (!verified.savedChannels.some(item => item.id === current.id && item.category === chosen)) throw new Error("Saved channel verification failed.");
            });
            if (category === null) return;
            renderButton(button, true);
            showToast(`已收藏到「${category}」`);
          } catch (error) {
            if (!String(error?.message || error).includes("Extension context invalidated")) {
              console.error("Channel Saver could not update the saved list.", error);
              showToast("保存没有完成，请重新打开收藏面板再试一次", true);
            }
          }
        });
      }
      if (!host) {
        host = document.createElement("div");
        host.id = HOST_ID;
        button.replaceWith(host);
        host.append(button);
      }
      if (placement.nativeStyle) {
        host.className = placement.wrapperClass;
        host.style.display = "";
        button.className = placement.buttonClass;
        button.classList.add("channel-saver-native");
        button.setAttribute("aria-label", "收藏频道");
        button.title = "收藏频道";
        if (!button.querySelector(".ytSpecButtonShapeNextButtonTextContent")) {
          button.innerHTML = '<div aria-hidden="true" class="ytSpecButtonShapeNextIcon ytSpecButtonShapeNextElevatedContent"><span class="ytIconWrapperHost" style="width:24px;height:24px"><span class="yt-icon-shape ytSpecIconShapeHost"><div style="width:100%;height:100%;display:block;fill:currentcolor"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events:none;display:inherit;width:100%;height:100%"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg></div></span></span></div><div class="ytSpecButtonShapeNextButtonTextContent ytSpecButtonShapeNextElevatedContent"></div>';
        }
      } else {
        host.className = "channel-saver-host";
        host.style.display = "contents";
        if (button.classList.contains("channel-saver-native")) button.textContent = "";
        button.className = "";
        button.removeAttribute("title");
        button.setAttribute("aria-label", "收藏频道");
      }
      if (host.parentElement !== placement.container || (placement.after && host.previousElementSibling !== placement.after)) {
        if (placement.after) placement.after.insertAdjacentElement("afterend", host);
        else placement.container.append(host);
      }
      const { savedChannels = [] } = await chrome.storage.local.get({ savedChannels: [] });
      renderButton(button, savedChannels.some(item => item.id === channel.id));
    } catch (error) {
      if (!String(error?.message || error).includes("Extension context invalidated")) console.error("Channel Saver could not refresh the button.", error);
    }
  }

  function renderButton(button, saved) {
    const label = saved ? "✓ 已收藏" : "＋ 收藏频道";
    const labelNode = button.querySelector(".ytSpecButtonShapeNextButtonTextContent");
    if (labelNode) {
      if (labelNode.textContent !== (saved ? "已收藏" : "收藏频道")) labelNode.textContent = saved ? "已收藏" : "收藏频道";
    } else if (button.textContent !== label) button.textContent = label;
    if (button.getAttribute("aria-pressed") !== String(saved)) button.setAttribute("aria-pressed", String(saved));
  }

  let refreshScheduled = false;
  function scheduleRefresh(delay = 100) {
    if (refreshScheduled) return;
    refreshScheduled = true;
    setTimeout(() => {
      refreshScheduled = false;
      void refreshButton();
    }, delay);
  }

  const observer = new MutationObserver(() => {
    // Only use DOM mutations to discover the initial button. Re-running on every
    // YouTube mutation caused repeated storage reads and UI updates.
    if (isSupportedPage() && !document.getElementById(BUTTON_ID)) scheduleRefresh();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("yt-navigate-finish", () => {
    scheduleRefresh(0);
    setTimeout(() => scheduleRefresh(0), 500);
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.savedChannels) scheduleRefresh(0);
  });
  scheduleRefresh(0);
})();
